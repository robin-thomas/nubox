const Extension = {
  checkForExtension: () => {
    const EXTENSION_ID = 'njhoeofhggekkacnblnlghlmdfganehh';

    if (chrome === undefined || chrome === null ||
        chrome.runtime === undefined) {
      alert('You are not using a Chromium-based browser!');
      return false;
    }

    chrome.runtime.sendMessage(EXTENSION_ID, 'version', response => {
      if (!response) {
        alert('You do not have the nuBox chromium extension installed!');
        return false;
      }
      console.log('Extension version: ', response.version);
      return true;
    });
  }
};

module.exports = Extension;
