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

      if (!record[0].file) {
        await FS.deleteFileForDescendants(address, path);
      }
    } catch (err) {
      throw err;
    }
  },

  deleteFileForDescendants: async (address, path) => {
    try {
      const records = await DB.query({
        sql: 'SELECT * FROM fs WHERE path LIKE ? AND address = ?',
        timeout: 6 * 1000, // 6s
        values: [ `${path}/%`, address ],
      });

      for (const record of records) {
        await DB.query({
          sql: 'DELETE FROM fs WHERE id = ?',
          timeout: 6 * 1000, // 6s
          values: [ record.id ],
        });
      }
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

      const result = await FS.getFile(address, newPath);

      if (!result[0].file) {
        await FS.renameFileForDescendants(address, path, newPath);
      }

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

  renameFileForDescendants: async (address, path, newPath) => {
    try {
      const records = await DB.query({
        sql: 'SELECT * FROM fs WHERE path LIKE ? AND address = ?',
        timeout: 6 * 1000, // 6s
        values: [ `${path}/%`, address ],
      });

      for (const record of records) {
        const newChildPath = newPath + record.path.substr(path.length);

        await DB.query({
          sql: 'UPDATE fs SET path = ? WHERE id = ?',
          timeout: 6 * 1000, // 6s
          values: [ newChildPath, record.id ],
        });
      }
    } catch (err) {
      throw err;
    }
  },

  createFiles: async (address, updates) => {
    try {
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
          file: 1,
          action: 'CREATE',
        }]);
      }
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
        file: 0,
        action: 'CREATE',
      }]);

    } catch (err) {
      throw err;
    }
  },
};

module.exports = FS;
