const Wallet = require('../crypto/metamask.js');
const Session = require('../session/session.js');

const walletConnectDialog = $('#wallet-connect-dialog');
const walletAddreses = $('#eth-addresses');

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
    const isLoggedIn = Session.isLoggedIn();
    if (!isLoggedIn && !btn) {
      $('#cookie-login-loading').fadeOut();
      $('#header').fadeIn();
      $('#footer').fadeIn();
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
    const network = Wallet.getNetwork();
    const message = 'Signing this message proves to us you are in control of your account while never storing any sensitive account information.';

    try {
      if (isLoggedIn) {
        await Session.login(Wallet.address, message)

        if (isLoggedIn) {
          $('#cookie-login-loading').fadeIn();
        }

        WalletHandler.walletDisplayHandler();

        const addressDisplay = Wallet.address.substr(0, 5) + '...' + Wallet.address.substr(37);
        walletAddressDisplay.text(addressDisplay);
        walletConnectDialog.modal('hide');

        walletLoginButton.fadeOut();
        walletLogoutButton.css('display', 'flex').hide().fadeIn(500, () => {
          if (!isLoggedIn) {
            btn.html(btn.data('original-text'));
          }
        });

        if (isLoggedIn) {
          $('#cookie-login-loading').fadeOut();
          $('#header').fadeIn();
          $('#footer').fadeIn();
        }
      } else if (!isLoggedIn) {
        btn.html(btn.data('original-text'));
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

    Session.logout();
  }
};

module.exports = WalletHandler;
