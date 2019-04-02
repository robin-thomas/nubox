const Path = require('path');

const FS = require('../fs.js');
const File = require('../upload/file.js');
const Wallet = require('../crypto/metamask.js');
const DownloadHandler = require('./downloader.js');
const ActivityHandler = require('./activity.js');

const Droppable = async (event, ui) => {
  const dropped = ui.draggable;
  const key = $(dropped).find('input[type="hidden"]').val();
  const path = Buffer.from(key, 'hex').toString();

  const folderKey = $(event.target).find('input[type="hidden"]').val();
  const folderPath = Buffer.from(folderKey, 'hex').toString();

  // Get the new path.
  let newFilePath = folderPath;
  newFilePath += (newFilePath.endsWith('/') ? '' : '/') + Path.basename(path);

  if (newFilePath !== path) {
    // Update the server.
    const newFile = await FS.renameFile(Wallet.address, path, newFilePath);
    delete FSHandler.fs[path];
    FSHandler.fs[newFilePath] = newFile;

    // Update the activity
    ActivityHandler.load(Wallet.address);

    // Update the UI.
    $(dropped).remove();
  }
}

const FSHandler = {
  fs: null,
  fsSize: 0,
  path: '/',
  pathStack: ['/'],

  drawFSHeader: (fsEle = $('#content-fs')) => {
    // Get the last 6 folders nested deep.
    const arr = (FSHandler.pathStack.length <= 6) ? FSHandler.pathStack : FSHandler.pathStack.slice(FSHandler.pathStack.length - 6);

    fsEle.find('.content-fs-header').find('.row').html('');
    for (const folder of arr) {
      let folderName = Path.basename(folder);
      if (folderName == null || folderName === undefined ||
          folderName === '/' || folderName.trim().length === 0) {
        folderName = 'nuBox';
      } else if (folderName.length > 12) {
        folderName = `${folderName.substr(0, 4)}...${folderName.substr(folderName.length - 5)}`;
      }

      const path = Buffer.from(folder).toString('hex');

      const row = `<div class="col-md-2 d-table droppable">
                    <input type="hidden" value="${path}" />
                    <span class="d-table-cell align-middle">${folderName}</span>
                  </div>`;
      fsEle.find('.content-fs-header').find('.row').append(row);
      fsEle.find('.content-fs-header').find('.droppable').droppable({
        accept: function (dropped) {
          const key = $(dropped).find('input[type="hidden"]').val();
          const path = Buffer.from(key, 'hex').toString();

          const folderKey = $(this).find('input[type="hidden"]').val();
          const folderPath = Buffer.from(folderKey, 'hex').toString();

          // Get the new path.
          let newFilePath = folderPath;
          newFilePath += (newFilePath.endsWith('/') ? '' : '/') + Path.basename(path);

          return newFilePath !== path;
        },
        drop: Droppable,
      });
    }
  },

  drawFile: (file, fsEle = $('#content-fs > .content-fs-content'), shared = false) => {
    const name = Path.basename(file.path);
    const el = new SimpleBar(fsEle[0]);

    // Find the last row.
    let row = fsEle.find('.simplebar-content').find('.container > .row');
    if (row === null || row === undefined || row.length < 1) {
      fsEle.find('.simplebar-content').find('.container').html('<div class="row no-gutters"></div>');
      row = fsEle.find('.simplebar-content').find('.container > .row').first();
    } else {
      // Check if enough columns are already present.
      row = row.last();
      if (row.find('.col-md-2').length === 6) {
        fsEle.find('.simplebar-content').find('.container').append('<div class="row no-gutters"></div>');
        row = fsEle.find('.simplebar-content').find('.container > .row').last();
      }
    }

    const key = Buffer.from(file.path).toString('hex');
    const folder = `<div class="fs-file-total col-md-2 ${file.isFile && shared === false ? 'draggable' : 'droppable'}">
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
                  ${shared === true ? '' : '<a href="#" class="fs-delete list-group-item"><i class="far fa-trash-alt"></i><span>Delete</span></a>'}
                  ${shared === true ? '' : '<a href="#" class="fs-rename list-group-item"><i class="far fa-edit"></i><span>Rename</span></a>'}
                  <a href="#" class="fs-info list-group-item"><i class="fas fa-info-circle"></i><span>Info</span></a>
                  ${file.isFile && shared === false ? '<a href="#" class="fs-share list-group-item"><i class="fas fa-share-alt"></i><span>Share</span></a>' : ''}
                </ul>`;
      }
    });

    // Make all the files draggable.
    fsEle.find('.draggable').draggable({
      cursor: 'crosshair',
      revert: 'invalid',
      containment: '.content-fs',
    });

    // Make all the folders droppable.
    fsEle.find('.droppable').droppable({
      accept: function (dropped) {
        const key = $(dropped).find('input[type="hidden"]').val();
        const path = Buffer.from(key, 'hex').toString();

        const folderKey = $(this).find('input[type="hidden"]').val();
        const folderPath = Buffer.from(folderKey, 'hex').toString();

        // Get the new path.
        let newFilePath = folderPath;
        newFilePath += (newFilePath.endsWith('/') ? '' : '/') + Path.basename(path);

        return newFilePath !== path;
      },
      drop: Droppable,
    });

    el.recalculate();
  },

  getTotalFileSize: () => {
    let size = 0;

    for (const key of Object.keys(FSHandler.fs)) {
      const file = FSHandler.fs[key];

      if (file.isFile) {
        size += file.fileSize;
      }
    }

    return size;
  },

  updateStorageUI: () => {
    const totalSize = File.getFileSize(FSHandler.fsSize);
    $('#account-dashboard .fs-total-storage').html(totalSize);
  },

  drawFS: async (address, path = '/') => {
    try {
      if (FSHandler.fs === null) {
        FSHandler.fs = await FS.getFsStructure(address);
        FSHandler.fsSize = FSHandler.getTotalFileSize();
        FSHandler.updateStorageUI();
      }

      path = (path.endsWith('/') ? path : path + '/');

      // Reset the current fs screen.
      $('#content-fs .content-fs-content').html('<div class="container"></div>');

      // Display empty folder banner if required.
      const structure = FSHandler.getStructure(path);
      if (structure === null || structure === undefined ||
          Object.keys(structure).length === 0) {
        $('#fs-empty-folder-display').show();
      } else {
        $('#fs-empty-folder-display').hide();
      }

      // Draw the files.
      for (const key of Object.keys(structure)) {
        const file = FSHandler.fs[key];
        FSHandler.drawFile(file);
      }

      // Make all the files draggable.
      $('#content-fs .content-fs-content').find('.draggable').draggable({
        cursor: 'crosshair',
        revert: 'invalid',
      });

      // Make all the folders droppable.
      $('#content-fs .content-fs-content').find('.droppable').droppable({
        accept: '.draggable',
        drop: Droppable,
      });

      // Draw the header.
      FSHandler.drawFSHeader();
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
      if (index === 0 &&
          file.path.indexOf('/', path.length) === -1) {
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

    DownloadHandler.start(ipfsList, fileName, path);
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

        FSHandler.fsSize -= FSHandler.fs[path].fileSize;
        const newFile = FSHandler.fs[path];
        delete FSHandler.fs[path];

        FSHandler.updateStorageUI();
        FSHandler.drawFS(Wallet.address, FSHandler.path);

        if (!newFile.isFile) {
          FSHandler.deleteFileForChildren(path);
        }

        ActivityHandler.load(Wallet.address);

        // Delete from UI.
        $('#content-fs .content-fs-content').find(`.fs-file-total > input[type="hidden"][value=${key}]`).parent().remove();
      } catch (err) {
        throw err;
      }
    }
  },

  deleteFileForChildren: (path) => {
    for (const childPath of Object.keys(FSHandler.fs)) {
      if (childPath.startsWith(path + '/')) {
        if (FSHandler.fs[childPath].isFile) {
          FSHandler.fsSize -= FSHandler.fs[childPath].fileSize;
        }
        delete FSHandler.fs[childPath];
      }
    }
    FSHandler.updateStorageUI();
  },

  getNewNameForRename: (path) => {
    const pathBase = Path.dirname(path);
    const fileName = Path.basename(path);

    let newPath = '';
    let newFileName = '';
    while (true) {
      newFileName = prompt('Rename: ', fileName);

      // User hit the cancel button.
      if (newFileName === null) {
        return null;
      }

      // Make sure that the filename matches the name syntax.
      if (newFileName.trim().length < 1 ||
          !/^[_a-zA-Z][_a-zA-Z0-9.]*$/.test(newFileName)) {
        continue;
      }

      // check that this name hasn't been taken in this level.
      newPath = pathBase + (pathBase.endsWith('/') ? '' : '/') + newFileName;
      if (FSHandler.fs[newPath] !== undefined) {
        continue;
      }

      break;
    }

    return newPath;
  },

  renameFile: async (e) => {
    e.preventDefault();

    // Get the file path.
    let ele = $(e.target);
    while (!ele.hasClass('list-group-item')) {
      ele = ele.parent();
    }
    const key = ele.parent().find('.fs-file-key').val();
    const path = Buffer.from(key, 'hex').toString();

    // Get the new file path.
    const newPath = FSHandler.getNewNameForRename(path);
    if (newPath === null) {
      return;
    }
    const newFileName = Path.basename(newPath);

    try {
      const newFile = await FS.renameFile(Wallet.address, path, newPath);
      delete FSHandler.fs[path];
      FSHandler.fs[newFile.path] = newFile;

      // Update the children if its a folder.
      if (!newFile.isFile) {
        FSHandler.renameFileForChildren(path, newPath);
      }

      // Update the UI.
      ActivityHandler.load(Wallet.address);
      const newKey = Buffer.from(newPath).toString('hex');
      const hidden = $('#content-fs .content-fs-content').find(`.fs-file-total > input[type="hidden"][value=${key}]`);
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
                    <a href="#" class="fs-info list-group-item"><i class="fas fa-info-circle"></i><span>Info</span></a>
                    ${newFile.isFile ? '<a href="#" class="fs-share list-group-item"><i class="fas fa-share-alt"></i><span>Share</span></a>' : ''}
                  </ul>`;
        }
      });
    } catch (err) {
      throw err;
    }
  },

  renameFileForChildren: (path, newPath) => {
    for (const childPath of Object.keys(FSHandler.fs)) {
      if (childPath.startsWith(path + '/')) {
        let newFile = FSHandler.fs[childPath];
        newFile.path = newPath + childPath.substr(path.length);

        delete FSHandler.fs[childPath];
        FSHandler.fs[newFile.path] = newFile;
      }
    }
  },

  getChildDetailsForFileInfo: (path) => {
    let childCount = 0;
    let childFileSize = 0;

    const file = FSHandler.fs[path];
    if (file.isFile === true) {
      return {childCount, childFileSize};
    }

    for (const childPath of Object.keys(FSHandler.fs)) {
      if (childPath.startsWith(path) && path !== childPath) {
        childCount++;
        childFileSize += FSHandler.fs[childPath].fileSize;
      }
    }

    childFileSize = File.getFileSize(childFileSize);

    return {childCount, childFileSize};
  },

  fileInfo: (e) => {
    e.preventDefault();

    // Get the file.
    let ele = $(e.target);
    while (!ele.hasClass('list-group-item')) {
      ele = ele.parent();
    }
    const key = ele.parent().find('.fs-file-key').val();
    const path = Buffer.from(key, 'hex').toString();
    const file = FSHandler.fs[path];

    const fileName = Path.basename(path);
    const {childCount, childFileSize} = FSHandler.getChildDetailsForFileInfo(path);

    const rows = `<tr>
                    <th scope="row">Name</th>
                    <td>${fileName}</td>
                  </tr>
                  <tr>
                    <th scope="row">Path</th>
                    <td>${path}</td>
                  </tr>
                  ${file.isFile ? `
                    <tr>
                      <th scope="row">Size</th>
                      <td>${File.getFileSize(file.fileSize)}</td>
                    </tr>
                    <tr>
                      <th scope="row">Type</th>
                      <td>${file.fileType}</td>
                    </tr>` : `
                    <tr>
                      <th scope="row">Contents</th>
                      <td>${childCount} item(s) totalling ${childFileSize}</td>
                    </tr>`}
                  <tr>
                    <th scope="row">Created on</th>
                    <td>${file.created}</td>
                  </tr>
                  <tr>
                    <th scope="row">Last modified on</th>
                    <td>${file.modified}</td>
                  </tr>`;

    $('#file-info-dialog').find('.modal-title').html(`${file.isFile ? 'File' : 'Folder'} Info`);
    $('#file-info-dialog').find('table').html(`<tbody>${rows}</tbody>`);
    $('#file-info-dialog').modal('show');
  },

  createFolder: async (e) => {
    e.preventDefault();

    try {
      // Close the popover.
      $('#new-file-upload').popover('hide');

      // Get a name for the new folder.
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
            /^[_a-zA-Z][_a-zA-Z0-9.]*$/.test(folderName)) {
          break;
        }
      }

      // Update the server.
      const file = await FS.createFolder(Wallet.address, path);
      FSHandler.fs[path] = file;

      // Update the UI.
      FSHandler.drawFile(file);
      ActivityHandler.load(Wallet.address);
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
    FSHandler.pathStack.push(newPath);
    FSHandler.drawFSHeader();
  },

  openFolderFromHeader: async (e) => {
    const key = $(e.currentTarget).find('input[type="hidden"]').val();
    const path = Buffer.from(key, 'hex').toString();

    // Update the UI.
    await FSHandler.drawFS(Wallet.address, path);
    FSHandler.path = path;

    const index = FSHandler.pathStack.indexOf(path);
    FSHandler.pathStack = FSHandler.pathStack.slice(0, index + 1);
    FSHandler.drawFSHeader();
  },
};

module.exports = FSHandler;
