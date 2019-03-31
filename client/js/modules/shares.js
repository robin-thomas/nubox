const Session = require('./session/session.js');
const config = require('../../../config.json');

const Shares = {
  shareFile: async (address, sharedWith, fileId) => {
    try {
      await Session.api(config.api.shareFile.name, {
        address: address,
        sharedWith: sharedWith,
        fileId: fileId,
      });
    } catch (err) {
      throw err;
    }
  },

  getShares: async (address) => {
    try {
      return await Session.api(config.api.getShares.name, {
        address: address,
      });
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Shares;
