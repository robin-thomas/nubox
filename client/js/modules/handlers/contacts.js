const Contacts = require('../contacts.js');
const Wallet = require('../crypto/metamask.js');

const config = require('../../../../config.json');

const contactsBeforeConnect   = $('#contacts-before-connect'),
      contactsAfterConnect    = $('#contacts-dashboard'),
      expenseContacts         = $('#expense-contacts'),
      newContactAddress       = $('#new-contact-address'),
      newContactNickname      = $('#new-contact-nickname'),
      newContactEncryptingKey = $('#new-contact-encrypting-key'),
      newContactVerifyingKey  = $('#new-contact-verifying-key');

const addContactDialog = $('#add-contact-dialog');

const ContactsHandler = {
  contactsList: [],

  createContactsBeforeConnect: () => {
    contactsBeforeConnect.html('<br /><br />');

    for (let i = 0; i < 10; ++i) {
      const row = '\
        <div class="row">\
          <div class="col-md-2">\
            <svg width="28" height="28">\
              <circle cx="14" cy="14" r="14" fill="#12131f"></circle>\
            </svg>\
          </div>\
          <div class="col-md-7">\
            <div class="row">\
              <div class="col">\
                <svg width="160" height="28">\
                  <rect width="160" height="14" fill="#12131f"></rect>\
                </svg>\
              </div>\
            </div>\
            <div class="row">\
              <div class="col">\
                <svg width="60" height="28">\
                  <rect width="60" height="14" fill="#12131f"></rect>\
                </svg>\
              </div>\
            </div>\
          </div>\
          <div class="col-md-3"></div>\
        </div>';
      contactsBeforeConnect.append(row);
    }
  },

  contactsDisplayHandler: () => {
    const names = ContactsHandler.contactsList.filter(e => e.hasOwnProperty('nickname')).map(e => e.nickname);
    try {
      expenseContacts.autocomplete({
        source: names
      });
    } catch (err) {
      console.log(err);
    }

    let rows = '';
    for (let i in ContactsHandler.contactsList) {
      const contact = ContactsHandler.contactsList[i];

      const contactName = contact.nickname.split(' ')[0];

      const row = '<div class="row">\
                    <div class="col-md-2">\
                      <i class="fas fa-user-circle" style="font-size:1.5em;"></i>\
                    </div>\
                    <div class="col-md-7" style="text-align:left;">'
                     + contactName +
                    '</div>\
                    <div class="col-md-2">\
                      <input type="hidden" class="contact-name" value="' + contactName + '" />\
                      <input type="hidden" class="contact-address" value="' + contact.address + '" />\
                      <i class="fas fa-trash-alt link-circle-hover" style="cursor:pointer;" title="Delete contact"></i>\
                    </div>\
                  </div>';

      rows += row;
    }

    const html = `<div id="contacts-display">${rows}</div>`;
    contactsAfterConnect.find('#contacts-dashboard-display').html(html);

    const el = new SimpleBar(contactsAfterConnect.find('#contacts-display')[0]);
    el.recalculate();
    contactsAfterConnect.find('#contacts-display .fa-trash-alt').tooltip();
  },

  addNewContactHandler: async (btn, contact) => {
    btn = (btn === undefined || btn === null ? null : btn);

    const contactName = btn !== null ? newContactNickname.val() : contact.nickname;
    const contactAddress = btn !== null ? newContactAddress.val() : contact.address;
    const contactEncryptingKey = btn !== null ? newContactEncryptingKey.val() : contact.bek;
    const contactVerifyingKey = btn !== null ? newContactVerifyingKey.val() : contact.bvk;

    // Validate the fields.
    try {
      await Contacts.validateNewContactFields(contactAddress, contactName);
    } catch (err) {
      alert(err.message);
      return;
    }

    if (btn) {
      const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Adding...';
      btn.data('original-text', btn.html());
      btn.html(loadingText);
    }

    // Add the new contact.
    try {
      await Contacts.addNewContact({
        contact_address: contactAddress,
        contact_nickname: contactName,
        address: Wallet.address,
        contact_encrypting_key: contactEncryptingKey,
        contact_verifying_key: contactVerifyingKey,
      });
    } catch (err) {
      if (btn) {
        btn.html(btn.data('original-text'));
      }

      alert(err.message);
      return;
    }

    // Send an invite to the contact.
    if (confirm("Do you want to invite this contact through an ETH transaction (gas costs included)?")) {
      const rawTransaction = {
        "from": Wallet.address,
        "to": contactAddress,
        "data": window.web3.utils.toHex(config.app.url),
        "gas": 200000
      };
      try {
        await window.web3.eth.sendTransaction(rawTransaction);
      } catch(err){
        alert('Failed to send the transaction!');
      }
    }

    // Load all the contacts
    ContactsHandler.contactsList.push({
      address: contactAddress,
      nickname: contactName,
      bek: contactEncryptingKey,
      bvk: contactVerifyingKey,
    });
    ContactsHandler.contactsDisplayHandler();

    if (btn) {
      btn.html(btn.data('original-text'));
      addContactDialog.modal('hide');
    }
  },

  deleteContactHandler: async (ele) => {
    const contactAddress = $(ele).parent().find('.contact-address').val();
    const contactName = $(ele).parent().find('.contact-name').val();

    try {
      if (confirm('Are you sure you want to delete ' + contactName + ' from your contacts?')) {
        $(ele).tooltip('hide');

        // TODO: handle files already shared with this contact.
        await Contacts.deleteContact({address: Wallet.address, contactAddress: contactAddress});

        ContactsHandler.contactsList = ContactsHandler.contactsList.filter(e => e.address !== contactAddress);
        ContactsHandler.contactsDisplayHandler();
      }
    } catch (err) {
      alert(err.message);
    }
  },

  addNewContactDisplayHandler: () => {
    addContactDialog.find('input[type="text"]').val('');
    addContactDialog.modal('show');
  },
};

module.exports = ContactsHandler;
