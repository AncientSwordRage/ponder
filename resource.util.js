const ProgressBar = require('progress');

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
};
