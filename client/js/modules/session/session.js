const fetch = require('node-fetch');
const Url = require('url');

const Metamask = require('../crypto/metamask.js');
const Token = require('./token.js');
const Cookie = require('./cookie.js');
const config = require('../../../../config.json');

const Session = {
  address: null,
  token: null,
  expiresIn: null,
  refreshToken: null,

  login: async (address, message) => {
    try {
      const sig = await Metamask.personalSign(address, message);

      if (sig !== undefined && sig !== null) {
        const {token, expiresIn, refreshToken} = await Token.getToken(message, sig, address);
        Session.token = token;
        Session.expiresIn = expiresIn;
        Session.refreshToken = refreshToken;

        Cookie.new(address, token, expiresIn, refreshToken, Metamask.pubKey);
      } else {
        throw new Error('Unable to create a signature with Metamask');
      }
    } catch (err) {
      throw err;
    }
  },

  api: async (apiName, data) => {
    try {
      const newSession = await Token.updateTokenIfRequired(data.address, Session.refreshToken, Session.expiresIn);
      if (newSession !== null && newSession !== undefined &&
          newSession.token !== undefined) {
        Session.token = newSession.token;
        Session.expiresIn = newSession.expiresIn;
      }

      let headers = config.api[apiName].headers;
      headers = Token.setToken(headers, Session.token);

      let url = config.api[apiName].path;
      if (config.api[apiName].method === 'GET') {
        url += Url.format({query: data});
      }

      const body = config.api[apiName].method !== 'GET' ? JSON.stringify(data) : undefined;

      const ret = await fetch(url, {
        method: config.api[apiName].method,
        headers: headers,
        body: body,
      });

      const json = await ret.json();
      if (json.status !== 'ok') {
        throw new Error(apiName + ' failed: ' + json.msg);
      }

      return json.msg;
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    Session.address = Session.token = Session.expiresIn = Session.refreshToken = null;
    Cookie.destroy();
  },

  isLoggedIn: () => {
    const session = Cookie.load();
    if (session === null) {
      console.log('no session');
      return false;
    }

    Session.address = session.address;
    Session.token = session.token;
    Session.expiresIn = session.expiresIn;
    Session.refreshToken = session.refreshToken;
    Metamask.pubKey = session.pubKey;

    return true;
  },
};

module.exports = Session;
