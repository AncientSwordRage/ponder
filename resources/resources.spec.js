/* eslint-env jest */
const axios = require('axios');
const fs = require('fs');
const ProgressBar = require('progress');

const { downloadMtgJsonZip } = require('./resources');

jest.mock('fs');
jest.mock('axios');
jest.mock('progress');

describe('downloadMtgJsonZip', () => {
  let dataChunkFn;
  let dataOnFn;
  let writerCloseFn;
  let writerEmitFn;
  let writerOnFn;
  let pipeHandler;
  beforeEach(() => {
    const mockWriterEventHandlers = {};
    const mockDataEventHandlers = {};

    dataChunkFn = jest.fn((chunk) => mockDataEventHandlers.data(chunk));
    dataOnFn = jest.fn((e, cb) => {
      mockDataEventHandlers[e] = cb;
    });

    writerCloseFn = jest.fn(() => mockWriterEventHandlers.close());
    writerOnFn = jest.fn((e, cb) => {
      mockWriterEventHandlers[e] = cb;
    });
    writerEmitFn = jest.fn((event, ...arg) => mockWriterEventHandlers[event](...arg));
    const getMockData = (pipe) => ({
      status: 200,
      data: {
        pipe,
        on: dataOnFn,
      },
      headers: { 'content-length': 100 },
    });

    axios.mockImplementationOnce(() => getMockData(pipeHandler));
    fs.createWriteStream.mockImplementationOnce(() => ({
      on: writerOnFn,
      close: writerCloseFn,
      emit: writerEmitFn,
    }));
    jest.spyOn(console, 'info').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
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
