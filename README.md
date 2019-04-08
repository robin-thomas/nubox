# nuBox - Decentralized encrypted Dropbox
![](http://i67.tinypic.com/34ooa6h_th.png)

![](https://img.shields.io/badge/nodejs-8.10-blue.svg) ![](https://img.shields.io/badge/nuBox-1.0-yellowgreen.svg) [![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)

# Table of Contents
1. [What is nuBox?](#what-is-nubox)
2. [Requirements](#requirements)
3. [Features](#features)

# What is nuBox?
Nubox is a blockchain-based file storage solution built on top of **[NuCypher](https://www.nucypher.com/)** (using [nuBox chrome extension](https://github.com/robin-thomas/nubox-ext)) and **[IPFS](https://ipfs.io/)**. You can upload and download files of any size, create folders, delete and rename files and folders, drag and drop files around, share files with anyone - *totally feel like using a filesystem*!

# Requirements:
* Chromium based browser (Chrome or Brave)
* [nuBox chrome extension](https://github.com/robin-thomas/nubox-ext)
* [Metamask](https://metamask.io/)

# Features:
* **Password-less login** - (login with your Metamask account).
    * nuBox browser-side library uses Metamask to create a digital signature, that's sent to the nuBox server for verification.
    * Once verified, it replies back with a [JWT](https://jwt.io/) that's valid for 1 hour.
    * But it also provides a *refresh token* that the browser can send to the server to create another JWT, when it expired.
    * All the above operations are transparent to the user (except the Metamask popup to create the signature).
* **Unlimited file size** -
    * nuBox supports files of any size.
    * All files are broken into chunks of 256KB, encrypted using NuCypher and then uploaded to [IPFS](https://ipfs.io/).
* **Unique shareable link per file** - 
    * Each file gets a unique link that can be shared with anyone.
    * Whenever anyone tries to access the link, the IPFS hashes where the file is stored is encoded in the HTTP response headers (Chrome has serious limitations in the context of chrome extensions. Hence response headers and not response body).
    * nuBox chrome extension will be listening for the response headers. Once the headers are decoded, it opens up a stream to start saving the file, download encrypted data from IPFS one by one, decrypt it through NuCypher (decrypt will fail, if the person who is downloading hasn't been granted access), and send it to the stream! Voila!
    * Streams are helpful while downloading files of huge sizes. Rather than keeping the whole file in the memory (all decrypted chunks joined to make the complete file), we just have to keep one chunk (256KB) of the file in the memory at a time!
    * *All the above operations are completely transparent to the user. They are not even aware of the complexity behind everything happening!*
* **Share file with anyone (or revoke access)**
    * You can share a file with any contact for a specified duration of time.
    * You can delete a shared file, yet the file will be accessible for anyone previously shared with (unless their access is revoked later).
    * Individually revoke access for any contact.
    * You only encrypt the file data once, but it can be shared with anyone in the future without any hassle!
* **File Upload**
    * nuBox allows you to choose multiple files to upload at any time.
    * All files to be uploaded are dumped onto a job queue.
    * Currently the job queue is set to process one file at a time (rest of the jobs will be queued).
    * File uploads can be paused and resumed.
    * The UI shows the file upload progress as well as the total progress of the all the uploads.
    * It shows file size in human readable form, as well as the total size of all the uploads.

* **File/Folder operations**
    * *File operations:*
        * Upload, rename, delete, and/or download a file
        * Drag files into different folders (move files)
        * Share a file with one or more contacts
        * See the contacts with whom the file has been shared with
        * Revoke access to a file for one or more contacts *(latest NuCypher release do not support individual `revoke` operation, but rather revoking everyone who has been granted access. But nuBox supports this, after modifying NuCypher code)*
        * View file metadata
    * *Folder operations:*
        * Create, rename, and/or delete a folder
        * Accept any dropped files
        * View folder metadata

* **Clean Materialistic UI**
    * *UI inspired by Google Drive* - get the feeling of using Google Drive, but hey, you control the files!
    * *Right-clicking* on any file or folder will open up the options for the various file (or folder) operations.
    * View all files that are shared for you
    * View the total size of the files upload
    * View various activity in your account (Uploading, renaming, deleting, moving and sharing files and folders)

![](https://user-images.githubusercontent.com/2564234/49080419-dda35680-f243-11e8-90d7-6f649d80e03d.png)

# Known issues:
* **NuCypher** - You cannot download same file twice: https://github.com/nucypher/nucypher/issues/833
* **Infura IPFS** - it might throw 504 or gateway errors while trying to upload or download a file. Certain times, it'll be quite slow.
* The demo is hosted on free Heroku server, [which goes to sleep regularly](https://blog.heroku.com/app_sleeping_on_heroku). So it can be a bit slow to download all the frontend files initially.


**Free Software, Hell Yeah!**
