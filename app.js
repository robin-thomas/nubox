const express = require('express');
const cors = require('cors');
const _ = require('lodash');

const config = require('./config.json');
const Auth = require('./server/auth.js');

const app = express();
const port = !_.isUndefined(process.env.PORT) ? process.env.PORT : 4000;

app.use(cors());
app.use(express.json());
app.options('*', cors());
app.use(express.static(__dirname + '/client'));

app.post(config.api.login.path, Auth.login);
app.post(config.api.refresh.path, Auth.refresh);

app.listen(port, () => console.log(`app listening on ${port}`));
