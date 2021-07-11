const axios = require('axios');
const fs = require('fs');
const ProgressBar = require('progress')

const { downloadMtgJsonZip, url } = require('./resources');

jest.mock('fs');
jest.mock('axios');
jest.mock('progress')

describe('fetchData', () => {
    it('fetches successfully data from an URL', async () => {
        const onFn = jest.fn();
        const data = { status: 200, data: { pipe: () => 'data', on: onFn }, headers:{'content-length': 100} };

        axios.mockImplementationOnce(() => data);
        fs.createWriteStream.mockImplementationOnce(() => 'fs');
        await downloadMtgJsonZip();
        expect(onFn).toHaveBeenCalledWith('data', expect.any(Function));
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({ url: 'https://mtgjson.com/api/v5/AllPrintings.json.zip' }),
        );
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({ responseType: 'stream' }),
        );
    });
    it('ticks up the progress bar', async function() {
        const tickFn = jest.fn();
        const onFn = jest.fn((name, func) => func(['chunk']));
        const data = { status: 200, data: { pipe: () => 'data', on: onFn }, headers:{'content-length': 1} };

        ProgressBar.mockImplementationOnce(() => ({tick: tickFn}))
        axios.mockImplementationOnce(() => data);
        fs.createWriteStream.mockImplementationOnce(() => 'fs');
        await downloadMtgJsonZip();

        expect(ProgressBar).toHaveBeenCalledWith(
            expect.stringContaining('downloading'),
            expect.objectContaining({
                total: 1
            })
        );
        expect(tickFn).toHaveBeenCalledWith(1);
    })
});