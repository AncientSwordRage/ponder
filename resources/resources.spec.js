/* eslint-env jest */
const { default: axios } = require('axios');
const fs = require('fs');
const ProgressBar = require('progress');

const { downloadMtgJsonZip, getMtgJsonVersion } = require('./resources');

jest.mock('fs');
jest.mock('axios');
jest.mock('progress');

describe('resources.js', () => {
  let pipeHandler;
  let getMockData;

  beforeEach(() => {
    axios.mockImplementationOnce(() => getMockData(pipeHandler));
    jest.spyOn(console, 'info').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
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
    it('fetches data from an URL sucessfully', async () => {
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
  describe('getMtgVersion', () => {
    const response = { meta: { version: 'testVersion' } };
    it('can get version', async () => {
      expect.assertions(1);
      getMockData = () => ({ data: response });
      const version = await getMtgJsonVersion();
      expect(version).toEqual('testVersion');
    });
    it('handles errors in fetching', async () => {
      expect.assertions(2);
      // getMockData = () => ({ data: response });
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
});
