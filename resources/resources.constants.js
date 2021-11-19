const Path = require('path');

const fileName = 'AllPrintings.json.gz';
const url = `https://mtgjson.com/api/v5/${fileName}`;
const metaUrl = 'https://mtgjson.com/api/v5/Meta.json';

/**
 * @constant
 * @type {string}
 */
const zipPath = Path.resolve(__dirname, 'resources', fileName);

module.exports = {
  fileName,
  url,
  metaUrl,
  zipPath,
};
