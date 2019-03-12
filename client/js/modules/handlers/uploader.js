const crypto = require("crypto");

const FileUploader = require('../upload/uploader.js');
const Metamask = require('../crypto/metamask.js');

const File = {
  doesFileKeyExists: (key) => {
    return (FileUploadHandler.upload !== null && FileUploadHandler.upload[key] !== undefined) ?
      true : false;
  },

  getFileKey: (file) => {
    return Buffer.from(JSON.stringify({
      lastMod: file.lastModified,
      size: file.size,
      name: file.name,
      type: file.type,
    })).toString('hex');
  },

  getFileName: (fileName) => {
    const index = fileName.lastIndexOf('.');

    const ext = fileName.substr(index + 1);

    let name = fileName.substr(0, index);
    if (name.length > 10) {
      name = name.substr(0, 3) + '...' + name.substr(name.length - 4);
    }

    return name + '.' + ext;
  },

  getFileSize: (bytes) => {
    const size = ['B','kB','MB','GB'];
    const factor = Math.floor((bytes.toString().length - 1) / 3);
    return (bytes / Math.pow(1024, factor)).toFixed(2) + size[factor];
  },
};

const FileUploadHandler = {
  upload: null,
  uploadTimer: null,

  createFileUploadUI: (key, file) => {
    $('#file-upload-progress').find('.file-upload-progress-full-file-name');

    const fileName = File.getFileName(file.name);
    const fileSize = File.getFileSize(file.size);

    let row = `<div class="row" id="${key}">
                  <input type="hidden" class="file-upload-progress-full-file-name" value="${fileName}"/>
                  <div class="col-md-2">
                    <i class="fas fa-file-alt" style="font-size:46px;"></i>
                  </div>
                  <div class="col-md-10">
                    <div class="row">
                      <div class="col-md-9">
                        <div class="file-upload-progress-file-name">
                          <b>${fileName}</b>
                        </div>
                      </div>
                      <div class="col-md-3" style="text-align:right">
                        <input type="hidden" class="file-upload-progress-key" value="${key}" />
                        <div class="file-upload-progress-btn">
                          <i class="fas fa-spinner fa-spin"></i>
                        </div>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col-md-5">
                        <div style="font-size:11px;color:grey;">${fileSize}</div>
                      </div>
                      <div class="col-md-7" style="text-align:right">\
                        <div class="file-upload-progress-status" style="font-size:12px;color:grey;">Queued</div>\
                      </div>
                    </div>
                    <div class="row">
                      <div class="progress" style="height:2px;margin:15px;width:100%;">
                        <div class="progress-bar bg-danger" role="progressbar" style="width:0px" aria-valuenow="0"
                             aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                    </div>
                  </div>
                 </div>`;

    const simpleBarContent = $('#file-upload-progress').find('.simplebar-content');
    const container = simpleBarContent.find('#file-upload-simplebar-container');
    if (container.length > 1) {
      container.append(row);
    } else {
      simpleBarContent.append(`<div id="file-upload-simplebar-container" class="container">${row}</div>`);
    }
  },

  handler: (e) => {
    const files = e.target.files;
    const el = new SimpleBar($('#file-upload-progress')[0]);

    // Check if the file is in the upload UI.
    // If not, start the job.
    for (const file of files) {
      const key = File.getFileKey(file);

      if (!File.doesFileKeyExists(key)) {
        FileUploadHandler.createFileUploadUI(key, file);
        FileUploadHandler.start(file, key);
      } else if (files.length === 1) {
        alert('File is already present in the UI');

        // TODO: scroll the UI to the existing file in the UI.
      }
    }

    el.recalculate();
  },

  timer: () => {
    const keys = Object.keys(FileUploadHandler.upload);
    if (keys.length === 0) {
      clearInterval(FileUploadHandler.uploadTimer);
      FileUploadHandler.upload = FileUploadHandler.uploadTimer = null;
    } else {
      for (const key of keys) {
        if (!FileUploadHandler.upload[key].paused) {
          const progress = FileUploadHandler.upload[key].uploader.getProgress();
          $('#file-upload-progress').find('#' + key + ' .progress-bar').width(progress + '%');

          if (progress === 100) {
            delete FileUploadHandler.upload[key];
          }
        }
      }
    }
  },

  start: (file, key) => {
    const pubKey = '0xc078e62617f3265998d52bf7e778c6576d8d06d51bc90ae94a609f22107a3b551e7356acbfda378e5d4f5085d8125475aeb3ce99bfa18cfd7174c608edd2670c';
    // const pubKey = Metamask.pubKey;

    // Set it as new job if required.
    if (FileUploadHandler.upload === null) {
      FileUploadHandler.upload = {};
      FileUploadHandler.upload[key] = {
        uploader: new FileUploader(file, key, pubKey),
        paused: false,
      };

      // Need to set the timer.
      FileUploadHandler.uploadTimer = setInterval(FileUploadHandler.timer, 1000);
    } else if (FileUploadHandler.upload[key] === undefined) {
      FileUploadHandler.upload[key] = {
        uploader: new FileUploader(file, key, pubKey),
        paused: false,
      };
    }

    // Start the job.
    // FileUploadHandler.upload[key].uploader.start();
    FileUploadHandler.upload[key].paused = false;
  },

  pause: (key) => {
    if (FileUploadHandler.upload[key] !== undefined) {
      FileUploadHandler.upload[key].uploader.pause();
      FileUploadHandler.upload[key].paused = true;
    }
  },

  destroy: (key) => {
    if (FileUploadHandler.upload[key] !== undefined) {
      FileUploadHandler.upload[key].uploader.pause();
      delete FileUploadHandler.upload[key];
    }
  },

  getStatus: (key) => {
    if (FileUploadHandler.upload[key] !== undefined) {
      const completed = FileUploadHandler.upload[key].uploader.isComplete;
      const results = FileUploadHandler.upload[key].uploader.results;

      if (completed && results === null) {
        return 'FAILED';
      } else if (completed) {
        return 'COMPLETED';
      }
      return 'RUNNING'
    }
    return 'UNKNOWN';
  }
};

module.exports = FileUploadHandler;
