const File = {
  updateTotalFilesSize: (files) => {
    // Calculate the total file size.
    let currentSize = $('#upload-file-dialog').find('#file-upload-progress-total-size').val();
    currentSize = parseInt(currentSize);
    currentSize = isNaN(currentSize) ? 0 : currentSize;

    let newSize = files.map(e => e.size).reduce((a, b) => a + b, 0);
    newSize = parseInt(newSize);
    newSize = isNaN(newSize) ? 0 : newSize;

    // Convert it into human-readable form.
    const totalSize = currentSize + newSize;
    $('#upload-file-dialog').find('#file-upload-progress-total-size').val(totalSize);
    const size = File.getFileSize(totalSize);

    // Update the UI.
    $('#upload-file-dialog').find('#file-upload-progress-total-size-display > b').html(size);
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

module.exports = File;
