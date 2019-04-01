const moment = require('moment');

const Wallet = require('../crypto/metamask.js');
const Shares = require('../shares.js');
const FSHandler = require('./fs.js');
const ContactsHandler = require('./contacts.js');

const shareFileDialog = $('#share-file-dialog');
const contactText = shareFileDialog.find('#share-file-contact')
const contactExpire = shareFileDialog.find('#share-file-expiration');
const shareBtn = shareFileDialog.find('#confirm-share-file');
const revokeBtn = shareFileDialog.find('#revoke-share-file');

const ShareHandler = {
  confirmShare: async () => {
    // Validate input.
    const contactName = contactText.val();
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
    const expiration = moment(date).format('YYYY-MM-DD') + ' 00:00:00';

    const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Sharing...';
    shareBtn.data('original-text', shareBtn.html());
    shareBtn.html(loadingText).attr('disabled', 'disabled');

    try {
      const { bek, bvk } = await nuBox.getBobKeys();

      // Get the file path.
      const key = shareFileDialog.find('#share-file-path').val();
      const label = Buffer.from(key, 'hex').toString();

      await nuBox.grant(label, bek, bvk, expiration);

      const sharedWith = ContactsHandler.contactsList.filter(e => e.nickname === contactName).map(e => e.address);
      await Shares.shareFile(Wallet.address, sharedWith, FSHandler.fs[label].id);
    } catch (err) {
      alert(err);
    }

    shareBtn.html(shareBtn.data('original-text')).attr('disabled', false);
    shareFileDialog.modal('close');
  },

  revokeAccess: async () => {
    const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Revoking...';
    revokeBtn.data('original-text', revokeBtn.html());
    revokeBtn.html(loadingText).attr('disabled', 'disabled');

    try {
      // Get the file path.
      const key = shareFileDialog.find('#share-file-path').val();
      const label = Buffer.from(key, 'hex').toString();

      await nuBox.revoke(label);
    } catch (err) {
      alert(err);
    }

    revokeBtn.html(revokeBtn.data('original-text')).attr('disabled', false);
  },
};

module.exports = ShareHandler;
