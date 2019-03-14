const mysql = require('mysql');

const config = require('../config.json');

const connection = mysql.createConnection({
  host: config.aws.mysql.host,
  user: config.aws.mysql.user,
  password: config.aws.mysql.password,
  database: config.aws.mysql.database,
  dateStrings: true,
});

const DB = {
  query: (query) => {
    return new Promise((resolve, reject) => {
      connection.query(query, (error, results) => {
        if (error) {
          console.log(error);
          reject('DB service is down');
        } else {
          resolve(results);
        }
      });
    });
  }
};

module.exports = DB;
