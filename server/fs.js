const Path = require('path');

const DB = require('./db.js');
const Activity = require('./activity.js');
const Shares = require('./shares.js');

const FS = {
  getFsStructure: async (address) => {
    try {
      let results = {};

      const out = await DB.query({
        sql: 'SELECT *, \
              CONVERT_TZ(created, @@session.time_zone, "+00:00") AS created_utc, \
              CONVERT_TZ(modified, @@session.time_zone, "+00:00") AS modified_utc \
              FROM fs WHERE address = ?',
        timeout: 6 * 1000, // 6s
        values: [ address ],
      });

      for (const result of out) {
        if (!result.deleted) {
          results[result.path] = {
            id: result.id,
            path: result.path,
            ipfs: JSON.parse(result.ipfs_hash).hash,
            isFile: result.is_file,
            created: result.created_utc,
            modified: result.modified_utc,
            fileSize: result.file_size,
            fileType: result.file_type,
          };
        }
      }

      return results;
    } catch (err) {
      throw err;
    }
  },

  getFile: async (address, path) => {
    try {
      const result = await DB.query({
        sql: 'SELECT *, \
              CONVERT_TZ(created, @@session.time_zone, "+00:00") AS created_utc, \
              CONVERT_TZ(modified, @@session.time_zone, "+00:00") AS modified_utc \
              FROM fs WHERE address = ? AND path = ?',
        timeout: 6 * 1000, // 6s
        values: [ address, path ],
      });

      if (result.length === 0 || result[0].deleted) {
        throw new Error('Unable to find the record');
      }

      return {
        id: result[0].id,
        path: result[0].path,
        ipfs: JSON.parse(result[0].ipfs_hash).hash,
        isFile: result[0].is_file,
        created: result[0].created_utc,
        modified: result[0].modified_utc,
        fileSize: result[0].file_size,
        fileType: result[0].file_type,
      };
    } catch (err) {
      throw err;
    }
  },

  deleteFile: async (address, path) => {
    try {
      const record = await FS.getFile(address, path);

      // Check whether the file is shared or not.
      const isShared = await Shares.isFileShared(address, record.id);

      if (!isShared) {
        await DB.query({
          sql: 'DELETE FROM fs WHERE address = ? AND path = ?',
          timeout: 6 * 1000, // 6s
          values: [ address, path ],
        });
      } else {
        await DB.query({
          sql: 'UPDATE fs SET deleted = true WHERE id = ?',
          timeout: 6 * 1000, // 6s
          values: [ record.id ],
        });
      }

      await Activity.addActivity(address, [{
        path: path,
        file: record.isFile,
        action: 'DELETE',
      }]);

      if (!record.isFile) {
        await FS.deleteFileForDescendants(address, path);
      }
    } catch (err) {
      throw err;
    }
  },

  deleteFileForDescendants: async (address, path) => {
    try {
      const records = await DB.query({
        sql: 'SELECT * FROM fs WHERE path LIKE ? AND address = ?',
        timeout: 6 * 1000, // 6s
        values: [ `${path}/%`, address ],
      });

      for (const record of records) {
        await DB.query({
          sql: 'DELETE FROM fs WHERE id = ?',
          timeout: 6 * 1000, // 6s
          values: [ record.id ],
        });
      }
    } catch (err) {
      throw err;
    }
  },

  renameFile: async (address, path, newPath) => {
    try {
      await DB.query({
        sql: 'UPDATE fs SET path = ? WHERE address = ? AND path = ?',
        timeout: 6 * 1000, // 6s
        values: [ newPath, address, path ],
      });

      const result = await FS.getFile(address, newPath);
      if (!result.isFile) {
        await FS.renameFileForDescendants(address, path, newPath);
      }

      // Move or rename operation.
      await Activity.addActivity(address, [{
        path: path,
        file: result.isFile,
        action: Path.basename(path) === Path.basename(newPath) ? 'MOVE' : 'RENAME',
      }]);

      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  },

  getIPFSByFileHash: async (hash) => {
    try {
      let ipfs = await DB.query({
        sql: 'SELECT path, ipfs_hash FROM fs WHERE id = ?',
        timeout: 6 * 1000, // 6s
        values: [ hash ],
      });

      if (ipfs === undefined || ipfs.length === 0) {
        throw new Error('Not Found');
      }

      return {
        path: ipfs[0].path,
        filename: Path.basename(ipfs[0].path),
        ipfs: JSON.parse(ipfs[0].ipfs_hash).hash,
      };

    } catch (err) {
      throw err;
    }
  },

  renameFileForDescendants: async (address, path, newPath) => {
    try {
      const records = await DB.query({
        sql: 'SELECT * FROM fs WHERE path LIKE ? AND address = ?',
        timeout: 6 * 1000, // 6s
        values: [ `${path}/%`, address ],
      });

      for (const record of records) {
        const newChildPath = newPath + record.path.substr(path.length);

        await DB.query({
          sql: 'UPDATE fs SET path = ? WHERE id = ?',
          timeout: 6 * 1000, // 6s
          values: [ newChildPath, record.id ],
        });
      }
    } catch (err) {
      throw err;
    }
  },

  createFiles: async (address, updates) => {
    try {
      let files = [];

      for (const file of updates) {
        const ipfs = JSON.stringify({
          hash: file.ipfs,
        });

        await DB.query({
          sql: 'INSERT INTO fs(address, path, ipfs_hash, file_size, file_type) \
                VALUES(?, ?, ?, ?, ?)',
          timeout: 6 * 1000, // 6s
          values: [ address, file.path, ipfs, file.fileSize, file.fileType ],
        });

        await Activity.addActivity(address, [{
          path: file.path,
          file: 1,
          action: 'CREATE',
        }]);

        files.push(await FS.getFile(address, file.path));
      }

      return files;
    } catch (err) {
      throw err;
    }
  },

  createFolder: async (address, path) => {
    try {
      await DB.query({
        sql: 'INSERT INTO fs(address, path, ipfs_hash, is_file) \
              VALUES(?, ?, ?, ?)',
        timeout: 6 * 1000, // 6s
        values: [ address, path, '{"hash":[]}', false ],
      });

      await Activity.addActivity(address, [{
        path: path,
        file: 0,
        action: 'CREATE',
      }]);

      return await FS.getFile(address, path);

    } catch (err) {
      throw err;
    }
  },
};

module.exports = FS;
