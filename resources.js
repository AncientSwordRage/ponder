/* eslint-disable no-console */
const Fs = require('fs');
const Path = require('path');
const axios = require('axios');
const { getProgressBar } = require('./resource.util');

const url = 'https://mtgjson.com/api/v5/AllPrintings.json.zip';
const metaUrl = 'https://mtgjson.com/api/v5/Meta.json';

async function getMtgJsonVersion() {
  return axios(metaUrl).data.date;
}

// get json (wrapping below funcs)
function getMtgJson() {
  // check version vs current json file
  // maybe axios fetch new json.zip
  // unzip the new json.zip
  // parse and return the json
}

// unzip json
function unzipJson() { }

// separate download, check version and unziping
async function downloadMtgJsonZip() {
  const path = Path.resolve(__dirname, 'resources', 'AllPrintings.json.zip');
  const writer = Fs.createWriteStream(path);

  console.info('...connecting...');
  const { data, headers } = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  const totalLength = headers['content-length'];
  const progressBar = getProgressBar(totalLength);
  const timer = setInterval(() => {
    if (progressBar.complete) {
      const now = new Date();
      console.info(`Completed in ${(now.getTime() - progressBar.start) / 1000} seconds`);
      clearInterval(timer);
    }
  }, 100);
  console.info('...starting download...');
  data.on('data', (chunk) => progressBar.tick(chunk.length));
  data.pipe(writer);
}

module.exports = {
  downloadMtgJsonZip,
  URL: url,
  getMtgJsonVersion,
  getMtgJson,
  unzipJson,
};
