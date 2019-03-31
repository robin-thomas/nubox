const FileDownloader = require('../download/downloader.js');

const FileDownloadHandler = {
  start: (ipfsList, fileName, path) => {
    new FileDownloader(ipfsList, fileName, path).start();
  },
};

module.exports = FileDownloadHandler;
