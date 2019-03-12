const config = require('../../../../config.json');
const Crypto = require('../crypto/crypto');

const ipfs = require('ipfs-http-client')({
  host: config.infura.ipfs.host,
  port: config.infura.ipfs.port,
  protocol: config.infura.ipfs.protocol,
});

// Get a message from the main thread.
module.exports = function (self) {
  const Block = {
    hasNextBlock: (file, offset) => {
      return (file && offset < file.size) ? true : false;
    },

    // Try to read the next block of file.
    // If the read fails, retry for 3 times (assuming its an interrupted corruption)
    // with an exponential backoff factor.
    getNextBlock: (file, blockSize, offset, retries = 0) => {
      return new Promise((resolve, reject) => {
        if (retries > 3) {
          reject('Tried 3 retries!');
          return;
        }

        const blob = file.slice(offset, blockSize + offset);

        const r = new FileReader();
        r.onload = function(e) {
          if (e.target.error !== null) {
            if ((retries + 1) > 3) {
              reject(e.target.error);
            } else {
              Block.getNextBlock(file, blockSize, offset, retries + 1);
            }
            return;
          }

          resolve(r.result);
          return;
        };

        // exponential backoff.
        if (retries <= 3) {
          const waitTime = Math.pow(2, retries);
          Worker.sleep(waitTime * 1000);
        }
        r.readAsArrayBuffer(blob);
      });
    },

    processBlock: async (pubKey, block, buffer = null, retries = 0) => {
      if (buffer === null) {
        Worker.postMessage({ type: 'status', status: 'Encrypting a block' });
        const encrypted = await Crypto.encrypt(pubKey, block);
        buffer = Buffer.from(encrypted);
      }

      try {
        if (retries === 0) {
          Worker.postMessage({ type: 'status', status: 'Uploading to IPFS' });
        }
        const result = await ipfs.add(buffer);
        Worker.postMessage({ type: 'processing', blockLength: block.byteLength });

        return result[0].hash;
      } catch (err) {
        console.log(err);

        if (retries < 3) {
          Worker.postMessage({ type: 'error', error: 'IPFS upload failed. Retrying' });
          return Block.processBlock(pubKey, block, buffer, retries + 1);
        } else {
          throw err;
        }
      }
    },
  };

  const Worker = {
    postMessage: (msg) => {
      self.postMessage(msg);
    },

    readFile: async (file, blockSize, offset, pubKey) => {
      try {
        const publicKey = pubKey.substring(2);

        let promises = [];
        while (Block.hasNextBlock(file, offset)) {
          const block = await Block.getNextBlock(file, blockSize, offset);
          offset += block.byteLength;

          promises.push(Block.processBlock(publicKey, block));
        }

        // Wait for all blocks to be processed.
        return await Promise.all(promises);
      } catch (err) {
        throw err;
      }
    },

    sleep: (ms) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
  };

  self.addEventListener('message', async (e) => {
    const data = e.data;
    try {
      const results = await Worker.readFile(data.file, data.blockSize, data.offset, data.pubKey);
      Worker.postMessage({ type: 'completed', results: results });
    } catch (err) {
      Worker.postMessage({ type: 'error', error: 'Failed to upload' });
    }
  });
};
