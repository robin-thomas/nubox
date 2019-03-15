const moment = require('moment');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const DB = require('./db.js');
const config = require('../config.json');

const Token = {
  isValidRefreshToken: async (address, refreshToken) => {
    const query = {
      sql: 'SELECT COUNT(id) AS count FROM auth \
            WHERE address = ? AND refresh_token = ? AND expiry > UTC_TIMESTAMP()',
      timeout: 6 * 1000, // 6s
      values: [ address, refreshToken ],
    };

    try {
      const results = await DB.query(query);
      return results[0].count == 1;
    } catch (err) {
      throw err;
    }
  },

  genToken: (address) => {
    const expiresIn = moment().utc().add(config.jwt.expiresInHours, 'hours').format('YYYY-MM-DD HH:mm:ss');
    const token = jwt.sign({user: address}, config.jwt.secret, {expiresIn: config.jwt.expiresIn});

    return {
      token: token,
      expiresIn: expiresIn
    };
  },

  genRefreshToken: async (address) => {
    const refreshToken = crypto.randomBytes(15).toString('hex');
    const expiry = moment().utc().add(1, 'M').format('YYYY-MM-DD HH:mm:ss');

    const query = {
      sql: 'INSERT INTO auth(address, refresh_token, expiry) \
            VALUES(?, ?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, refreshToken, expiry ],
    };

    try {
      await DB.query(query);
      return refreshToken;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Token;
