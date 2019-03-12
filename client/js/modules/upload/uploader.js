const Work = require('webworkify');

const config = require('../../../../config.json');

class FileUploader {
  constructor(file, key, pubKey) {
    this.file = file;
    this.blockSize = config.upload.blocksize;
    this.offset = 0;
    this.key = key;
    this.pubKey = pubKey;
    this.isComplete = false;
    this.results = null;
  }

  start() {
    // Setup the web worker.
    this.worker = Work(require('./worker.js'));
    this.worker.onmessage = this.getMessage.bind(this);

    this.worker.postMessage({
      file: this.file,
      blockSize: this.blockSize,
      offset: this.offset,
      pubKey: this.pubKey,
    });

    $('#file-upload-progress ' + '#' + this.key).find('.file-upload-progress-status').html('Uploading');

    const html = '<i class="fas fa-pause file-upload-progress-pause" style="cursor:pointer;"></i>&nbsp;&nbsp;\
                  <i class="fas fa-times file-upload-progress-cancel" style="cursor:pointer;"></i>';
    $('#file-upload-progress ' + '#' + this.key).find('.file-upload-progress-btn').html(html);
  }

  pause() {
    this.worker.terminate();
    $('#file-upload-progress ' + '#' + this.key).find('.file-upload-progress-status').html('Paused');
  }

  getProgress() {
    return ((this.offset / this.file.size) * 100.0).toFixed(2);
  }

  getMessage(e) {
    const msg = e.data;

    const keyDiv = $('#file-upload-progress ' + '#' + this.key);
    const progressStatusDiv = keyDiv.find('.file-upload-progress-status');

    switch(msg.type) {
      case 'status':
        progressStatusDiv.css('color', 'grey').html(msg.status);
        break;

      case 'processing':
        this.offset += msg.blockLength;
        progressStatusDiv.css('color', 'grey').html('Uploading');
        break;

      case 'completed':
        this.offset = this.file.size;
        this.worker.terminate();
        this.isComplete = true;
        this.results = msg.results;

        progressStatusDiv.css('color', '#28a745').html('Completed');
        keyDiv.find('.file-upload-progress-btn').html('');
        break;

      case 'error':
        progressStatusDiv.css('color', '#dc3545').html(msg.error);

        if (msg.error === 'Failed to upload') {
          this.worker.terminate();
          this.isComplete = true;
          this.results = null;

          const html = '<i class="fas fa-times file-upload-progress-cancel" style="cursor:pointer;"></i>';
          keyDiv.find('.file-upload-progress-btn').html(html);
        }
        break;
    }
  }
}

module.exports = FileUploader;
