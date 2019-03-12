const ethUtil = require('ethereumjs-util');

const config = require('../../../config.json');
const Wallet = require('./crypto/metamask.js');
const Session = require('./session/session.js');

const Contacts = {
  validateContactFields: (address, name) => {
    // Validate Name.
    if (name.trim().length === 0) {
      throw new Error('Nickname cannot be empty!');
    }
    const nameValid = /^[a-zA-Z ]+$/.test(name);
    if (!nameValid) {
      throw new Error('Nickname not in valid format!');
    }

    // Validate ETH address.
    if (address.trim().length === 0) {
      throw new Error('ETH Address cannot be not empty!');
    }
    const addressValid = ethUtil.isValidAddress(address);
    if (!addressValid) {
      throw new Error('ETH Address not valid!');
    }

    if (address.trim() === Wallet.address) {
      throw new Error('Contact address cannot be as same as your address!');
    }
  },

  validateNewContactFields: async (address, name) => {
    // Validate the fields.
    try {
      Contacts.validateContactFields(address, name);
    } catch (err) {
      throw err;
    }

    // Validate that this address or name hasnt been used before.
    try {
      const out = await Contacts.searchContacts({
        address: Wallet.address,
        contactAddress: address,
        contactName: name,
      });

      if (out.length >= 1) {
        throw new Error('This contact name or address had been used before!');
      }
    } catch (err) {
      throw err;
    }
  },

  addNewContact: async (data) => {
    try {
      const out = await Session.api(config.api.addContact.name, data);
      return out;
    } catch (err) {
      throw err;
    }
  },

  loadContacts: async (address) => {
    try {
      const out = await Session.api(config.api.getAllContacts.name, {address: address});
      return out;
    } catch (err) {
      throw err;
    }
  },

  deleteContact: async (data) => {
    try {
      await Session.api(config.api.deleteContact.name, data);
    } catch (err) {
      throw err;
    }
  },

  searchContacts: async (data) => {
    try {
      const out = await Session.api(config.api.searchContacts.name, data);
      return out;
    } catch (err) {
      throw err;
    }
  },

};

module.exports = Contacts;
