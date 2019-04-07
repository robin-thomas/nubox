const config = require('../../../../config.json');

class FileUploader {
  constructor(file, key, pubKey, path) {
    this.file = file;
    this.blockSize = config.upload.blocksize;
    this.offset = 0;
    this.key = key;
    this.pubKey = pubKey;
    this.path = path;
    this.isComplete = false;
    this.results = null;
    this.paused = false;
  }

  // Loop through each 256KB of the file, until the file size is reached.
  // Pass each slice to nuBox chrome extension to read the file, encrypt
  // it with NuCypher, and upload it to Infura IPFS.
  readFileBlock() {
    const keyDiv = $('#file-upload-progress ' + '#' + this.key);
    const progressStatusDiv = keyDiv.find('.file-upload-progress-status');

    if (this.offset >= this.file.size) {
      this.offset = this.file.size;
      this.isComplete = true;

      console.log(this.results);

      // nuBox.getBobKeys()
      //   .then((bob) => nuBox.grant(this.path, bob.bek, bob.bvk, '2019-05-01 00:00:00'))
      //   .catch((err) => {
      //     console.log(err);
      //   });

      progressStatusDiv.css('color', '#28a745').html('Completed');
      keyDiv.find('.file-upload-progress-btn').html('');

      return;
    }

    const blob = this.file.slice(this.offset, this.blockSize + this.offset);
    const blobURL = URL.createObjectURL(blob);

    nuBox
      .readBlock(blobURL, this.path, true /* upload to ipfs */)
      .then((ipfsHash) => {
        if (this.paused) {
          return;
        }

        if (this.results === null) {
          this.results = []
        }
        this.results.push(ipfsHash);
        this.offset += this.blockSize;

        this.readFileBlock();
      }).catch((err) => {
        progressStatusDiv.css('color', '#dc3545').html(err.message);

        this.isComplete = true;
        this.results = null;

        const html = '<i class="fas fa-trash-alt file-upload-progress-cancel" style="cursor:pointer;"></i>';
        keyDiv.find('.file-upload-progress-btn').html(html);
      });
  }

  start() {
    this.paused = false;
    this.readFileBlock();

    $('#file-upload-progress ' + '#' + this.key).find('.file-upload-progress-status').html('Uploading');

    const html = '<i class="fas fa-pause file-upload-progress-pause" style="cursor:pointer;"></i>&nbsp;&nbsp;\
                  <i class="fas fa-trash-alt file-upload-progress-cancel" style="cursor:pointer;"></i>';
    $('#file-upload-progress ' + '#' + this.key).find('.file-upload-progress-btn').html(html);
  }

  pause() {
    this.paused = true;
    $('#file-upload-progress ' + '#' + this.key).find('.file-upload-progress-status').html('Paused');
  }

  getProgress() {
    return ((this.offset / this.file.size) * 100.0).toFixed(2);
  }
}

module.exports = FileUploader;
