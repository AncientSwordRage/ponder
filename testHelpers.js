/* eslint-env jest */

/**
 * make the frst character uppercase
 * @param {string} word lowercase word
 * @returns capitalised word
 */
const capitalise = (word) => word.replace(/^(?<first>.)(?<rest>.+)/, (m, first, rest) => first.toUpperCase() + rest);

/**
 * Mocks each listed function in a module.
 * Needed if the actual module declares functions
 * as arrow function, jest won't mock those.
 * @param {Object[]} mockList array of functionNames to mock
 * @param {string} mockList[].func name of the function to mock
 * @param {jest.Mock} [mockList[].mock] optional jest mock
 * @param {Object.<string, function>} actualModule module to be mocked
 * @returns {Object.<string, function>} new Mock Proxy of `actualModule`
 *  with a custom get to return.
 */
function mockAll(mockList, actualModule, moduleName) {
  const mocks = mockList.reduce((memo, { func, mock = jest.fn() }) => {
    mock.mockName(`mock${capitalise(func)}`);
    console.log(mock.getMockName());
    return {
      ...memo,
      [func]: mock,
    };
  }, {});
  return new Proxy(actualModule, {
    get: (target, property) => {
      const mockedProperty = mocks[property];
      if (moduleName) console.log(mockedProperty ? `getting ${property} mocked as ${mockedProperty.getMockName()} of ${moduleName}` : `${property} is not mocked on ${moduleName}`);
      return (mockedProperty || target[property]);
    },
  });
}
module.exports = {
  mockAll,
};
