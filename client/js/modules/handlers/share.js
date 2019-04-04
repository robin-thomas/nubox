const moment = require('moment');

const Activity = require('./activity.js')
const Wallet = require('../crypto/metamask.js');
const Shares = require('../shares.js');
const FSHandler = require('./fs.js');
const ContactsHandler = require('./contacts.js');

const shareFileDialog = $('#share-file-dialog');
const contactText = shareFileDialog.find('#share-file-contact')
const contactExpire = shareFileDialog.find('#share-file-expiration');
const shareBtn = shareFileDialog.find('#confirm-share-file');

const ShareHandler = {
  constructRowForShareFileUI: (contact) => {
    return `<div class="row no-gutters" style="margin:15px 0">
              <input type="hidden" value="${contact.bek}" class="contact-bek" />
              <input type="hidden" value="${contact.bvk}" class="contact-bvk" />
              <div class="col-md-2">
                <i class="fas fa-user-circle" style="font-size:2.5em;"></i>
              </div>
              <div class="col-md-8">
                <div class="row"><div class="col file-share-contact-nickname">${contact.nickname}</div></div>
                <div class="row"><div class="col file-share-contact-address" style="font-size:11px">${contact.address}</div></div>
              </div>
              <div class="col-md-2" style="display:flex;align-items:center;justify-content:center">
                <div class="form-check">
                  ${contact.bek === undefined ? '' : '<input class="form-check-input share-file-revoke-grant" type="checkbox" checked>'}
                </div>
              </div>
            </div>`;
  },

  createSharedWithUI: async (key) => {
    // Get which contacts have access.
    const path = Buffer.from(key, 'hex').toString();
    const fileId = FSHandler.fs[path].id;
    const contactsWithAccess = await Shares.getSharedWith(Wallet.address, fileId);

    // Build the shared with UI.
    let rows = ShareHandler.constructRowForShareFileUI({ nickname: '(you)', address: Wallet.address });
    for (const contact of contactsWithAccess) {
      const row = ShareHandler.constructRowForShareFileUI(contact);
      rows += row;
    }
    const html = `<div class="container">${rows}</div>`;
    shareFileDialog.find('#contacts-shared-with-file').html(html);

    new SimpleBar(shareFileDialog.find('#contacts-shared-with-file')[0]);

    let url = $(location).attr("href");
    url += (url.endsWith('/') ? '' : '/') + 'download/' + FSHandler.fs[path].hash;
    shareFileDialog.find('#share-file-link').val(url);
  },

  constructShareFileUI: async (e) => {
    e.preventDefault();

    const id = $(document).find('.popover').first().attr('id');
    $('#account-dashboard').find(`[aria-describedBy="${id}"]`).popover('hide');

    contactText.val('');
    const names = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
    try {
      contactText.autocomplete({
        source: names
      });
    } catch (err) {}

    contactExpire.val('');
    contactExpire.datepicker({
      minDate: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)),
      dateFormat: 'yy-mm-dd',
    });

    // Get the file key and store it in the share-file dialog.
    let ele = $(e.target);
    while (!ele.hasClass('list-group-item')) {
      ele = ele.parent();
    }
    const key = ele.parent().find('.fs-file-key').val();
    shareFileDialog.find('#share-file-path').val(key);

    await ShareHandler.createSharedWithUI(key);

    shareFileDialog.modal('show');
  },

  confirmShare: async (e, btn = false) => {
    // share for first time for this contact.
    let expiration = moment().add(10, 'days').format('YYYY-MM-DD') + ' 00:00:00';
    let contactName;
    if (btn) {
      // Validate input.
      contactName = contactText.val();
      const names = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
      if (contactName.trim().length === 0 || names.indexOf(contactName) === -1) {
        contactText.focus();
        return;
      }

      const date = contactExpire.val();
      if (!(moment(date, 'YYYY-MM-DD').isValid())) {
        $('#share-file-dialog').find('#share-file-expiration').datepicker('show');
        return;
      }
      expiration = moment(date).format('YYYY-MM-DD') + ' 00:00:00';

      const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Sharing...';
      shareBtn.data('original-text', shareBtn.html());
      shareBtn.html(loadingText).attr('disabled', 'disabled');
    }

    try {
      let bek, bvk, sharedWith;
      if (btn) {
        const bob = await nuBox.getBobKeys();
        bek = bob.bek;
        bvk = bob.bvk;
        sharedWith = ContactsHandler.contactsList.filter(e => e.nickname === contactName).map(e => e.address);
      } else {
        const parent = $(e.currentTarget).parent().parent().parent();
        bek = parent.find('.contact-bek').val();
        bvk = parent.find('.contact-bvk').val();
        sharedWith = parent.find('.file-share-contact-address').html();
      }

      // Get the file path.
      const key = shareFileDialog.find('#share-file-path').val();
      const label = Buffer.from(key, 'hex').toString();

      await nuBox.grant(label, bek, bvk, expiration);

      await Shares.shareFile(Wallet.address, sharedWith, FSHandler.fs[label].id);

      if (btn) {
        await Activity.load(Wallet.address);
        await ShareHandler.createSharedWithUI(key);
      }

    } catch (err) {
      if (btn) {
        alert(err);
      } else {
        throw err;
      }
    }

    if (btn) {
      shareBtn.html(shareBtn.data('original-text')).attr('disabled', false);
    }
  },

  revokeAccess: async (e) => {
    try {
      const parent = $(e.currentTarget).parent().parent().parent();
      const sharedWith = parent.find('.file-share-contact-address').html();
      // const bek = parent.find('.contact-bek').val();
      // const bvk = parent.find('.contact-bvk').val();

      // Get the file path.
      const key = shareFileDialog.find('#share-file-path').val();
      const label = Buffer.from(key, 'hex').toString();

      await nuBox.revoke(label);

      // delete the share from the server.
      await Shares.deleteShare(Wallet.address, sharedWith, FSHandler.fs[label].id);
    } catch (err) {
      throw err;
    }
  },

  openShareFileUI: async (e) => {
    e.preventDefault();

    const ele = $(e.currentTarget);
    if (!ele.hasClass('nav-link-active')) {
      if (!$('#content-fs-shared').hasClass('content-fs-shared-active')) {
        // Reset the current fs screen.
        $('#content-fs-shared .content-fs-content').html('<div class="container"></div>');

        // Display empty folder banner if required.
        const files = await Shares.getShares(Wallet.address);
        if (files.length === 0) {
          $('#content-fs-shared #fs-empty-folder-display').show();
        } else {
          $('#content-fs-shared #fs-empty-folder-display').hide();
        }

        for (const file of files) {
          FSHandler.drawFile(file, $('#content-fs-shared .content-fs-content'), true);
        }
      }

      $('#content-fs-shared').toggleClass('content-fs-shared-active');
      ele.parent().siblings().find('.nav-link').removeClass('nav-link-active');
      ele.addClass('nav-link-active');
    }
  },
};

module.exports = ShareHandler;
