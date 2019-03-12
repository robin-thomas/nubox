const FileDownloader = require('../download/downloader.js');

const FileDownloadHandler = {
  start: (ipfsList, fileName, privKey) => {
    // ipfsList = [
    //   "QmUArtJeh5wNhAUHe8dk1JtqiXeuZGQj26yRc9SsRdZnyr",
    //   "QmQ9qutd3TNRcVw8SerzvdicVVNJMBTYwcpDVVe5bkat5a",
    //   "Qmayc5chHsTpxihMXVAgCFD7RLasr2c3UTndkmtyf1q58X",
    //   "QmQ3RMF5rkf7i44nwBSo3bsKRWi7LvV5j1UNiotrnW86R7",
    //   "QmcTAg93nDUm7safSPUeeUHNES4dQHNWXFSr7XAHj9EC1u",
    //   "QmZz9E7NjUuh6EUL8twCfUUdYRJzXB5LaGB9cif1M411nb"
    // ];

    // Encrypted file.
    // ipfsList = [
    //   "QmVqH9RvpfHD9aUXpvMEYou1aHKVyGsuH7BDrAufNtAP9Z",
    //   "QmZBbiADSEBgG5aFQsyUoDXhJEVbZQPGwF2xZgXpH1PNRw",
    //   "QmewjifHt1sPW54aT7fYBFbQLfg3sqUuMpPuncCG1A7DGN",
    //   "QmY2CqWgoLPt2daUUPTq4JpGAsed8dsH3BE1s1qJyR5S8w",
    //   "QmcW6x2sy9eVz1GevfcVvZAUoHDjQj7TNqJ9RAnxfUhtWZ",
    //   "QmUoirRJe3WvUp8Dg4gCU1PhATF46MzfehUDV8VfLbVj1P"
    // ];

    ipfsList = [
      "Qmcy5hk512YjtpyTYt9GyDyeW1ZGxvwk5adSrpsYGTMMDC",
      "QmZTytHTAML54NURmaKA5LFJ6QvEkv2BWFvvKMGUvgdrBe",
      "QmT9coEGB6z1p9SmNDwLhAd2ATqj5ZnARUf4W5YYKpFasW",
      "QmdwJEeX8xReU6pWceCkM2egpMoDKwMD5TcfJGZV2VCiQt",
      "QmVeNsYrujHAbBPNu2ns7KLhqDdkz97GbbupvgnaBypNSV",
      "QmaezVhPog8r6a1jBVeX157dR96iTywBSZxgcQQ1W36ZUv"
    ];

    privKey = '0x61F4819F5DF93AC0BA16B923C640C7CD408DD486ACED6C859DE47EA36E7D0FD7';

    fileName = 'hello.jpg';

    new FileDownloader(ipfsList, fileName, privKey).start();
  },
};

module.exports = FileDownloadHandler;
