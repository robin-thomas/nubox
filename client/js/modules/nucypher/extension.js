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

    try {
      const label = 'songs';
      const encrypted = await callExtension('encrypt', ['helloworld', label]);
      await callExtension('grant', [label]);
      const decrypted = await callExtension('decrypt', [encrypted, label]);
      console.log(decrypted);
    } catch (err) {
      if (err === null) {
        alert('You do not have the nuBox chromium extension installed!');
      } else {
        alert('Unable to start the Chromium nuBox host!');
      }
    }
  }
};

module.exports = Extension;
