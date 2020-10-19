'use strict'

const Fs = require('fs');
const Path = require('path');
const axios = require('axios');
const { handleWriter } = require('./resource.util');

const URL = 'https://unsplash.com/photos/AaEQmoufHLk/download?force=true'

async function downloadMtgJson() {
    const path = Path.resolve(__dirname, 'resources', 'code.jpg')
    const writer = Fs.createWriteStream(path)

    const response = await axios({
        URL,
        method: 'GET',
        responseType: 'stream'
    })
    if (response && response.data) response.data.pipe(writer);
    return handleWriter(writer)
}

module.exports = {
    downloadMtgJson,
    URL
}