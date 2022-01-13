/* eslint-disable no-console */
/* eslint-env jest */
const fs = require('fs');
const { default: axios } = require('axios');
const { chain } = require('stream-chain');
const invariant = require('tiny-invariant');

const zlib = require('zlib');
const {
  getProgressBar, getWriteFork, getPathFor, stallGuard,
} = require('./resources.util');
const {
  url, metaUrl, zipPath, fileName,
} = require('./resources.constants');
const { combineErrorStack } = require('./helpers');
const parse = require('date-fns/parse');
const differenceInDays = require('date-fns/differenceInDays');

/**
 * @typedef {import('stream-chain')} Chain
 */
/**
 * @typedef {import('stream-fork')} Fork
 */

/**
 * Gets the current latest version of MTG JSON
 * @returns {Promise<string>} latest json version
 */
async function getMtgJsonVersion() {
  try {
    const response = await axios(metaUrl);
    const { data: { meta: { version } } } = response;
    return version;
  } catch (error) {
    console.error(`Could not fetch MTG JSON metadata: ${error}`);
    throw error;
  }
}

/**
 *  unzip json into two separate files, the metadata and the card data
 */
function unzipJson() {
  const timeout = 175 * 1000;
  const start = new Date()
  let error = null;
  console.info('Attempting to read zip');
  const readStream = fs.createReadStream(zipPath);
  readStream.on('open', () => console.log('Opened ZipReadStream'));
  function handleError(errorMessage, handleReject) {
    return (err) => {
      const localError = new Error(errorMessage);
      error = combineErrorStack(localError, err);
      handleReject(error);
    };
  }
  function handleClose(closeMessage, handleResolve) {
    return (errorClose) => {
      console.log(closeMessage);
      handleResolve(errorClose);
    };
  }
  return new Promise((resolve, reject) => {
    const onReject = (timer, msg) => {
      if (timer) clearTimeout(timer);
      return err => { if (msg) { console.log(msg); }; reject(err) }
    };
    const onResolve = (timer, msg = 'Resolved unzip') => {
      const end = new Date();
      if (timer) clearTimeout(timer);
      return err => {
        if (!err) {
          const duration = end.getTime() - start.getTime();
          console.log(msg + ' took ' + duration + ' seconds');
          resolve(true)
        }
      }
    };
    const writeFork = getWriteFork(fileName, ['meta', 'data']);
    const gunzipTransform = zlib.createGunzip();
    let zipCounter = 0
    gunzipTransform.on('data', stallGuard((chunk, windowAverage, stallCounter) => {
      zipCounter += 1;
      if ((zipCounter % 1e7) === 0) {
        console.log(`processing zip, chunk sample #${zipCounter}, of length: ${chunk.length} (average: ${windowAverage}) ${stallCounter || ''}`);
      }
    }));
    const pipeline = chain([
      gunzipTransform,
      writeFork,
    ]);

    // create the timer
    const timer = setTimeout(() => {
      error = new Error(`Promise timed out after ${timeout} ms`);
      try {
        const { input, output } = pipeline;
        pipeline.input.destroy();
        pipeline.output?.destroy();
        // @ts-ignore
        pipeline.output?.outputs?.forEach((outStream) => outStream.destroy())
      } catch (err) {
        error = combineErrorStack(err, error);
      }
      reject(error);
    }, timeout);

    //@ts-ignore
    pipeline?.output?.outputs?.forEach((stream) => {
      if (stream.output) {
        console.log(`puting watchers on write stream for path:\n\t ${stream.output.path}`);
        stream.output.on('error', onReject(timer, 'Write error on ' + stream.output.path));
        stream.output.on('finish', () => console.log('Write finished on ' + stream.output.path + ' wrote: ' + stream.output?.bytesWritten + ' bytes'));
        stream.output.on('close', () => console.log('File closed on ' + stream.output.path + ' wrote: ' + stream.output?.bytesWritten + ' bytes'));
        stream.output.on('open', () => console.log('Write opened on ' + stream.output.path));
      }
    });

    readStream.on('error', handleError('Error Reading Zip', onReject(timer, 'ZipError')));
    readStream.on('close', () => console.log('Closed Zip Stream'));
    // use the chain, and save the result to a file
    pipeline.on('error', handleError('Error with pipeline', onReject(timer)));
    pipeline.on('close', handleClose('Closed pipeline, pipeline outputs writable? \n' + pipeline.output.outputs.map(out => `${out?.path}: Writable ${out?.writableFinished}, Ended ${out.writableEnded}.\n`).join(' '), onResolve(timer)));
    console.log('about to pipe');
    return readStream.pipe(pipeline);
  });
}

