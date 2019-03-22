const FileDownloader = require('../download/downloader.js');
//
const FileDownloadHandler = {
  start: (ipfsList, fileName, privKey) => {
    // privKey = '0x61F4819F5DF93AC0BA16B923C640C7CD408DD486ACED6C859DE47EA36E7D0FD7';
    new FileDownloader(ipfsList, fileName, privKey).start();
  },
};

module.exports = FileDownloadHandler;
