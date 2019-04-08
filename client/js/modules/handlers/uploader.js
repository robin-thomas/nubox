const FS = require('../fs.js');
const File = require('../upload/file.js');
const FSHandler = require('./fs.js');
const FileUploader = require('../upload/uploader.js');
const Metamask = require('../crypto/metamask.js');
const ActivityHandler = require('./activity.js');

const FileUploadHandler = {
  upload: null,
  uploadTimer: null,
  jobQueue: [],

  doesFileKeyExists: (key) => {
    const found = $('#file-upload-simplebar-container').find(`#${key}`);
    return found !== undefined && found.length > 0;
  },

  startJob: () => {
    let runningJobCount = 0;
    for (const key of Object.keys(FileUploadHandler.upload)) {
      runningJobCount += (FileUploadHandler.upload[key].isRunning ? 1 : 0);
    }

    // Start the job is queue is not full.
    if (runningJobCount < 1 && FileUploadHandler.jobQueue.length > 0) {
      const key = FileUploadHandler.jobQueue.pop();
      FileUploadHandler.upload[key].uploader.start();
      FileUploadHandler.upload[key].isRunning = true;
    }
  },

  createFileUploadUI: (key, file) => {
    $('#file-upload-progress').find('.file-upload-progress-full-file-name');

    const fileName = File.getFileName(file.name);
    const fileSize = File.getFileSize(file.size);

    let row = `<div class="row no-gutters" id="${key}">
                  <input type="hidden" class="file-upload-progress-full-file-name" value="${fileName}"/>
                  <div class="col-md-2">
                    <i class="fas fa-file-alt" style="font-size:47px;"></i>
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
                      <div class="progress" style="height:2px;margin:3px 15px 25px 15px;width:100%;">
                        <div class="progress-bar bg-danger" role="progressbar" style="width:0px" aria-valuenow="0"
                             aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                    </div>
                  </div>
                 </div>`;

    const simpleBarContent = $('#file-upload-progress').find('.simplebar-content');
    const container = simpleBarContent.find('#file-upload-simplebar-container');
    if (container.length >= 1) {
      container.append(row);
    } else {
      simpleBarContent.append(`<div id="file-upload-simplebar-container" class="container">${row}</div>`);
    }
  },

  handler: (e) => {
    const files = e.target.files;
    const el = new SimpleBar($('#file-upload-progress')[0]);
    let processedFiles = [];

    // Check if the file is in the upload UI.
    // If not, start the job.
    for (const file of files) {
      const key = File.getFileKey(file, FSHandler.path);

      console.log('upload');

      if (!FileUploadHandler.doesFileKeyExists(key)) {
        FileUploadHandler.destroy(key);
        FileUploadHandler.createFileUploadUI(key, file);
        FileUploadHandler.start(file, key);
        processedFiles.push(file);
      } else if (files.length === 1) {
        alert('File is already present in the UI');
      }
    }

    if (processedFiles.length >= 1) {
      File.updateTotalFilesSize(processedFiles);
    }

    el.recalculate();
    $(e.currentTarget).val('');
  },

  timer: () => {
    let updates = [];

    const keys = Object.keys(FileUploadHandler.upload);
    if (keys.length === 0) {
      clearInterval(FileUploadHandler.uploadTimer);
      FileUploadHandler.upload = FileUploadHandler.uploadTimer = null;
    } else {
      let totalOffset = 0;
      let isFilesUploaded = true;

      for (const key of keys) {
        const progress = FileUploadHandler.upload[key].uploader.getProgress();
        totalOffset += (progress * FileUploadHandler.upload[key].uploader.file.size) / 100;

        if (FileUploadHandler.upload[key].uploader.isComplete !== true) {
          isFilesUploaded = false;
        }

        // Update the progress only if the job is running.
        if (FileUploadHandler.upload[key].isRunning) {
          $('#file-upload-progress').find('#' + key + ' .progress-bar').width(progress + '%');

          if (FileUploadHandler.upload[key].uploader.isComplete === true) {
            $('#fs-empty-folder-display').hide();
            // delete FileUploadHandler.upload[key];
            FileUploadHandler.upload[key].isRunning = false;

            // Add to send as update to the server in batches.
            const record = {
              path: FileUploadHandler.upload[key].uploader.path,
              fileSize: FileUploadHandler.upload[key].uploader.file.size,
              fileType: FileUploadHandler.upload[key].uploader.file.type,
              ipfs: FileUploadHandler.upload[key].uploader.results,
              isFile: true,
            };
            updates.push(record);

            // update the fs UI.
            FSHandler.drawFile(record);
          }
        }
      }

      // send the updates to the server.
      if (updates.length >= 1) {
        FS.createFiles(Metamask.address, updates)
          .then(FileUploadHandler.processFiles)
          .then(() => {
            FSHandler.updateStorageUI();
            ActivityHandler.load(Metamask.address);
          });
      } else {
        // Check for jobs in the queue and start one if possible.
        FileUploadHandler.startJob();
      }

      // Destroy the timer since all files has been uploaded.
      if (isFilesUploaded) {
        clearInterval(FileUploadHandler.uploadTimer);
        FileUploadHandler.uploadTimer = null;
      }

      let totalSize = $('#upload-file-dialog').find('#file-upload-progress-total-size').val();
      totalSize = parseInt(totalSize);
      totalSize = isNaN(totalSize) ? 0 : totalSize;

      let totalProgress = (totalSize === 0) ? 0 : ((totalOffset / totalSize) * 100.0);
      totalProgress = totalProgress.toFixed(2) + '%';
      $('#upload-file-dialog').find('#file-upload-progress-total').width(totalProgress);
      $('#upload-file-dialog').find('#file-upload-progress-total-display > b').html(totalProgress);
    }
  },

  processFiles: async (files) => {
    const bob = await nuBox.getBobKeys();

    for (const file of files) {
      FSHandler.fs[file.path] = file;
      FSHandler.fsSize += file.fileSize;

      try {
        await nuBox.grant(file.hash, bob.bek, bob.bvk, '2019-05-01 00:00:00', true /* noPopup */);
        console.log('Bob given access (no popup since Bob here is Alice)');
      } catch (err) {
        console.log(err);
      }
    }

    // Check for jobs in the queue and start one if possible.
    FileUploadHandler.startJob();
  },

  start: (file, key) => {
    const pubKey = Metamask.pubKey;

    // Set it as new job if required.
    if (FileUploadHandler.upload === null) {
      FileUploadHandler.upload = {};
    }
    if (FileUploadHandler.upload[key] === undefined) {
      const path = FSHandler.path + (FSHandler.path.endsWith('/') ? '' : '/') + file.name;
      FileUploadHandler.upload[key] = {
        uploader: new FileUploader(file, key, pubKey, path),
        isRunning: false,
      };
    }

    // Need to set the timer.
    if (FileUploadHandler.uploadTimer === null) {
      FileUploadHandler.uploadTimer = setInterval(FileUploadHandler.timer, 1000);
    }

    // Start the job if queue is not full.
    FileUploadHandler.jobQueue.unshift(key);
  },

  pause: (key) => {
    if (FileUploadHandler.upload[key] !== undefined) {
      FileUploadHandler.upload[key].uploader.pause();
      FileUploadHandler.upload[key].isRunning = false;
    }
  },

  destroy: (key) => {
    if (FileUploadHandler.upload &&
        FileUploadHandler.upload[key] !== undefined) {
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
