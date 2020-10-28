'use strict'

const Fs = require('fs');
const Path = require('path');
const axios = require('axios');
const { handleWriter } = require('./resource.util');

const url = 'https://mtgjson.com/api/v5/AllPrintings.json.zip'

async function downloadMtgJsonZip() {
    const path = Path.resolve(__dirname, 'resources', 'AllPrintings.json')
    const writer = Fs.createWriteStream(path)

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })
    if (response && response.data) response.data.pipe(writer);
    return handleWriter(writer)
}

module.exports = {
    downloadMtgJsonZip,
    URL: url
}