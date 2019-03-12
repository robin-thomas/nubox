const ethUtil = require('ethereumjs-util');
const Web3New = require('web3');

const getPubKey = (msg, signature) => {
  const msgHash = ethUtil.hashPersonalMessage(ethUtil.toBuffer(msg));
  const sigParams = ethUtil.fromRpcSig(ethUtil.toBuffer(signature));
  const pubKey = ethUtil.ecrecover(msgHash, sigParams.v, sigParams.r, sigParams.s);
  return ethUtil.bufferToHex(pubKey);
};

const Metamask = {
  pubKey: null,
  address: null,

  hasMetamask: () => {
    return true;
  },

  loadWeb3: async () => {
    if (window.ethereum) {
      window.web3 = new Web3New(window.ethereum);

      try {
        await window.ethereum.enable();

        return await Metamask.getAddress();
      } catch (err) {
        throw new Error('User has denied access to eth account!');
      }
    } else if (window.web3) {
      throw new Error('Please update Metamask!');
    } else {
      throw new Error('Non-Ethereum browser detected. Please use MetaMask!');
    }
  },

  getAddress: async () => {
    try {
      return await window.web3.eth.getAccounts();
    } catch (err) {
      throw err;
    }
  },

  personalSign: (address, msg) => {
    return new Promise((resolve, reject) => {
      const opts = {
        id: 1,
        method: 'personal_sign',
        params: [address, msg]
      };

      window.web3.givenProvider.sendAsync(opts, (err, result) => {
        if (!err) {
          const signature = result.result;
          Metamask.pubKey = getPubKey(msg, signature);
          resolve(signature);
        } else {
          reject(err);
        }
      });
    });
  },
};

module.exports = Metamask;
