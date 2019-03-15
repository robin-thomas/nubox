const fetch = require('node-fetch');
const moment = require('moment');

const Cookie = require('./cookie.js');
const Metamask = require('../crypto/metamask.js');

const config = require('../../../../config.json');

const Token = {
  getToken: async (msg, sig, address) => {
    try {
      const ret = await fetch(config.api.login.path, {
        method: config.api.login.method,
        body: JSON.stringify({msg: msg, sig: sig, address: address}),
        headers: config.api.login.headers,
      });

      const json = await ret.json();

      if (json.status !== 'ok') {
        throw new Error(json.msg);
      }

      const expiresInUTC = moment.utc(json.expiresIn).toDate();
      const expiresInLocal = moment(expiresInUTC).local().format('YYYY-MM-DD HH:mm:ss');

      return {
        token: json.token,
        expiresIn: expiresInLocal,
        refreshToken: json.refreshToken
      };
    } catch (err) {
      throw err;
    }
  },

  refreshToken: async (address, refreshToken) => {
    if (refreshToken === null) {
      return;
    }

    try {
      const ret = await fetch(config.api.refresh.path, {
        method: config.api.refresh.method,
        body: JSON.stringify({
          address: address,
          refreshToken: refreshToken,
        }),
        headers: config.api.refresh.headers,
      });

      const json = await ret.json();

      // If refresh token has expired => trigger login.
      if (json.status !== 'ok') {
        throw new Error(json.msg);
      }

      const expiresInUTC = moment.utc(json.expiresIn).toDate();
      const expiresInLocal = moment(expiresInUTC).local().format('YYYY-MM-DD HH:mm:ss');

      return {
        token: json.token,
        expiresIn: expiresInLocal,
      };
    } catch (err) {
      throw err;
    }
  },

  setToken: (headers, token) => {
    headers = JSON.stringify(headers);
    headers = headers.replace('%token', token);
    return JSON.parse(headers);
  },

  hasTokenExpired: (expiresIn) => {
    const currentTimestamp = new Date().getTime();
    const timestamp = new Date(expiresIn).getTime();
    return (currentTimestamp < timestamp) ? false : true;
  },

  updateTokenIfRequired: async (address, refreshToken, expiresIn) => {
    if (Token.hasTokenExpired(expiresIn)) {
      console.log('token has expired');

      // Use the refresh token to update the token.
      try {
        const {token, expiresIn} = await Token.refreshToken(address, refreshToken);

        // Update the cookie.
        Cookie.update(address, token, expiresIn, refreshToken, Metamask.pubKey);

        return {token, expiresIn};
      } catch (err) {
        throw err;
      }
    }
  },
};

module.exports = Token;
