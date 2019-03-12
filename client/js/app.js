const FileUploadHandler = require('./modules/handlers/uploader.js');
const FileDownloadHandler = require('./modules/handlers/downloader.js');

const Metamask = require('./modules/crypto/metamask.js');

$(document).ready(async () => {

  $('#file-upload').on('change', (e) => FileUploadHandler.handler(e));
  $('#file-upload-progress').on('click', '.file-upload-progress-cancel', (e) => {
    const parent = $(e.currentTarget).parent().parent();
    const key = parent.find('.file-upload-progress-key').val();

    const status = FileUploadHandler.getStatus(key);
    switch (status) {
      case 'COMPLETED':
        alert('This file has already been uploaded');
        parent.parent().parent().remove();
        break;

      case 'FAILED':
        alert('This file upload has already failed');
        parent.parent().parent().parent().remove();
        break;

      default:
        if (confirm('Are you sure you want to cancel this upload?')) {
          FileUploadHandler.destroy(key);
          parent.parent().parent().parent().remove();
        }
    }
  });

  $('#file-upload-fake').on('click', () => $('#file-upload').click());

  $('#file-upload-progress').on('click', '.file-upload-progress-pause', (e) => {
    const key = $(e.currentTarget).parent().parent().find('.file-upload-progress-key').val();
    FileUploadHandler.pause(key);

    const html = '<i class="fas fa-play file-upload-progress-play" style="cursor:pointer;"></i>&nbsp;&nbsp;\
                  <i class="fas fa-times file-upload-progress-cancel" style="cursor:pointer;"></i>';
    $(e.currentTarget).parent().html(html);
  });

  $('#file-upload-progress').on('click', '.file-upload-progress-play', (e) => {
    const key = $(e.currentTarget).parent().parent().find('.file-upload-progress-key').val();
    FileUploadHandler.start(null, key);

    const html = '<i class="fas fa-pause file-upload-progress-pause" style="cursor:pointer;"></i>&nbsp;&nbsp;\
                  <i class="fas fa-times file-upload-progress-cancel" style="cursor:pointer;"></i>';
    $(e.currentTarget).parent().html(html);
  });

  $('#upload-file-dialog').modal('show');

  // FileDownloadHandler.start();
  // const address = (await Metamask.loadWeb3())[0];
  // const pubKey = await Metamask.personalSign(address, 'hello');
});
