const Path = require('path');

const DB = require('./db.js');
const Activity = require('./activity.js');

const FS = {
  getFsStructure: async (address) => {
    try {
      let results = {};

      const out = await DB.query({
        sql: 'SELECT *, CONVERT_TZ(timestamp, @@session.time_zone, "+00:00") AS timestamp_utc \
              FROM fs WHERE address = ?',
        timeout: 6 * 1000, // 6s
        values: [ address ],
      });

      for (const result of out) {
        results[result.path] = {
          path: result.path,
          ipfs: JSON.parse(result.ipfs_hash).hash,
          isFile: result.file,
          created: result.timestamp_utc,
          fileSize: result.file_size,
        };
      }

      return results;
    } catch (err) {
      throw err;
    }
  },

  getFile: async (address, path) => {
    try {
      return await DB.query({
        sql: 'SELECT * FROM fs WHERE address = ? AND path = ?',
        timeout: 6 * 1000, // 6s
        values: [ address, path ],
      });
    } catch (err) {
      throw err;
    }
  },

  deleteFile: async (address, path) => {
    try {
      const record = await FS.getFile(address, path);

      await DB.query({
        sql: 'DELETE FROM fs WHERE address = ? AND path = ?',
        timeout: 6 * 1000, // 6s
        values: [ address, path ],
      });

      await Activity.addActivity(address, [{
        path: path,
        file: record[0].file,
        action: 'DELETE',
      }]);

      // TODO: if its a folder, need to delete all of its descendants.
    } catch (err) {
      throw err;
    }
  },

  renameFile: async (address, path, newPath) => {
    try {
      await DB.query({
        sql: 'UPDATE fs SET path = ? WHERE address = ? AND path = ?',
        timeout: 6 * 1000, // 6s
        values: [ newPath, address, path ],
      });

      // TODO: if its a folder, need to change the path of all its descendants.

      const result = await FS.getFile(address, newPath);

      await Activity.addActivity(address, [{
        path: path,
        file: result[0].file,
        action: 'RENAME',
      }]);

      return {
        path: result[0].path,
        ipfs: JSON.parse(result[0].ipfs_hash).hash,
        isFile: result[0].file,
        created: result[0].timestamp,
      };
    } catch (err) {
      throw err;
    }
  },

  createFiles: async (address, updates) => {
    try {
      let results = [];

      for (const file of updates) {
        const ipfs = JSON.stringify({
          hash: file.ipfs,
        });

        await DB.query({
          sql: 'INSERT INTO fs(address, path, ipfs_hash, file_size) VALUES(?,?,?,?)',
          timeout: 6 * 1000, // 6s
          values: [ address, file.path, ipfs, file.size ],
        });

        await Activity.addActivity(address, [{
          path: file.path,
          fileId: 1,
          action: 'CREATE',
        }]);

        results.push(record);
      }

      return results;
    } catch (err) {
      throw err;
    }
  },

  createFolder: async (address, path) => {
    try {
      await DB.query({
        sql: 'INSERT INTO fs(address, path, ipfs_hash, file) \
              VALUES(?, ?, ?, ?)',
        timeout: 6 * 1000, // 6s
        values: [ address, path, '{\"hash\":[]}', false ],

      });

      await Activity.addActivity(address, [{
        path: path,
        fileId: 0,
        action: 'CREATE',
      }]);

      return record;

    } catch (err) {
      throw err;
    }
  },
};

module.exports = FS;
