const fetch = require('node-fetch');

const config = require('../../../../config.json');

const Crypto = require('../crypto/crypto.js');
const streamSaver = require('./StreamSaver.js');

const ipfsUrl = config.infura.ipfs.gateway;

const Block = {
  getNextBlock: async (url, writer, privKey) => {
    let out = null;
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'text/plain',
        },
      });
      out = await res.text();
    } catch (err) {
      throw err;
    }

    try {
      const decrypted = await Crypto.decrypt(privKey, out);
      writer.write(decrypted);
    } catch (err) {
      throw new Error('Invalid private key!');
    }
  },
};

const Worker = {
  downloadFile: async (ipfsList, fileName, privKey) => {
    let writer = null;

    try {
      // Create the writeable stream.
      const fileStream = streamSaver.createWriteStream(fileName);
      writer = fileStream.getWriter();

      // Read all the blocks from ipfs and join them.
      for (const hash of ipfsList) {
        const url = ipfsUrl + hash;
        await Block.getNextBlock(url, writer, privKey);
      }

      // Close the stream.
      writer.close();

    } catch (err) {
      if (writer !== null) {
        writer.abort();
      }

      throw err;
    }
  },
};

class FileDownloader {
  constructor(ipfsList, fileName, privKey) {
    this.ipfsList = ipfsList;
    this.fileName = fileName;
    this.privKey  = privKey;
  }

  async start() {
    try {
      await Worker.downloadFile(this.ipfsList, this.fileName, this.privKey);
    } catch (err) {
      if (err.message === 'Invalid private key!') {
        alert(err.message);
      } else {
        alert('Unable to download the file due to Infura! :/');
      }
    }
  }
}

module.exports = FileDownloader;
