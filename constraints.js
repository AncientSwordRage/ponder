/**
 * Create the constraints based on decksize, accouting for number of lands
 * @param {number} deckSize
 * @param {number} landCount
 */

const getDeckSizeConstraints = (deckSize, landCount) => ['cards', { equal: deckSize - landCount }];

/**
 * Create the base constraints on the cards, i.e. singleton or otherwise
 *
 * Input: [['foo', {'some':'junk'}]], 13
 *
 * Output:
 * [
 *  [cardName, { max: 1 }],
 *  [cardName, { max: 1 }]
 * ]
 *
 * @param {array} variablesEntries
 * @param {number} maxCardCount
 */
const getCardFormatConstraints = (
  variablesEntries, maxCardCount,
) => variablesEntries.filter(([cardName]) => Boolean(cardName))
  .map(([cardName]) => [cardName, { max: maxCardCount }]);

module.exports = {
  getDeckSizeConstraints,
  getCardFormatConstraints,
};
