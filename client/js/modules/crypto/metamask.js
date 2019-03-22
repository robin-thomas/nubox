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
  privKey: null,
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

  personalSign: async (address, msg) => {
    try {
      const signature = await window.web3.eth.personal.sign(msg, address, null);

      Metamask.pubKey = getPubKey(msg, signature);

      return signature;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Metamask;
