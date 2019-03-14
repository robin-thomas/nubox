const Path = require('path');

const DB = require('./db.js');

const FS = {
  getFsStructure: async (address) => {
    const query = {
      sql: 'SELECT * FROM fs WHERE address = ?',
      timeout: 6 * 1000, // 6s
      values: [ address ],
    };

    try {
      let results = {};

      const out = await DB.query(query);
      for (const result of out) {
        results[result.path] = {
          path: result.path,
          ipfs: JSON.parse(result.ipfs_hash).hash,
          isFile: result.file,
          created: result.timestamp,
        };
      }

      return results;
    } catch (err) {
      throw err;
    }
  },

  getFile: async (address, path) => {
    const query = {
      sql: 'SELECT * FROM fs WHERE address = ? AND path = ?',
      timeout: 6 * 1000, // 6s
      values: [ address, path ],
    };

    try {
      return await DB.query(query);
    } catch (err) {
      throw err;
    }
  },

  deleteFile: async (address, path) => {
    const query = {
      sql: 'SELECT * FROM fs WHERE address = ? AND path = ?',
      timeout: 6 * 1000, // 6s
      values: [ address, path ],
    };

    try {
      await DB.query(query);
    } catch (err) {
      throw err;
    }
  },

  renameFile: async (address, path, newPath) => {
    const query = {
      sql: 'UPDATE fs SET path = ? WHERE address = ? AND path = ?',
      timeout: 6 * 1000, // 6s
      values: [ newPath, address, path ],
    };

    try {
      await DB.query(query);

      const result = await FS.getFile(address, newPath);

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
      for (const file of updates) {
        const ipfs = JSON.stringify({
          hash: file.ipfs,
        });

        const query = {
          sql: 'INSERT INTO fs(address, path, ipfs_hash)',
          timeout: 6 * 1000, // 6s
          values: [ address, file.path, ipfs ],
        };

        await DB.query(query);
      }
    } catch (err) {
      throw err;
    }
  },

  createFolder: async (address, path) => {
    const query = {
      sql: 'INSERT INTO fs(address, path, ipfs_hash, file) \
            VALUES(?, ?, ?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, path, '{\"hash\":[]}', false ],
    };

    try {
      await DB.query(query);

      return await FS.getFile(address, path);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = FS;
