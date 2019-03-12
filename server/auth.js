const jwt = require('jsonwebtoken');
const ethUtil = require('ethereumjs-util');

const DB = require('./db.js');
const Token = require('./token.js');
const config = require('../config.json');

const verifySignature = async (msg, signature, address) => {
  const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(msg));
  const sigParams = ethUtil.fromRpcSig(ethUtil.toBuffer(signature));
  const pubKey = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
  const sender = ethUtil.bufferToHex(ethUtil.publicToAddress(pubKey));

  return (sender === ethUtil.bufferToHex(address)) ? true : false;
};

const Auth = {
  login: async (req, res) => {
    const msg = req.body.msg;
    const sig = req.body.sig;
    const address = req.body.address;

    if (await verifySignature(msg, sig, address)) {
      const {token, expiresIn} = Token.genToken(address);
      const refreshToken = await Token.genRefreshToken(address);

      res.status(200).send({
        status: 'ok',
        token: token,
        expiresIn: expiresIn,
        refreshToken: refreshToken,
      });
    } else {
      res.status(400).send({
        status: 'not ok',
        msg: 'unable to verify the signature'
      });
    }
  },

  validate: (req, res, next) => {
    try {
      const token = req.headers['x-access-token'];
      const address = req.method !== 'GET' ? req.body.address : req.query.address;

      const decoded = jwt.verify(token, config.jwt.secret);
      if (decoded.user === address) {
        req.user = decoded.user;
        next();
      } else {
        res.status(400).send({
          status: 'not ok',
          msg: 'Failed to authenticate the token',
          address: address,
        });
      }
    } catch (err) {
      res.status(400).send({
        status: 'not ok',
        msg: err.message
      });
    }
  },

  refresh: async (req, res) => {
    const address = req.body.address;
    const refreshToken = req.body.refreshToken;

    try {
      if (await Token.isValidRefreshToken(address, refreshToken)) {
        const {token, expiresIn} = Token.genToken(address);

        res.status(200).send({
          status: 'ok',
          token: token,
          expiresIn: expiresIn,
        });
      } else {
        res.status(400).send({
          status: 'not ok',
          msg: 'unable to verify the refresh token',
        });
      }
    } catch (err) {
      res.status(400).send({
        status: 'not ok',
        msg: err.message
      });
    }
  }
};

module.exports = Auth;
