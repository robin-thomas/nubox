const WalletHandler = require('./modules/handlers/metamask.js');
const FSHandler = require('./modules/handlers/fs.js');
const ContactsHandler = require('./modules/handlers/contacts.js');
const FileUploadHandler = require('./modules/handlers/uploader.js');
const ShareHandler = require('./modules/handlers/share.js');

$(document).ready(async () => {
  try {
    await nuBox.checkForExtension();
  } catch (err) {
    alert(err.message);
  }

  const confirmAddrButton       = $('#confirm-eth-addr'),
        confirmNewContactButton = $('#confirm-add-contact');

  $('#wallet-login-button').on('click', async (e) => WalletHandler.walletConnectHandler(e));
  confirmAddrButton.on('click', () => WalletHandler.walletConnectConfirmHandler(confirmAddrButton));
  $('#wallet-logout-button').on('click', WalletHandler.walletLogoutHandler);
  $('#contacts-right-connect').on('click', async (e) => WalletHandler.walletConnectHandler(e));

  $('#add-new-contact').on('click', ContactsHandler.addNewContactDisplayHandler);
  confirmNewContactButton.on('click', () => ContactsHandler.addNewContactHandler(confirmNewContactButton));
  $('#contacts-after-connect').on('click', '.fa-trash-alt', (e) => ContactsHandler.deleteContactHandler(e.target));

  $('.content-fs').on('contextmenu', '.fs-file-icon', (e) => {
    e.preventDefault();

    const popover = $(document).find('.popover');
    if (popover.length >= 1) {
      const id = popover.first().attr('id');
      $('.content-fs').find(`[aria-describedBy="${id}"]`).popover('toggle');
    }

    $(e.target).popover('toggle');
  });

  $('.content-fs').on('contextmenu', (e) => {
    e.preventDefault();

    const popover = $(document).find('.popover');
    if (popover.length >= 1) {
      const id = popover.first().attr('id');
      $('#account-dashboard').find(`[aria-describedBy="${id}"]`).popover('hide');
    }
  });

  $('#account-dashboard .nav-link').on('click', ShareHandler.openShareFileUI);

  $(document).on('click', '.popover .fs-info', FSHandler.fileInfo);
  $(document).on('click', '.popover .fs-download', FSHandler.downloadFile);
  $(document).on('click', '.popover .fs-delete', FSHandler.deleteFile);
  $(document).on('click', '.popover .fs-rename', FSHandler.renameFile);
  $(document).on('click', '.popover .fs-new-folder', FSHandler.createFolder);
  $(document).on('click', '.popover .fs-new-file', (e) => {
    e.preventDefault();
    const id = $(document).find('.popover').first().attr('id');
    $('#account-dashboard').find(`[aria-describedBy="${id}"]`).popover('hide');
    $('#upload-file-dialog').modal('show');
  });
  $(document).on('click', '.popover .fs-share', ShareHandler.constructShareFileUI);
  $(document).on('dblclick', '.fa-folder', FSHandler.openFolder);
  $('#content-fs .content-fs-header .row').on('click', '.col-md-2', FSHandler.openFolderFromHeader);
  $('#confirm-share-file').on('click', (e) => ShareHandler.confirmShare(e, true));
  $('#share-file-dialog').on('change', '.share-file-revoke-grant', async function(e) {
    if (this.checked) {
      try {
        await ShareHandler.confirmShare(e);
      } catch (err) {
        console.log(err);
        $(this).prop('checked', false);
      }
    } else {
      try {
        await ShareHandler.revokeAccess(e);
      } catch (err) {
        console.log(err);
        $(this).prop('checked', true);
      }
    }
  });
  $('#share-file-dialog .input-group-append').on('click', () => {
    const open = $('#share-file-dialog').find('#share-file-expiration').datepicker( "widget" ).is(":visible");

    if (!open) {
      $('#share-file-dialog').find('#share-file-expiration').datepicker('show');
    }
  });

  $(document).on('click', () => {
    const popover = $(document).find('.popover');
    if (popover.length >= 1) {
      const id = popover.first().attr('id');
      $('.content-fs').find(`[aria-describedBy="${id}"]`).popover('hide');
    }
  });

  $('#file-upload').on('change', (e) => FileUploadHandler.handler(e));
  $('#file-upload-progress').on('click', '.file-upload-progress-cancel', (e) => {
    const parent = $(e.currentTarget).parent().parent();
    const key = parent.find('.file-upload-progress-key').val();

    const status = FileUploadHandler.getStatus(key);
    switch (status) {
      case 'COMPLETED':
        alert('This file has already been uploaded');
        parent.parent().parent().parent().remove();
        break;

      case 'FAILED':
        alert('This file upload has already failed');
        FileUploadHandler.destroy(key);
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

  // Check if already logged in.
  WalletHandler.walletConnectConfirmHandler();

  $('[data-toggle="tooltip"]').tooltip();
  $('#new-file-upload').popover({
    trigger: 'click',
    placement: 'bottom',
    html: true,
    content: function() {
      return `<ul id="popover-content" class="list-group">
                <a href="#" class="fs-new-folder list-group-item"><i class="fas fa-folder-plus"></i>&nbsp;&nbsp;New Folder</a>
                <a href="#" class="fs-new-file list-group-item"><i class="fas fa-file-upload"></i>&nbsp;&nbsp;File Upload</a>
              </ul>`;
    }
  });

  $('#open-contacts-dashboard').on('click', () => {
    $('#contacts-dashboard').animate({
      right: 0,
    }, 300);
  });
  $('#close-contacts-dashboard').on('click', () => {
    $('#contacts-dashboard').animate({
      right: '-300px',
    }, 300);
  });

  $('#open-activity-dashboard').on('click', () => {
    $('#activity-dashboard').animate({
      right: 0,
    }, 300);
  });
  $('#close-activity-dashboard').on('click', () => {
    $('#activity-dashboard').animate({
      right: '-300px',
    }, 300);
  });

  $('.modal').on('show.bs.modal', function() {
    const idx = $('.modal:visible').length;
    $(this).css('z-index', 1040 + (10 * idx));
  });
  $('.modal').on('shown.bs.modal', function() {
    const idx = ($('.modal:visible').length) -1; // raise backdrop after animation.
    $('.modal-backdrop').not('.stacked').css('z-index', 1039 + (10 * idx));
    $('.modal-backdrop').not('.stacked').addClass('stacked');
  });

});
