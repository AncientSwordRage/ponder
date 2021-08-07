/* eslint-disable no-unused-vars */
const fs = require('fs');
const solver = require('./node_modules/javascript-lp-solver');
const CSVToJSON = require('./csvToJson');

const { getDeckSizeConstraints, getCardFormatConstraints } = require('./constraints');
const { getInts, getOptimize, getVariables } = require('./entries');
const { downloadMtgJsonZip } = require('./resources');

const deckSize = 100;
const landCount = 40;
const maxCardCount = 1;

/**
 * Create the variables as entries (list of tuples)
 * [
 *  [name, {data}],
 *  [name, {data}],
 * ]
 */
const getVariablesEntries = (jsonData) => jsonData.reduce((memo, curr) => {
  const { 'Card Name': name, ...data } = curr;
  if (name) {
    memo.push([name, data]);
  }
  return memo;
}, []);

const tacticConstraints = [
  ['Ramp', { min: 10 }],
  ['Board Wipe', { min: 10 }],
  // ['Discard synergy', { min: 10 }],
  // ['Zombie Synergy', { min: 10 }],
  // ['instants Synergy', { min: 5 }],
  // ['Return things to hand', { min: 15 }],
];
const deckSizeContraints = getDeckSizeConstraints(deckSize, landCount);

// Read in the sample data (card list with tactics)
const data = fs.readFileSync('sample_data.csv')
  .toString().trim();

const jsonData = CSVToJSON(data);

const variablesEntries = getVariablesEntries(jsonData);

const cardFormatConstraints = getCardFormatConstraints(variablesEntries, maxCardCount);

// Make contraints from the all our entries,
const constraints = Object.fromEntries([
  ...cardFormatConstraints,
  ...tacticConstraints,
  deckSizeContraints,
]);

const ints = getInts(variablesEntries);
const optimize = getOptimize(variablesEntries);

/**
 * Create the variables object, from entries.
 *
 * Each Card also gets a category for it's name (so we can enforce card number lmitis),
 * As well as this, we give each card a 'cards' category (so we can enforce deck size)
 * [
 *  [cardName, {
 *      cat1: score1,
 *      cat2: score2,
 *      ...
 *      cardName: 1,
 *      cards: 1
 *  }]
 * ]
 */
const variables = getVariables(variablesEntries);

// Combine all the objects, into our model
const model = {
  optimize,
  constraints,
  variables,
  ints,
  options: {
    // these options allow the procees to finish
    tolerance: 0.1,
    timeout: 100000,
  },
};

// Let the library solve the model
const results = solver.Solve(model);

// Vertices are the solutions to individual constraints
// Any card with a score of 0 is not included
// in the proposed deck
const filteredVerts = results.vertices.map((vertex) => Object.fromEntries(
  Object.entries(vertex)
    .filter(([dim, score]) => Boolean(score)),
));

// console.log(filteredVerts);

// Midpoint is the arithmetic mean of all individual solutions
// console.log(results.midpoint);

// Ranges show minium and maximum values
// across all of th vertices
// good as a diagnostic for which solutions
// don't include tactics, which can be fed back in
// to the tacticConstraints
// console.log(Object.fromEntries(
//     Object.entries(results.ranges)
//         .filter(([name, score]) => score.min >= 0)
//     )
// )

downloadMtgJsonZip();
