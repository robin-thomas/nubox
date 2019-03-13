const Session = require('./session/session.js');
const config = require('../../../config.json');

const FS = {
  getFsStructure: async (address) => {
    try {
      return await Session.api(config.api.getFsStructure.name, {address: address});
    } catch (err) {
      throw err;
    }
  },

  deleteFile: async (address, path) => {
    try {
      await Session.api(config.api.deleteFile.name, {
        address: address,
        path: path,
      });
    } catch (err) {
      throw err;
    }
  },
};

module.exports = FS;
