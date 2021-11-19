/* eslint-disable no-console */
const Fs = require('fs');
const axios = require('axios');
const { chain } = require('stream-chain');

const zlib = require('zlib');
const { getProgressBar, getWriteFork } = require('./resources.util');
const {
  url, metaUrl, zipPath, fileName,
} = require('./resources.constants');

/**
 * @typedef {import('stream-chain')} Chain
 */

/**
 * Gets the current latest version of MTG JSON
 * @returns {Promise<string>} latest json version
 */
async function getMtgJsonVersion() {
  try {
    // @ts-ignore
    const { data } = await axios(metaUrl);
    return data.date;
  } catch (error) {
    console.error('Could not fetch MTG JSON metadata');
    throw error;
  }
}

/**
 *  unzip json into two separate files, the metadata and the card data
 */
function unzipJson() {
  const fork = getWriteFork(fileName, ['meta', 'data']);
  console.info('Attempting to read zip');
  const pipeline = chain([
    Fs.createReadStream(zipPath),
    zlib.createGunzip(),
    fork,
  ]);
  // use the chain, and save the result to a file
  pipeline.on('error', (pipeError) => console.log(pipeError));
}

/**
 * Stream the GZIP file containing the MTG JSON of all sets
 * to file.
 * @async
 * @returns {Promise.<Boolean>} gzip stream of the MTG JSON
 */
async function downloadMtgJsonZip() {
  const writer = Fs.createWriteStream(zipPath);

  console.info('...connecting...');
  // @ts-ignore
  const { data, headers } = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {
    const timeout = 50000;
    const timer = setTimeout(() => {
      writer.close();
      reject(new Error(`Promise timed out after ${timeout} ms`));
    }, timeout);
    let error = null;
    const totalLength = headers['content-length'];
    const progressBar = getProgressBar(totalLength);
    console.info('...starting download...');
    // set up data and writer listeners
    data.on('data', (chunk) => progressBar.tick(chunk.length));
    writer.on('error', (err) => {
      error = err;
      writer.close();
      reject(error);
    });
    writer.on('close', () => {
      clearTimeout(timer);
      if (!error) {
        const now = new Date();
        console.info(
          // @ts-ignore start exists on the progress bar
          `Completed in ${(now.getTime() - progressBar.start) / 1000} seconds`,
        );
        resolve(true);
      }
      // no need to call the reject here, as it will have been called in the
      // 'error' stream;
    });
    // finally call data.pipe with our writer
    data.pipe(writer);
  });
}

// get json (wrapping above funcs)
async function getMtgJson() {
  // check version vs current json file
  const version = await getMtgJsonVersion();
  console.log(version);
  // maybe axios fetch new json.zip
  await downloadMtgJsonZip();
  // unzip the new json.zip
  unzipJson();
  // parse and return the json
}

module.exports = {
  downloadMtgJsonZip,
  URL: url,
  getMtgJsonVersion,
  getMtgJson,
  unzipJson,
};
