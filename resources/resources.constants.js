const Path = require('path');

const fileName = 'AllPrintings.json.gz';
const baseApiUrl = 'https://mtgjson.com/api';
const version = 'v5';
const url = `${baseApiUrl}/${version}/${fileName}`;
const metaUrl = `${baseApiUrl}/${version}/Meta.json`;
const downloadsDir = 'downloads';

/**
 * @constant
 * @type {string}
 */
const zipPath = Path.resolve(__dirname, '..', downloadsDir, fileName);

module.exports = {
  fileName,
  downloadsDir,
  url,
  metaUrl,
  zipPath,
};
