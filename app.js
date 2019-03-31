const express = require('express');
const cors = require('cors');
const _ = require('lodash');

const config = require('./config.json');
const Auth = require('./server/auth.js');
const Contacts = require('./server/contacts.js');
const FS = require('./server/fs.js');
const Activity = require('./server/activity.js');
const Shares = require('./server/shares.js');

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
  const contactEncryptingKey = req.body.contact_encrypting_key;
  const contactVerifyingKey = req.body.contact_verifying_key;

  // Add the new contact to DB.
  try {
    const id = await Contacts.add(address, contactAddress, contactNickname,
                                  contactEncryptingKey, contactVerifyingKey);

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

app.get(config.api.getFsStructure.path, Auth.validate, async (req, res) => {
  const address = req.query.address;

  try {
    const structure = await FS.getFsStructure(address);

    res.status(200).send({
      status: 'ok',
      msg: structure
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.delete(config.api.deleteFile.path, Auth.validate, async (req, res) => {
  const address = req.body.address;
  const path = req.body.path;

  try {
    await FS.deleteFile(address, path);

    res.status(200).send({
      status: 'ok',
      msg: ''
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.post(config.api.renameFile.path, Auth.validate, async (req, res) => {
  const address = req.body.address;
  const path = req.body.path;
  const newPath = req.body.newPath;

  try {
    const out = await FS.renameFile(address, path, newPath);

    res.status(200).send({
      status: 'ok',
      msg: out
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.post(config.api.createFiles.path, Auth.validate, async (req, res) => {
  const address = req.body.address;
  const updates = req.body.updates;

  try {
    const out = await FS.createFiles(address, updates);

    res.status(200).send({
      status: 'ok',
      msg: out
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.post(config.api.createFolder.path, Auth.validate, async (req, res) => {
  const address = req.body.address;
  const path = req.body.path;

  try {
    const out = await FS.createFolder(address, path);

    res.status(200).send({
      status: 'ok',
      msg: out,
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.get(config.api.getActivity.path, Auth.validate, async (req, res) => {
  const address = req.query.address;
  const timezone = Buffer.from(req.query.timezone, 'base64').toString();

  try {
    const activity = await Activity.getActivity(address, timezone);

    res.status(200).send({
      status: 'ok',
      msg: activity,
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.post(config.api.shareFile.path, Auth.validate, async (req, res) => {
  const sharer = req.body.address;
  const sharedWith = req.body.sharedWith;
  const fileId = req.body.fileId;

  try {
    await Shares.shareFile(sharer, sharedWith, fileId);

    res.status(200).send({
      status: 'ok',
      msg: '',
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.get(config.api.getShares.path, Auth.validate, async (req, res) => {
  const address = req.query.address;

  try {
    const files = await Shares.getShares(address);

    res.status(200).send({
      status: 'ok',
      msg: files,
    });
  } catch (err) {
    res.status(500).send({
      status: 'not ok',
      msg: err.message
    });
  }
});

app.listen(port, () => console.log(`app listening on ${port}`));
