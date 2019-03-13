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
          ipfs: JSON.parse(result.ipfs_hash),
          isFile: result.file,
          created: result.timestamp,
        };
      }

      return results;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = FS;
