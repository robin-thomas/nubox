const Path = require('path');

const DB = require('./db.js');

const Activity = {
  getActivity: async (address) => {
    try {
      const query = {
        sql: 'SELECT a.*, f.* FROM activity AS a WHERE address = ? \
              LEFT JOIN fs AS f ON a.file_id = f.id \
              ORDER BY a.timestamp DESC',
        timeout: 6 * 1000, // 6s
        values: [ address ],
        nestTables: true,
      };
      const records = await DB.query(query);

      let activity = [];

      for (const record of records) {
        const oldFileName = Path.basename(record.a.path);
        const newFileName = Path.basename(record.f.path);

        let content = '';
        switch (record.a.action) {
          case 'CREATE':
            action = record.f.file ? 'uploaded' : 'created';
            content = `You ${action} ${oldFileName}`;
            break;
          case 'RENAME':
            content = `You renamed ${oldFileName} to ${newFileName}`;
            break;
          case 'DELETE':
            content = `You deleted ${oldFileName}`;
            break;
        }

        activity.push({
          content: content,
          timestamp: record.a.timestamp,
        });
      }

      return activity;

    } catch (err) {
      throw err;
    }
  },

  addActivity: async (address, activity) => {
    try {
      for (const act of activity) {
        const query = {
          sql: 'INSERT INTO activity(address, path, file_id, action) \
                VALUES(?,?,?,?)',
          timeout: 6 * 1000, // 6s
          values: [ address, act.path, act.fileId, act.action ],
        };

        await DB.query(query);
      }
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Activity;
