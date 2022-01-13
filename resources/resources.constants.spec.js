/* eslint-env jest */

const { zipPath } = require('./resources.constants');

describe('resources.constants', () => {
  describe('zipPath', () => {
    it('zipPath goes up out of it\'s route path', () => {
      expect(zipPath).not.toEqual(expect.stringContaining('resources'));
    });
  });
});
