const Path = require('path');

const FS = require('../fs.js');
const Wallet = require('../crypto/metamask.js');
const DownloadHandler = require('./downloader.js');

const drawFolder = (file) => {
  const name = Path.basename(file.path);

  // Find the last row.
  let row = $('#content-fs').find('.container > .row');
  if (row === null || row === undefined || row.length < 1) {
    $('#content-fs').find('.container').html('<div class="row no-gutters"></div>');
    row = $('#content-fs').find('.container > .row').first();
  } else {
    // Check if enough columns are already present.
    row = row.last();
    if (row.find('.col-md-2').length === 6) {
      $('#content-fs').find('.container').append('<div class="row no-gutters"></div>');
      row = $('#content-fs').find('.container > .row').first();
    }
  }

  const key = Buffer.from(file.path).toString('hex');
  const folder = `<div class="fs-file-total col-md-2">
                    <input type="hidden" value="${key}" />
                    <div class="row">
                      <div class="col">
                        <i class="fas ${file.isFile ? 'fa-file-alt fs-file-icon' : 'fa-folder fs-folder-icon'}"
                           data-toggle="popover"></i>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col fs-file-name">${name}</div>
                    </div>
                  </div>`;
  row.append(folder);

  row.append(`<div class="col-md-2">
                    <div class="row">
                      <div class="col">
                        <i class="fas ${file.isFile ? 'fa-file-alt fs-file-icon' : 'fa-folder fs-folder-icon'}"
                           data-toggle="popover"></i>
                      </div>
                    </div>
                    <div class="row">
                      <div class="col fs-file-name">${name}</div>
                    </div>
                  </div>`);

  $(row).find('[data-toggle="popover"]').first().popover({
    trigger: 'manual',
    html: true,
    content: function() {
      return `<ul id="popover-content" class="list-group">
                <input class="fs-file-key" type="hidden" value="${key}" />
                <a href="#" class="fs-download list-group-item"><i class="fas fa-download"></i>&nbsp;&nbsp;Download</a>
                <a href="#" class="fs-delete list-group-item"><i class="far fa-trash-alt"></i>&nbsp;&nbsp;Delete</a>
                <a href="#" class="fs-rename list-group-item"><i class="far fa-edit"></i>&nbsp;&nbsp;Rename</a>
              </ul>`;
    }
  });
};

const FSHandler = {
  fs: null,

  drawFS: async (address, path = '/') => {
    try {
      if (FSHandler.fs === null) {
        FSHandler.fs = await FS.getFsStructure(address);
      }

      // Reset the current fs screen.
      $('#content-fs').html('<div class="container"></div>');

      // Draw the files.
      const structure = FSHandler.getStructure(path);
      for (const key of Object.keys(structure)) {
        const file = FSHandler.fs[key];

        if (file.isFile) {
          drawFolder(file);
        } else {
          drawFolder(file);
        }
      }
    } catch (err) {
      throw err;
    }
  },

  getStructure: (path) => {
    let children = {};

    for (const key of Object.keys(FSHandler.fs)) {
      const file = FSHandler.fs[key];

      // check if its a child (one level below).
      const index = file.path.indexOf(path);
      if (index === 0 && file.path.indexOf('/', index + 1) === -1) {
        children[key] = file;
      }
    }

    return children;
  },

  downloadFile: (e) => {
    const key = $(e.currentTarget).parent().find('.fs-file-key').val();
    const path = Buffer.from(key, 'hex').toString();

    const fileName = Path.basename(path);
    const ipfsList = FSHandler.fs[path].ipfs;

    DownloadHandler.start(ipfsList, fileName, Wallet.pubKey);
  },

  deleteFile: async (e) => {
    const key = $(e.currentTarget).parent().find('.fs-file-key').val();
    const path = Buffer.from(key, 'hex').toString();

    try {
      await FS.deleteFile(Wallet.address, path);

      // Delete from UI.
      $('#content-fs').find(`.fs-file-total > input[type="hidden"][value=${key}]`).parent().remove();
    } catch (err) {
      throw err;
    }
  }
};

module.exports = FSHandler;
