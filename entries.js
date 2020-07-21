// Specify that the cards must be an integer (TODO, see if binaries works)
const getInts = variablesEntries => Object.fromEntries(variablesEntries.map(([cardName,]) => [cardName, 1]));

//Use the variables entries, to get the categories. Specify we need to optimize them TO THE MAX
//NB. Only considers cartegories form the first row/variable
const getOptimize = variablesEntries => Object.fromEntries(Object.keys(variablesEntries[0][1]).map(categories => [categories, 'max']));

const getVariables = variablesEntries => Object.fromEntries(variablesEntries.map(([cardName, data]) =>
    [cardName, { ...data, [cardName]: 1, cards: 1 }])
);

module.exports = {
    getInts,
    getOptimize,
    getVariables
}