const Wallet = require('../crypto/metamask.js');
const Session = require('../session/session.js');
const ContactsHandler = require('./contacts.js');
const ActivityHandler = require('./activity.js');
const Contacts = require('../contacts.js');
const FSHandler = require('./fs.js');

const walletConnectDialog = $('#wallet-connect-dialog');

const contactsBeforeConnect = $('#contacts-before-connect'),
      contactsConnect       = $('#contacts-connect'),
      contactsAfterConnect  = $('#contacts-after-connect'),
      walletAddreses        = $('#eth-addresses'),
      walletLoginButton     = $('#wallet-login-button'),
      walletLogoutButton    = $('#wallet-logout-button'),
      walletAddressDisplay  = walletLogoutButton.find('.wallet-label-bottom');

const WalletHandler = {
  walletConnectHandler: async (e) => {
    try {
      const addrs = await WalletHandler.walletButtonClick(e);
      let select = '';
      for (const addr of addrs) {
        select += '<option value="' + addr + '">' + addr + '</option>';
      }
      walletAddreses.html(select);

      walletConnectDialog.modal('show');
    } catch (err) {
      alert(err.message);
    }
  },

  walletButtonClick: async (e) => {
    e.preventDefault();

    if (Wallet.hasMetamask()) {
      try {
        return await Wallet.loadWeb3();
      } catch (err) {
        throw err;
      }
    } else {
      throw new Error('No Metamask detected in the browser!');
    }
  },

  walletConnectConfirmHandler: async (btn) => {
    // Check whether a valid user session already exists.
    const isLoggedIn = Session.isLoggedIn();

    // If user isnt logged in, show the home page.
    if (!isLoggedIn && !btn) {
      $('#cookie-login-loading').fadeOut();
      $('#header').fadeIn();

      ContactsHandler.createContactsBeforeConnect();
      return;
    }

    if (!isLoggedIn) {
      const loadingText = '<i class="fas fa-spinner fa-spin"></i>&nbsp;Confirming...';
      btn.data('original-text', btn.html());
      btn.html(loadingText);
    } else {
      await Wallet.loadWeb3();
    }

    Wallet.address = isLoggedIn ? Session.address : walletAddreses.val();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    try {
      // Try logging in if the user isnt logged in.
      if (!isLoggedIn) {
        await Session.login(Wallet.address, message);
      } else {
        $('#cookie-login-loading').fadeIn();
      }

      await FSHandler.drawFS(Wallet.address);

      ContactsHandler.contactsList = await Contacts.loadContacts(Wallet.address);
      ContactsHandler.contactsDisplayHandler();
      ActivityHandler.load(Wallet.address);

      const addressDisplay = Wallet.address.substr(0, 5) + '...' + Wallet.address.substr(37);
      walletAddressDisplay.text(addressDisplay);
      walletConnectDialog.modal('hide');

      walletLoginButton.fadeOut();
      walletLogoutButton.css('display', 'flex').hide().fadeIn(500, () => {
        if (!isLoggedIn) {
          btn.html(btn.data('original-text'));
        }
      });

      contactsBeforeConnect.fadeOut();
      contactsConnect.fadeOut();
      contactsAfterConnect.fadeIn();
      $('#content').fadeIn();

      if (isLoggedIn) {
        $('#cookie-login-loading').fadeOut();
        $('#header').fadeIn();
      }
    } catch (err) {
      if (!isLoggedIn) {
        btn.html(btn.data('original-text'));
      }

      if (err.message === 'unable to verify the refresh token') {
        WalletHandler.logout();
        return;
      }

      console.log(err);
      alert(err.message);
    }
  },

  walletLogoutHandler: () => {
    if (confirm("Are you sure you want to logout?")) {
      WalletHandler.logout();
    }
  },

  logout: () => {
    walletLogoutButton.fadeOut();
    walletLoginButton.css('display', 'flex').hide().fadeIn();

    contactsAfterConnect.fadeOut();
    contactsConnect.fadeIn();
    contactsBeforeConnect.fadeIn();

    $('#content').fadeOut();

    Session.logout();
  }
};

module.exports = WalletHandler;