/**
 * Stream the GZIP file containing the MTG JSON of all sets
 * to file.
 * @async
 * @returns {Promise.<Boolean>} gzip stream of the MTG JSON
 */
async function downloadMtgJsonZip() {
  const writer = fs.createWriteStream(zipPath);

  console.info('...connecting...');
  const { data, headers } = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  });
  return new Promise((resolve, reject) => {

    const timeout = 5 * 60 * 1000;
    const timer = setTimeout(() => {
      writer.close();
      reject(new Error(`Promise timed out after ${timeout} ms`));
    }, timeout);
    let error = null;
    const totalLength = headers['content-length'];
    const progressBar = getProgressBar(totalLength);
    console.info('...starting download...');
    // set up data and writer listeners
    data.on('data', stallGuard((chunk) => {
      progressBar.tick(chunk.length);
    }, { rejectMsg: 'Download Stalled' }));
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
/**
 * Check if data recent.
 * Will return false is no data found.
 * Will throw if any other error
 * If local data, then will attempt to fetch remote data.
 * @param {number} bestBeforeDays the maximum different in dates before
 *   local data is considered stale
 * @throws For any reason besides ENENT
 * @returns {Promise.<Boolean>} if the local data is out of date
 */
async function isLocalDataRecent(bestBeforeDays = 7) {
  const start = new Date();
  console.log('...check local version data...');
  const metaJsonFilePath = getPathFor(fileName, 'meta');
  let fileMetadata = '';
  let {
    localApiVersion, localDate, remoteVersion, remoteDate,
  } = /** @type {Object.<string, string>} */ (new Proxy({}, { get: () => null }));
  try {
    // assume metadata is already unzipped
    fileMetadata = fs.readFileSync(metaJsonFilePath, 'utf-8');
    console.log(fileMetadata);
    const { version } = /** @type {{version: string}} */ (JSON.parse(fileMetadata));
    // @ts-ignore
    invariant(typeof version === 'string', `Version not present in local data, instead found: ${fileMetadata}`);
    // @ts-ignore
    invariant(version.includes('+'), `Version not correctly formatted in local data, instead looks like: ${version}`);
    ([localApiVersion, localDate] = version.split('+'));
    console.log(localApiVersion, localDate);
  } catch (error) {
    let localError = error;
    if (fileMetadata.length === 0) {
      localError = combineErrorStack(new Error('Metadata file empty'), error);
      localError.code = 'ENOENT';
      console.error(localError);
    }
    // can only handle 'no file found' errors here.
    const end = new Date();
    console.log('Error or file missing: took ' + (end.getTime() - start.getTime()) + ' seconds');
    if (error.code !== 'ENOENT') throw localError;
    console.log(`no metadata file found: ${localError}`);
    return false;
  }
  if (localApiVersion) {
    console.log(`found local version ${localApiVersion}, about to attempt a fetch`);
    // TODO check if todays date
    try {
      console.log('pre fetch');
      const remoteApiVersion = await getMtgJsonVersion();
      ([remoteVersion, remoteDate] = remoteApiVersion.split('+'));
      console.log(`post fetch; retireved: ${remoteApiVersion}`);
      if (remoteVersion === localApiVersion) {
        const parsedRemoteDate = parse(remoteDate, 'yyyyMMdd', new Date());
        const parsedLocalDate = parse(localDate, 'yyyyMMdd', new Date());
        const daysDifference = differenceInDays(parsedRemoteDate, parsedLocalDate);
        console.log(`Local data is ${daysDifference} days behind`);

        const end = new Date();
        console.log('Fetch remote version: took ' + (end.getTime() - start.getTime()) + ' seconds');
        return daysDifference <= bestBeforeDays;
      }
    } catch (error) {
      const end = new Date();
      console.log('Fetching error: took ' + (end.getTime() - start.getTime()) + ' seconds');
      console.log(`some error: ${error}`);
      return false;
    }
  }
  const end = new Date();
  console.log('Local version blank: took ' + (end.getTime() - start.getTime()) + ' seconds');
  console.log('returning false');
  return false;
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
  isLocalDataRecent,
  getMtgJson,
  unzipJson,
};
