const Path = require('path');
const moment = require('moment-timezone');

const DB = require('./db.js');

const Activity = {
  getActivity: async (address, timezone) => {
    try {
      const query = {
        sql: 'SELECT *, \
              CONVERT_TZ(timestamp, @@session.time_zone, "+00:00") AS timestamp_utc FROM activity \
              WHERE address = ? \
              ORDER BY timestamp DESC',
        timeout: 6 * 1000, // 6s
        values: [ address ],
      };
      const records = await DB.query(query);

      let activity = {};

      for (const record of records) {
        const oldFileName = Path.basename(record.path);

        const utcDate = moment.utc(record.timestamp_utc).toDate();
        const date = moment(utcDate).tz(timezone).format('YYYY-MM-DD');
        const time = moment(utcDate).tz(timezone).format('hh:mm A');

        if (activity[date] === undefined) {
          activity[date] = {};
        }

        let action = record.action;
        if (action === 'CREATE') {
          action = record.file ? 'UPLOAD' : 'CREATE';
        }

        if (activity[date][action] === undefined) {
          activity[date][action] = [];
        }

        activity[date][action].push({
          oldFileName: oldFileName,
          time: time,
          file: record.file,
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
          sql: 'INSERT INTO activity(address, path, file, action) \
                VALUES(?,?,?,?)',
          timeout: 6 * 1000, // 6s
          values: [ address, act.path, act.file, act.action ],
        };

        await DB.query(query);
      }
    } catch (err) {
      throw err;
    }
  }
};

module.exports = Activity;
