const FileDownloader = require('../download/downloader.js');

const FileDownloadHandler = {
  start: (ipfsList, fileName, label) => {
    new FileDownloader(ipfsList, fileName, label).start();
  },
};

module.exports = FileDownloadHandler;
