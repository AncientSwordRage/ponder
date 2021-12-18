const Path = require('path');
const Fs = require('fs');
const ProgressBar = require('progress');
const Fork = require('stream-fork');
const { chain } = require('stream-chain');
const { parser } = require('stream-json');
const { stringer } = require('stream-json/Stringer');
const { pick } = require('stream-json/filters/Pick');

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
 * Helper function to determine the file path
 *  @param {string} fileName the original gzip filename
   * @param {string} type the type of data to be written to file
   * @returns the string path
   */
const getPathFor = (fileName, type) => Path.resolve(
  __dirname,
  'resources',
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
  return chain([
    parser(),
    pick({ filter: type }),
    stringer(),
    Fs.createWriteStream(writePath),
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

const progressTemplate = '-> downloading [:bar] :percent :etas';

/**
 * Returns a Progress Bar object, that is used to display download progress
 *
 * @param {string} totalLength
 *
 * @returns {ProgressBar} new ProgressBar object
 */
const getProgressBar = (
  totalLength,
) => new ProgressBar(progressTemplate, {
  width: 40,
  complete: '=',
  incomplete: ' ',
  renderThrottle: 1,
  total: parseInt(totalLength, 10),
});

module.exports = {
  getProgressBar,
  getPathFor,
  getWriteFork,
  removeExtension,
};
