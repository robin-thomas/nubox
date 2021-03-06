const streamSaver = require('./StreamSaver.js');

const Block = {
  getNextBlock: async (hash, writer, label) => {
    try {
      const decryptedB64 = await nuBox.decrypt(hash, label, true /* ipfs */);
      const decrypted = Buffer.from(decryptedB64, 'base64');
      writer.write(decrypted);
    } catch (err) {
      throw err;
    }
  },
};

const Worker = {
  downloadFile: async (ipfsList, fileName, label) => {
    let writer = null;

    try {
      // Create the writeable stream.
      const fileStream = streamSaver.createWriteStream(fileName);
      writer = fileStream.getWriter();

      // Read all the blocks from ipfs and join them.
      for (const hash of ipfsList) {
        await Block.getNextBlock(hash, writer, label);
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
  constructor(ipfsList, fileName, label) {
    this.ipfsList = ipfsList;
    this.fileName = fileName;
    this.label = label;
  }

  async start() {
    try {
      await Worker.downloadFile(this.ipfsList, this.fileName, this.label);
    } catch (err) {
      alert('Issue with downloading from infura!');
      console.log(err);
    }
  }
}

module.exports = FileDownloader;
