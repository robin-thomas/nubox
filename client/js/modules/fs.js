const moment = require('moment-timezone');

const Session = require('./session/session.js');
const config = require('../../../config.json');

const FS = {
  getFsStructure: async (address) => {
    try {
      let files = await Session.api(config.api.getFsStructure.name, {address: address});

      // Convert dates in UTC to local.
      for (let key of Object.keys(files)) {
        let file = files[key];

        const createdUTC = moment.utc(file.created).toDate();
        file.created = moment(createdUTC).local().format('MMMM DD, YYYY (hh:mm A)');

        if (moment(file.modified).isValid()) {
          const modifiedUTC = moment.utc(file.modified).toDate();
          file.modified = moment(modifiedUTC).local().format('MMMM DD, YYYY (hh:mm A)');
        } else {
          file.modified = file.created;
        }
      }

      return files;
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
      let file = await Session.api(config.api.renameFile.name, {
        address: address,
        path: path,
        newPath: newPath,
      });

      // Convert dates in UTC to local.
      const createdUTC = moment.utc(file.created).toDate();
      file.created = moment(createdUTC).local().format('YYYY-MM-DD HH:mm:ss');
      const modifiedUTC = moment.utc(file.modified).toDate();
      file.modified = moment(modifiedUTC).local().format('YYYY-MM-DD HH:mm:ss');

      return file;
    } catch (err) {
      throw err;
    }
  },

  createFiles: async (address, updates) => {
    try {
      let files = await Session.api(config.api.createFiles.name, {
        address: address,
        updates: updates,
      });

      // Convert dates in UTC to local.
      for (let file of files) {
        const createdUTC = moment.utc(file.created).toDate();
        file.created = moment(createdUTC).local().format('YYYY-MM-DD HH:mm:ss');
      }

      return files;
    } catch (err) {
      throw err;
    }
  },

  createFolder: async (address, path) => {
    try {
      let file = await Session.api(config.api.createFolder.name, {
        address: address,
        path: path,
      });

      // Convert dates in UTC to local.
      const createdUTC = moment.utc(file.created).toDate();
      file.created = moment(createdUTC).local().format('YYYY-MM-DD HH:mm:ss');

      return file;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = FS;
