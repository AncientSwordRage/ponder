const Path = require('path');
const Fs = require('fs');
const ProgressBar = require('progress');
const Fork = require('stream-fork');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { stringer } = require('stream-json/Stringer');
const { pick } = require('stream-json/filters/Pick');
const { downloadsDir } = require('./resources.constants');

/**
 * @typedef {import('stream-chain')} Chain
 */

/**
 * removes the last extension token from a filename
 * @param {string} str file name with an extension
 * @returns {string} filename without the last extension token
 */
const removeExtension = (str) => str.substr(-str.length, str.lastIndexOf('.'));

/**
 * Helper function to determine the file path.
 * Hard codes where downloaded files are, not ideal.
 * TODO make this relative/take an optional param
 * @param {string} fileName the original gzip filename
 * @param {string} type the type of data to be written to file
 * @returns the string path
 */
const getPathFor = (fileName, type) => Path.resolve(
  __dirname,
  '..',
  downloadsDir,
  `${type}_${removeExtension(fileName)}`,
);

/**
 * Creates a Chain object that json parses, filters, stringifies and then writes to file
 * a parameterized type of data
 * @param {string} fileName name of the file to write
 * @param {string} type the type of data
 * @returns {Chain} the pipeline for that type of data
 */
const getWritePipelineFor = (fileName, type) => {
  const writePath = getPathFor(fileName, type);
  const writeStream = Fs.createWriteStream(writePath);
  return chain([
    parser(),
    pick({ filter: type }),
    stringer(),
    writeStream,
  ]);
};

/**
 * Creates multiple writing pipelines per file
 * @param {string} fileName name of file to write
 * @param {string[]} types types of file
 * @returns {Fork} multiple streams as a fork
 */
const getWriteFork = (fileName, types) => new Fork(
  types.map((type) => getWritePipelineFor(fileName, type)),
);

const progressTemplate = (type) => `-> ${type} [:bar] :percent :etas`;

/**
 * Returns a Progress Bar object, that is used to display download progress
 *
 * @param {string} totalLength
 *
 * @returns {ProgressBar} new ProgressBar object
 */
const getProgressBar = (
  totalLength, type = 'download',
) => new ProgressBar(progressTemplate(type), {
  width: 40,
  complete: '=',
  incomplete: ' ',
  renderThrottle: 1,
  total: parseInt(totalLength, 10),
});

/**
 * Function that wraps the on 'data' callback of a Stream, and monitors for 'stalling'.
 *
 * If the guard detects chunks under a certain threshold (hardcoded to be 20% below
 * standard deviation of the last `windowSize` chunks) `stallLimit` number of times, it
 * throws an exception.
 * @example
 *  data.on('data', stallGuard());
 *  data.on('data', stallGuard(chunk => printProgress(chunk.length)));
 *  data.on('data', stallGuard(chunk => printProgress(chunk.length), options));
 * @param {(...data)=>void} [successCb] callback run on successful chunk of data
 * @param {object} [options={}]
 * @param {string} [options.rejectMsg="Stalled"] content of the thrown Error
 * @param {number} [options.windowSize=10] number of samples to take
 *  when measuring standard deviation
 * @param {number} [options.stallLimit=5] number of stalls before throwing an error
 * @returns {(...data)=>void} function to be consumed by data stream listener
 */
const stallGuard = (successCb = () => { }, options = {}) => {
  const { rejectMsg = 'Stalled', windowSize = 10, stallLimit = Math.floor(windowSize / 2) } = options;
  let chunkCounter = 0;
  let stallCounter = 0;
  let windowAverage = 0;
  let windowStdDev;
  /** @type {number[]} */
  const chunkWindow = [];
  return (/** @type {any[]} */ dataChunk) => {
    const { length: chunkLength } = dataChunk;
    const acceptableMinimum = windowAverage - (windowStdDev * 1.2);
    const undersizeChunk = chunkLength && chunkLength < acceptableMinimum;
    if (chunkCounter > windowSize && undersizeChunk) {
      stallCounter += 1;
      // TODO - remove debugging statements when tests written
      console.log(`stall #${stallCounter} detected. chunk #${chunkCounter} size: ${chunkLength} is below: ${acceptableMinimum}`);
      console.log(`standard deviation is ${windowStdDev}`);
      console.log(JSON.stringify(chunkWindow));
      console.log('+++++');
      if (stallCounter > stallLimit) {
        throw new Error(rejectMsg);
      }
    } else if (stallCounter > 0) {
      console.log(`resetting stall counter of ${stallCounter}. chunk #${chunkCounter} size: ${chunkLength} is not below: ${acceptableMinimum}`);
      console.log(JSON.stringify(chunkWindow));
      console.log(`standard deviation is ${windowStdDev}`)
      stallCounter = 0;
    }
    chunkCounter += 1;
    const chunkIndex = chunkCounter % windowSize;
    chunkWindow.splice(chunkIndex, 1, chunkLength);
    windowAverage = chunkWindow.reduce((sum, chunk) => sum + chunk, 0) / windowSize;
    const windowVariance = chunkWindow.reduce(
      (sum, chunk) => sum + (windowAverage - chunk) ** 2,
      0,
    );
    windowStdDev = Math.sqrt((windowVariance) / (windowSize));
    successCb(dataChunk, windowAverage, stallCounter);
  };
};

module.exports = {
  getProgressBar,
  getPathFor,
  getWriteFork,
  removeExtension,
  stallGuard,
};
