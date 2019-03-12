const EthCrypto = require('eth-crypto');

const Crypto = {
  encrypt: async (pubKey, msg) => {
    const base64 = Buffer.from(msg).toString('base64');
    const encrypted = await EthCrypto.encryptWithPublicKey(pubKey, base64);
    return Buffer.from(JSON.stringify(encrypted));
  },

  decrypt: async (privKey, msg) => {
    const decrypted = await EthCrypto.decryptWithPrivateKey(privKey, JSON.parse(msg));
    return Buffer.from(decrypted, 'base64');
  },
};

module.exports = Crypto;
