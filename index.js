const solver = require("./node_modules/javascript-lp-solver");
const CSVToJSON = require("./csvToJson");
const fs = require("fs");

const landCount = 40;
const maxCardCount = 1;

const tacticConstraints = [
    ['Ramp', { min: 10 }],
    ['Board Wipe', { min: 10 }],
    // ['Discard synergy', { min: 10 }],
    // ['Zombie Synergy', { min: 10 }],
    // ['instants Synergy', { min: 5 }],
    // ['Return things to hand', { min: 15 }],
];
const deckSizeContraints = ['cards', { equal: 100 - landCount }]

// Read in the sample data (card list with tactics)
var data = fs.readFileSync('sample_data.csv')
    .toString().trim();
/**
 * Create the variables as entries (list of tuples)
 * [
 *  [name, {data}],
 *  [name, {data}],
 * ]
 */
const variablesEntries = CSVToJSON(data).reduce((memo, curr, index) => {
    const { "Card Name": name, ...data } = curr;
    if (name) {
        memo.push([name, data]);
    }
    return memo;
}, [])

/**
 * Create the base constraints on the cards, i.e. singleton or otherwise
 * [
 *  [cardName, { max: 1 }],
 *  [cardName, { max: 1 }]
 * ]
 * 
 */
const cardFormatConstraints = variablesEntries.filter(([cardName,]) => Boolean(cardName))
    .map(([cardName,]) => [cardName, { max: maxCardCount }]);

//Make contraints from the all our entries, 
const constraints = Object.fromEntries([
    ...cardFormatConstraints,
    ...tacticConstraints,
    deckSizeContraints
]);

// Specify that the cards must be an integer (TODO, see if binaries works)
const ints = Object.fromEntries(variablesEntries.map(([cardName,]) => [cardName, 1]));

//Use the variables entries, to get the categories. Specify we need to optimize them TO THE MAX
const optimizeEntries = Object.keys(variablesEntries[0][1]).map(categories => [categories, 'max'])
const optimize = Object.fromEntries(optimizeEntries);

/**
 * Create the variables object, form entries. 
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
const variables = Object.fromEntries(variablesEntries.map(([cardName, data]) =>
    [cardName, { ...data, [cardName]: 1, cards: 1 }])
);


// Combine all the objects, into our model
const model = {
    optimize,
    constraints,
    variables,
    ints,
    options: {
        // these options allow the procees to finish
        tolerance: 0.001,
        timeout: 100000
    }
};

// Let the library the model
results = solver.Solve(model);

// Vertices are the solutions to individual constraints
// Any card with a score of 0 is not included 
// in the proposed deck
const filteredVerts = results.vertices.map(vertex =>
    Object.fromEntries(
        Object.entries(vertex)
            .filter(([dim, score]) =>
                Boolean(score)
            )
    )
);

console.log(filteredVerts);

// Midpoint is the arithmetic mean of all individual solutions
console.log(results.midpoint);

// Ranges show minium and maximum values
// across all of th vertices
// good as a diagnostic for which solutions
// don't include tactics, which can be fed back in
// to the tacticConstraints
console.log(Object.fromEntries(
    Object.entries(results.ranges)
        .filter(([name, score]) => score.min >= 0)
)
)