'use strict'

const Fs = require('fs');
const Path = require('path');
const axios = require('axios');
const ProgressBar = require('progress')

const url = 'https://mtgjson.com/api/v5/AllPrintings.json.zip';
const metaUrl = 'https://mtgjson.com/api/v5/Meta.json';

async function getMtgJsonVersion() {
    return await axios(metaUrl).data.date;
}

//get json (wrapping below funcs)
function getMtgJson() {
    //check version vs current json file
    //maybe axios fetch new json.zip
    //unzip the new json.zip
    //parse and return the json
}

//unzip json
function unzipJson() { }

//separate download, check version and unziping
async function downloadMtgJsonZip() {
    const path = Path.resolve(__dirname, 'resources', 'AllPrintings.json.zip')
    const writer = Fs.createWriteStream(path)

    console.log('...connecting...')
    const { data, headers } = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })
    const totalLength = headers['content-length'];

    console.log('...starting download...')
    const progressBar = new ProgressBar('-> downloading [:bar] :percent :etas', {
      width: 40,
      complete: '=',
      incomplete: ' ',
      renderThrottle: 1,
      total: parseInt(totalLength),
      callback: () => console.log(`Completed in ${(new Date - progressBar.start)/1000} seconds`)
    })
    data.on('data', (chunk) => progressBar.tick(chunk.length))
    data.pipe(writer);
}

module.exports = {
    downloadMtgJsonZip,
    URL: url
}