/* eslint-env jest */
const { getInts, getOptimize, getVariables } = require('./entries');

describe('entries.js', () => {
  const variablesEntries = [
    ['Foo', { some: 1, junk: 2 }],
    ['Bar', { more: 2, junk: 3 }],
  ];
  it('gets the integer object', () => {
    expect(getInts(variablesEntries)).toEqual(
      { Foo: 1, Bar: 1 },
    );
  });
  describe('optijmize object', () => {
    it('gets the optimize object, from the first variable', () => {
      expect(getOptimize(variablesEntries)).toEqual(expect.objectContaining(
        {
          some: 'max',
          junk: 'max',
        },
      ));
    });
    it('does not contain categories from the other entries', () => {
      expect(getOptimize(variablesEntries)).toEqual(expect.not.objectContaining(
        {
          more: 'max',
        },
      ));
    });
  });
  it('converts variablesEntries into variables', () => {
    expect(getVariables(variablesEntries)).toEqual(
      {
        Bar: {
          Bar: 1, cards: 1, junk: 3, more: 2,
        },
        Foo: {
          Foo: 1, cards: 1, junk: 2, some: 1,
        },
      },
    );
  });
});
