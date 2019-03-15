const Path = require('path');

const FS = require('../fs.js');
const Wallet = require('../crypto/metamask.js');
const DownloadHandler = require('./downloader.js');

const FSHandler = {
  fs: null,
  path: '/',

  drawFile: (file) => {
    const name = Path.basename(file.path);
    const el = new SimpleBar($('#content-fs-content')[0]);

    // Find the last row.
    let row = $('#content-fs-content .simplebar-content').find('.container > .row');
    if (row === null || row === undefined || row.length < 1) {
      $('#content-fs-content .simplebar-content').find('.container').html('<div class="row no-gutters"></div>');
      row = $('#content-fs-content .simplebar-content').find('.container > .row').first();
    } else {
      // Check if enough columns are already present.
      row = row.last();
      if (row.find('.col-md-2').length === 6) {
        $('#content-fs-content .simplebar-content').find('.container').append('<div class="row no-gutters"></div>');
        row = $('#content-fs-content .simplebar-content').find('.container > .row').last();
      }
    }

    const key = Buffer.from(file.path).toString('hex');
    const folder = `<div class="fs-file-total col-md-2">
                      <input type="hidden" value="${key}" />
                      <div class="row">
                        <div class="col">
                          <i class="fas ${file.isFile ? 'fa-file-alt' : 'fa-folder'} fs-file-icon"
                             data-toggle="popover"></i>
                        </div>
                      </div>
                      <div class="row">
                        <div class="col fs-file-name">${name}</div>
                      </div>
                    </div>`;
    row.append(folder);

    $(row).find('[data-toggle="popover"]').last().popover({
      trigger: 'manual',
      html: true,
      content: function() {
        return `<ul id="popover-content" class="list-group">
                  <input class="fs-file-key" type="hidden" value="${key}" />
                  ${file.isFile ? '<a href="#" class="fs-download list-group-item"><i class="fas fa-download"></i><span>Download</span></a>' : ''}
                  <a href="#" class="fs-delete list-group-item"><i class="far fa-trash-alt"></i><span>Delete</span></a>
                  <a href="#" class="fs-rename list-group-item"><i class="far fa-edit"></i><span>Rename</span></a>
                  <a href="#" class="fs-move-file list-group-item"><i class="fas fa-file-export"></i><span>Move</span></a>
                </ul>`;
      }
    });

    el.recalculate();
  },

  drawFS: async (address, path = '/') => {
    try {
      if (FSHandler.fs === null) {
        FSHandler.fs = await FS.getFsStructure(address);
      }

      path = (path.endsWith('/') ? path : path + '/');

      // Reset the current fs screen.
      $('#content-fs-content').html('<div class="container"></div>');

      // Draw the files.
      const structure = FSHandler.getStructure(path);
      for (const key of Object.keys(structure)) {
        const file = FSHandler.fs[key];
        FSHandler.drawFile(file);
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
    e.preventDefault();

    let ele = $(e.target);
    while (!ele.hasClass('list-group-item')) {
      ele = ele.parent();
    }

    const key = ele.parent().find('.fs-file-key').val();
    const path = Buffer.from(key, 'hex').toString();

    const fileName = Path.basename(path);
    const ipfsList = FSHandler.fs[path].ipfs;

    DownloadHandler.start(ipfsList, fileName, Wallet.pubKey);
  },

  deleteFile: async (e) => {
    e.preventDefault();

    let ele = $(e.target);
    while (!ele.hasClass('list-group-item')) {
      ele = ele.parent();
    }

    const key = ele.parent().find('.fs-file-key').val();
    const path = Buffer.from(key, 'hex').toString();
    const fileName = Path.basename(path);

    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        await FS.deleteFile(Wallet.address, path);

        // Delete from UI.
        $('#content-fs-content').find(`.fs-file-total > input[type="hidden"][value=${key}]`).parent().remove();
      } catch (err) {
        throw err;
      }
    }
  },

  renameFile: async (e) => {
    e.preventDefault();

    let ele = $(e.target);
    while (!ele.hasClass('list-group-item')) {
      ele = ele.parent();
    }

    const key = ele.parent().find('.fs-file-key').val();
    const path = Buffer.from(key, 'hex').toString();
    const fileName = Path.basename(path);

    let newFileName = '';
    while (true) {
      newFileName = prompt('Rename: ', fileName);

      // User hit the cancel button.
      if (newFileName === null) {
        return;
      } else if (newFileName.trim().length >= 1 && newFileName !== fileName) {
        break;
      }
    };

    const newPathBase = Path.dirname(path);
    const newPath = newPathBase + (newPathBase.endsWith('/') ? '' : '/') + newFileName;

    try {
      const newFile = await FS.renameFile(Wallet.address, path, newPath);

      delete FSHandler.fs[path];
      FSHandler.fs[newFile.path] = newFile;

      // Update the UI.
      const newKey = Buffer.from(newPath).toString('hex');
      const hidden = $('#content-fs-content').find(`.fs-file-total > input[type="hidden"][value=${key}]`);
      hidden.val(newKey);
      hidden.parent().find('.fs-file-name').html(newFileName);

      hidden.parent().find('[data-toggle="popover"]').popover('dispose');
      hidden.parent().find('[data-toggle="popover"]').popover({
        trigger: 'manual',
        html: true,
        content: function() {
          return `<ul id="popover-content" class="list-group">
                    <input class="fs-file-key" type="hidden" value="${newKey}" />
                    ${newFile.isFile ? '<a href="#" class="fs-download list-group-item"><i class="fas fa-download"></i><span>Download</span></a>' : ''}
                    <a href="#" class="fs-delete list-group-item"><i class="far fa-trash-alt"></i><span>Delete</span></a>
                    <a href="#" class="fs-rename list-group-item"><i class="far fa-edit"></i><span>Rename</span></a>
                    <a href="#" class="fs-move-file list-group-item"><i class="fas fa-file-export"></i><span>Move</span></a>
                  </ul>`;
        }
      });
    } catch (err) {
      throw err;
    }
  },

  createFolder: async (e) => {
    e.preventDefault();

    try {
      // Close the popover.
      $('#new-file-upload').popover('hide');

      let path = '';
      let folderName = '';

      while (true) {
        folderName = prompt('Folder Name: ');

        // user clicked "cancel".
        if (folderName === null) {
          return;
        }

        path = FSHandler.path + (FSHandler.path.endsWith('/') ? '' : '/') + folderName;

        if (folderName.trim().length >= 1 &&
            FSHandler.fs[path] === undefined &&
            /^[_a-zA-Z][_a-zA-Z0-9]*$/.test(folderName)) {
          break;
        }
      }

      // Update the server.
      await FS.createFolder(Wallet.address, path);

      const file = {
        path: path,
        ipfs: [],
        isFile: false,
      };
      FSHandler.fs[path] = file;

      // Update the UI.
      FSHandler.drawFile(file);
    } catch (err) {
      alert(err);
    }
  },

  openFolder: async (e) => {
    const key = $(e.currentTarget).parent().parent().parent().find('input[type="hidden"]').val();
    const path = Buffer.from(key, 'hex').toString();
    const folderName = Path.basename(path);
    const newPath = FSHandler.path + (FSHandler.path.endsWith('/') ? '' : '/') + folderName;

    // Update the UI.
    await FSHandler.drawFS(Wallet.address, newPath);
    FSHandler.path = newPath;
  },
};

module.exports = FSHandler;
