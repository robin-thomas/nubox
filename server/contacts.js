const DB = require('./db.js');
const ContactValidation = require('../client/js/modules/contacts.js');

const Contacts = {
  add: async (address, contactAddress, contactNickname) => {
    // Validate the input.
    try {
      ContactValidation.validateContactFields(contactAddress, contactNickname);
    } catch (err) {
      throw err;
    }

    const query = {
      sql: 'INSERT INTO contacts(address, contact_address, contact_nickname) \
            VALUES(?, ?, ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress, contactNickname ],
    };

    try {
      const out = await DB.query(query);
      return out.insertId;
    } catch (err) {
      throw err;
    }
  },

  getAll: async (address) => {
    const query = {
      sql: 'SELECT contact_address as address, contact_nickname as nickname \
            FROM contacts WHERE address = ?',
      timeout: 6 * 1000, // 6s
      values: [ address ],
    };

    try {
      const results = await DB.query(query);
      return results;
    } catch (err) {
      throw err;
    }
  },

  search: async (address, contactAddress, contactName) => {
    const query = {
      sql: 'SELECT contact_address as address, contact_nickname as nickname \
            FROM contacts WHERE address = ? AND \
            (contact_address = ? OR contact_nickname = ?)',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress, contactName ],
    };

    try {
      const results = await DB.query(query);
      return results;
    } catch (err) {
      throw err;
    }
  },

  delete: async (address, contactAddress) => {
    const query = {
      sql: 'DELETE FROM contacts WHERE address = ? AND contact_address = ?',
      timeout: 6 * 1000, // 6s
      values: [ address, contactAddress ],
    };

    try {
      await DB.query(query);
    } catch (err) {
      throw err;
    }
  },
};

module.exports = Contacts;
