const moment = require('moment-timezone');

const Session = require('./session/session.js');
const config = require('../../../config.json');

const Activity = {
  getActivity: async (address) => {
    try {
      return await Session.api(config.api.getActivity.name, {
        address: address,
        timezone: Buffer.from(moment.tz.guess()).toString('base64'),
      });
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Activity;
