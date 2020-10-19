const axios = require('axios');
const fs = require('fs');
const { handleWriter } = require('./resource.util');

const { downloadMtgJson, URL } = require('./resources');

jest.mock('fs');
jest.mock('axios');
jest.mock('./resource.util')

describe.only('fetchData', () => {
    it('fetches successfully data from an URL', async () => {
        const data = { status: 200, data: { pipe: () => 'data' } };

        axios.mockImplementationOnce(() => data);
        fs.createWriteStream.mockImplementationOnce(() => 'fs');
        handleWriter.mockImplementationOnce(() => 'data');
        const expectedJson = await downloadMtgJson();
        expect(expectedJson).toEqual('data');
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({ URL: 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true' }),
        );
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({ responseType: 'stream' }),
        );
    });

    // it('fetches erroneously data from an URL', async () => {
    //     const errorMessage = 'Network Error';

    //     axios.mockImplementationOnce(() =>
    //         Promise.reject(new Error(errorMessage)),
    //     );

    //     await expect(downloadMtgJson()).rejects.toThrow(errorMessage);
    // });
});