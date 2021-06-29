const axios = require('axios');
const fs = require('fs');
const { handleWriter } = require('./resource.util');

const { downloadMtgJsonZip, url } = require('./resources');

jest.mock('fs');
jest.mock('axios');
jest.mock('./resource.util')

describe.only('fetchData', () => {
    it('fetches successfully data from an URL', async () => {
        const data = { status: 200, data: { pipe: () => 'data' } };

        axios.mockImplementationOnce(() => data);
        fs.createWriteStream.mockImplementationOnce(() => 'fs');
        handleWriter.mockImplementationOnce(() => 'data');
        const expectedJson = await downloadMtgJsonZip();
        expect(expectedJson).toEqual('data');
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({ url: 'https://mtgjson.com/api/v5/AllPrintings.json.zip' }),
        );
        expect(axios).toHaveBeenCalledWith(
            expect.objectContaining({ responseType: 'stream' }),
        );
    });
});