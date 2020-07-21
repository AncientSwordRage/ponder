const {
    getDeckSizeConstraints, getCardFormatConstraints
} = require('./constraints.js');
describe('constraints.js', () => {
    it('Factors in deck size and land count', () => {
        const [deckSize, landCount] = [10, 5];
        expect(getDeckSizeConstraints(deckSize, landCount)).toEqual(['cards', { 'equal': 5 }])
    })
    it('Factors in maximum number of the samre card', () => {
        const [variablesEntries, maxCardCount] = [
            [['Foo', { 'some': 'junk' }], ['Bar', { 'other': 'junk' }]],
            13
        ]
        const cardFormatConstraints = getCardFormatConstraints(variablesEntries, maxCardCount);
        expect(cardFormatConstraints).toEqual([
            ['Foo', { 'max': 13 }],
            ['Bar', { 'max': 13 }]
        ])
    })
})