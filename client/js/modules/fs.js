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

  renameFile: async (address, path, newPath) => {
    try {
      return await Session.api(config.api.renameFile.name, {
        address: address,
        path: path,
        newPath: newPath,
      });
    } catch (err) {
      throw err;
    }
  },

  createFiles: async (address, updates) => {
    try {
      try {
        return await Session.api(config.api.createFiles.name, {
          address: address,
          updates: updates,
        });
      } catch (err) {
        throw err;
      }
    }
  },

  createFolder: async (address, path) => {
    try {
      try {
        return await Session.api(config.api.createFolder.name, {
          address: address,
          path: path,
        });
      } catch (err) {
        throw err;
      }
    }
  },
};

module.exports = FS;
