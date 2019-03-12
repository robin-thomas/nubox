const express = require('express');
const cors = require('cors');
const _ = require('lodash');

const config = require('./config.json');
const Auth = require('./server/auth.js');
const Contacts = require('./server/contacts.js');

const app = express();
const port = !_.isUndefined(process.env.PORT) ? process.env.PORT : 4000;

app.use(cors());
app.use(express.json());
app.options('*', cors());
app.use(express.static(__dirname + '/client'));

app.post(config.api.login.path, Auth.login);
app.post(config.api.refresh.path, Auth.refresh);

app.post(config.api.addContact.path, Auth.validate, async (req, res) => {
  const contactAddress = req.body.contact_address;
  const contactNickname = req.body.contact_nickname;
  const address = req.body.address;

  // Add the new contact to DB.
  try {
    const id = await Contacts.add(address, contactAddress, contactNickname);

    res.status(200).send({
      status: 'ok',
      msg: id
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.get(config.api.getAllContacts.path, Auth.validate, async (req, res) => {
  const address = req.query.address;

  try {
    const contacts = await Contacts.getAll(address);

    res.status(200).send({
      status: 'ok',
      msg: contacts
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.get(config.api.searchContacts.path, Auth.validate, async (req, res) => {
  const address = req.query.address;
  const contactAddress = req.query.contactAddress;
  const contactName = req.query.contactName;

  try {
    const contacts = await Contacts.search(address, contactAddress, contactName);

    res.status(200).send({
      status: 'ok',
      msg: contacts
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.delete(config.api.deleteContact.path, Auth.validate, async (req, res) => {
  const address = req.body.address;
  const contactAddress = req.body.contactAddress;

  try {
    await Contacts.delete(address, contactAddress);

    res.status(200).send({
      status: 'ok',
      msg: null
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.listen(port, () => console.log(`app listening on ${port}`));