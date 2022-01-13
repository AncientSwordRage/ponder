/**
 * Appends the previous error stack trace to the newer one.
 * Doing it this way around preserves various properties on
 *   the newer error, like `code`, whichis important for
 *   various node js errors
 * @param {Error} prevErr the originating error
 * @param {Error} err the newer error
 * @returns {Error}
 */
const combineErrorStack = (prevErr, err) => {
  const { stack } = prevErr;
  const newStack = `${err.stack}\n From previous ${stack.split('\n').slice(0, 2).join('\n')}\n`;
  Object.assign(err, { stack: newStack });
  return err;
};

module.exports = { combineErrorStack };
