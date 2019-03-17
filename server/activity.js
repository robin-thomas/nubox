const Path = require('path');
const moment = require('moment-timezone');

const DB = require('./db.js');

const Activity = {
  getActivity: async (address, timezone) => {
    try {
      const query = {
        sql: 'SELECT a.*, f.*, CONVERT_TZ(a.timestamp, @@session.time_zone, "+00:00") AS timestamp_utc FROM activity AS a \
              LEFT JOIN fs AS f ON a.file_id = f.id \
              WHERE a.address = ? \
              ORDER BY a.timestamp DESC',
        timeout: 6 * 1000, // 6s
        values: [ address ],
        nestTables: true,
      };
      const records = await DB.query(query);

      let activity = {};

      for (const record of records) {
        const oldFileName = Path.basename(record.a.path);
        const newFileName = (record.a.action === 'DELETE' ? Path.basename(record.f.path) : null);

        const utcDate = moment.utc(record[''].timestamp_utc).toDate();
        const date = moment(utcDate).tz(timezone).format('YYYY-MM-DD');
        const time = moment(utcDate).tz(timezone).format('hh:mm A');

        if (activity[date] === undefined) {
          activity[date] = {};
        }

        if (activity[date][record.a.action] === undefined) {
          activity[date][record.a.action] = [];
        }

        let action = record.a.action;
        if (action === 'CREATE') {
          action = record.f.file ? 'UPLOAD' : 'CREATE';
        }

        activity[date][action].push({
          oldFileName: oldFileName,
          newFileName: newFileName,
          time: time,
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
