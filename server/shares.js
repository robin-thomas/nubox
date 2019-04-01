const DB = require('./db.js');

const Shares = {
  isFileShared: async (address, fileId) => {
    try {
      const query = {
        sql: 'SELECT * FROM shares WHERE sharer = ? AND file_id = ? LIMIT 1',
        timeout: 6 * 1000, // 6s
        values: [ address, fileId ],
      };

      const results = await DB.query(query);
      return results.length > 0;
    } catch (err) {
      throw err;
    }
  },

  shareFile: async (sharer, sharedWith, fileId) => {
    try {
      const query = {
        sql: 'INSERT INTO shares(sharer, shared_with, file_id) \
              VALUES(?,?,?)',
        timeout: 6 * 1000, // 6s
        values: [ sharer, sharedWith, fileId ],
      };

      await DB.query(query);

      // TODO: add as an activity.
    } catch (err) {
      throw err;
    }
  },

  getSharedWith: async (address, fileId) => {
    try {
      const sharers = await DB.query({
        sql: 'SELECT shared_with FROM shares WHERE sharer = ? AND file_id = ?',
        timeout: 6 * 1000, // 6s
        values: [ address, fileId ],
      });

      return (sharers === undefined || sharers === null) ? [] : sharers;
    } catch (err) {
      throw err;
    }
  },

  getShares: async (address) => {
    try {
      const results = await DB.query({
        sql: 'SELECT path FROM shares WHERE shared_with = ?',
        timeout: 6 * 1000, // 6s
        values: [ address ],
      });

      let output = [];
      for (const result of results) {

        try {
          const files = await DB.query({
            sql: 'SELECT * FROM fs WHERE id = ?',
            timeout: 6 * 1000, // 6s
            values: [ result.file_id ],
          });

          if (files.length > 0) {
            output.push(files[0]);
          }
        } catch (err) {}
      }

      return output;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Shares;
