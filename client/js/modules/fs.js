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

  getFile: (address, path) => {

  },
};

module.exports = FS;
