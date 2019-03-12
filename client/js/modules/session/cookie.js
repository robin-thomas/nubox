const config = require('../../../../config.json');

const cookieName = config.app.name;
const cookieExpiry = config.cookie.expiry
const cookieTerminator = config.cookie.terminator;

const getExpiryString = () => {
  let date = new Date();
  date.setTime(date.getTime() + cookieExpiry);

  return `;expires=${date.toUTCString()}`;
}

const Cookie = {
  load: () => {
    const name = `${cookieName}=`;
    const cookieStr = document.cookie.split(';');

    for (let i = 0; i < cookieStr.length; ++i) {
      const str = cookieStr[i].trim();
      if (str.indexOf(name) === 0) {
        const cookieValue = str.substring(name.length).split(cookieTerminator);
        Session.address = cookieValue[0];
        Session.token = cookieValue[1];
        Session.expiresIn = cookieValue[2];
        Session.refreshToken = cookieValue[3];

        return {
          address: cookieValue[0],
          token: cookieValue[1],
          expiresIn: cookieValue[2],
          refreshToken: cookieValue[3],
        };
      }

      return null;
    }
  },

  update: (token, expiresIn, refreshToken) => {
    const expires = getExpiryString();

    const name = cookieName + '=';
    const cookieStr = document.cookie.split(';');
    for (let i = 0; i < cookieStr.length; ++i) {
      const str = cookieStr[i].trim();
      if (str.indexOf(name) === 0) {
        const cookie = `${address}${cookieTerminator}${token}${cookieTerminator}${expiresIn}${cookieTerminator}${refreshToken}`;
        document.cookie = `${cookieName}=${cookie}${expires};path=/`;
      }
    }
  },

  destroy: () => {
    document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC";`;
  },
};

module.exports = Cookie;
