const config = require('../../../../config.json');
const EXTENSION_ID = config.app.extension;

const callExtension = (cmd, args) => {
  return new Promise((resolve, reject) => {
    let msg = JSON.stringify({
      cmd: cmd,
      args: args === undefined ? [] : args,
    });

    chrome.runtime.sendMessage(EXTENSION_ID, msg, response => {
      if (!response) {
        reject(null);
        return false;
      } else if (response.type === 'failure') {
        reject(response.result);
        return false;
      } else if (response.type === 'success') {
        resolve(response.result);
        return true;
      }
    });
  });
}

const Extension = {
  checkForExtension: async () => {
    if (chrome === undefined || chrome === null ||
        chrome.runtime === undefined) {
      alert('You are not using a Chromium-based browser!');
      return;
    }

    try {
      await callExtension('isHostRunning');
    } catch (err) {
      if (err === null) {
        alert('You do not have the nuBox chromium extension installed!');
      } else {
        alert('Unable to start the Chromium nuBox host!');
      }
    }
  },

  grant: async (label, bob_encrypting_key, bob_verifying_key, expiration) => {
    try {
      await await callExtension('grant', [label, bob_encrypting_key, bob_verifying_key, expiration]);
    } catch (err) {
      throw err;
    }
  },

  encrypt: async (plaintext, label) => {
    try {
      return await await callExtension('encrypt', [plaintext, label]);
    } catch (err) {
      throw err;
    }
  },

  decrypt: async (encrypted, label) => {
    try {
      return await await callExtension('decrypt', [encrypted, label]);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Extension;
