/* eslint-env jest */
const { default: axios } = require('axios');
const fs = require('fs');
const ProgressBar = require('progress');

const { downloadMtgJsonZip, isLocalDataRecent } = require('./resources');

jest.mock('fs', () => {
  const { mockAll } = jest.requireActual('../testHelpers');
  const readFileSyncFixture = {
    missing: 'ENOENT',
    malformed: 'BANG',
    meta: { data: { meta: { version: 'version' } } },
  };
  const mockFs = {
    readFileSync: jest.fn((path) => {
      console.log('call ', path, readFileSyncFixture);
      const code = readFileSyncFixture[path];
      console.log(code, path);
      // eslint-disable-next-line prefer-promise-reject-errors
      if (typeof code === 'string') throw new Error(code);
      else if (code) return code;
      else throw new Error(`path '${path}' not found in fixture keys ${Object.keys(readFileSyncFixture)}`);
    }),
  };
  const actualModule = jest.requireActual('fs');
  return mockAll([{ func: 'readFileSync', mock: mockFs.readFileSync }], actualModule, 'fs');
});
jest.mock('./resources.util', () => {
  const { mockAll } = jest.requireActual('../testHelpers');
  const actualModule = jest.requireActual('./resources.util');
  return mockAll([{ func: 'getPathFor' }], actualModule);
});
jest.mock('./resources', () => {
  const { mockAll } = jest.requireActual('../testHelpers');
  const actualModule = jest.requireActual('./resources');
  return mockAll([{ func: 'getMtgJsonVersion' }], actualModule);
});
jest.mock('axios');
jest.mock('progress');

describe.skip('resources.js', () => {
  let pipeHandler;
  let getMockData;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    axios.mockImplementationOnce(() => getMockData(pipeHandler));
    // jest.spyOn(console, 'info').mockImplementation(() => { });
    // jest.spyOn(console, 'log').mockImplementation(() => { });
    // jest.spyOn(console, 'error').mockImplementation(() => { });
  });
  afterEach(() => {
    // jest.clearAllMocks();
    // jest.resetAllMocks();
  });
  describe('downloadMtgJsonZip', () => {
    let dataOnFn;
    let dataChunkFn;
    let writerCloseFn;
    let writerEmitFn;
    let writerOnFn;
    beforeEach(() => {
      const mockDataEventHandlers = {};
      const mockWriterEventHandlers = {};
      dataOnFn = jest.fn((e, cb) => {
        mockDataEventHandlers[e] = cb;
      });
      getMockData = (pipe) => ({
        status: 200,
        data: {
          pipe,
          on: dataOnFn,
        },
        headers: { 'content-length': 100 },
      });

      dataChunkFn = jest.fn((chunk) => mockDataEventHandlers.data(chunk));

      writerCloseFn = jest.fn(() => mockWriterEventHandlers.close());
      writerOnFn = jest.fn((e, cb) => {
        mockWriterEventHandlers[e] = cb;
      });
      writerEmitFn = jest.fn((event, ...arg) => mockWriterEventHandlers[event](...arg));
      fs.createWriteStream.mockImplementationOnce(() => ({
        on: writerOnFn,
        close: writerCloseFn,
        emit: writerEmitFn,
      }));
    });
    it('fetches data from an URL successfully', async () => {
      expect.assertions(3);
      pipeHandler = (writer) => writer.close();
      await downloadMtgJsonZip();
      expect(dataOnFn).toHaveBeenCalledWith('data', expect.any(Function));
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://mtgjson.com/api/v5/AllPrintings.json.gz',
        }),
      );
      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({ responseType: 'stream' }),
      );
    });
    it('ticks up the progress bar', async () => {
      expect.assertions(3);
      const chunk = { length: 10 };
      pipeHandler = (writer) => {
        dataChunkFn(chunk);
        writer.close();
      };
      const tickFn = jest.fn();

      ProgressBar.mockImplementationOnce(() => ({
        tick: tickFn,
        start: Date.now() - 1000,
      }));
      await downloadMtgJsonZip();
      expect(ProgressBar).toHaveBeenCalledWith(
        expect.stringContaining('downloading'),
        expect.objectContaining({
          total: 100,
        }),
      );
      expect(tickFn).toHaveBeenCalledWith(10);
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/Completed in \d(.\d+)? seconds/),
      );
    });
    it('handles errors from the writer', async () => {
      expect.assertions(3);
      pipeHandler = (writer) => writer.emit('error', new Error('bang'));
      try {
        await downloadMtgJsonZip();
      } catch (exception) {
        expect(writerCloseFn).toHaveBeenCalled();
        expect(exception.message).toMatch('bang');
        expect(console.info).not.toHaveBeenCalledWith(
          expect.stringMatching(/Completed in \d(.\d+)? seconds/),
        );
      }
    });
  });
  describe('getMtgVersion()', () => {
    let getMtgJsonVersion;
    beforeEach(() => {
      // have to mock for other tests,
      // so requiring the actual one to test it
      ({ getMtgJsonVersion } = jest.requireActual('./resources'));
    });
    const response = { meta: { version: 'testVersion' } };
    it('can get version', async () => {
      expect.assertions(1);
      getMockData = () => ({ data: response });
      const version = await getMtgJsonVersion();
      expect(version).toEqual('testVersion');
    });
    it('handles errors in fetching', async () => {
      expect.assertions(2);
      axios.mockReset();
      axios.mockRejectedValueOnce(new Error('bang'));
      await expect(() => getMtgJsonVersion()).rejects.toThrow('bang');
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('bang'));
    });
    it('handles malformed data', async () => {
      expect.assertions(2);
      getMockData = () => ({ data: {} });
      await expect(() => getMtgJsonVersion()).rejects.toThrow(TypeError);
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('TypeError: Cannot read properties of undefined'));
    });
  });
  describe('isLocalDataRecent()', () => {
    // stub on fs.fileReader

    // stub on getMtgVersion
    let getPathFor;
    let getMtgJsonVersion;
    beforeEach(() => {
      const { readFileSync } = jest.requireMock('fs');
      console.log(readFileSync === fs.readFileSync ? 'fs function is mocked' : 'not mocked');
      ({ getMtgJsonVersion } = jest.requireMock('./resources'));
      ({ getPathFor } = jest.requireMock('./resources.util'));
    });
    // run compare - see if it words
    describe.each([
      { status: 'missing', shouldError: false, getMtgJsonVersionCalls: 0 },
      // { status: 'malformed', shouldError: true, getMtgJsonVersionCalls: 0 },
      // { status: 'meta', shouldError: false, getMtgJsonVersionCalls: 1 },
    ])('file is $status', ({ status, shouldError, getMtgJsonVersionCalls }) => {
      let err;
      beforeEach(() => {
        console.log(`'beforeEach for: ${status}'`);
        err = null;
        getPathFor.mockReturnValue(status);
        // console.log(`getPathFor is known as ${getPathFor.getMockName()}`);
        // console.log(`getMtgJsonVersion is known as ${getMtgJsonVersion.getMockName()}`);
      });
      it('always attempts to read the meta json file', async (done) => {
        console.log('I try');
        try {
          console.log(`'I await ${status}'`);
          await isLocalDataRecent();
        } catch (error) {
          console.log(`'I err ${status}'`);
          console.log(fs.readFileSync.getMockName());
          err = error;
        } finally {
          console.log(`I finally expect '${status}'`, shouldError, err, getPathFor('', ''));
          expect(fs.readFileSync).toHaveBeenCalled();
          if (shouldError && err) {
            console.log(`'I did an error ${status}`, err, shouldError);
            done();
          }
          if (!shouldError && !err) done();
        }
      });
      it(`does ${!getMtgJsonVersionCalls && 'not'} call getMtgJsonVersion`, async (done) => {
        console.log('I try');
        try {
          console.log('I await');
          await isLocalDataRecent();
        } catch (error) {
          console.log(`I err ${fs.readFileSync.getMockName()}`);
          err = error;
        } finally {
          console.log(`I finally expect '${status}'`, shouldError, err, getPathFor('', ''));
          expect(getMtgJsonVersion).toHaveBeenCalledTimes(getMtgJsonVersionCalls);
          if (shouldError && err) {
            console.log(err);
            done();
          }
          if (!shouldError && !err) done();
        }
      });
      it('returns false', async (done) => {
        try {
          const match = await isLocalDataRecent();
          expect(match).toEqual(false);
        } catch (error) {
          err = error;
        } finally {
          if (shouldError && err) {
            console.log(err);
            done();
          }
          if (!shouldError && !err) done();
        }
      });
    });
  });
});
