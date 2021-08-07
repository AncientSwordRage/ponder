/* eslint-disable no-cond-assign, no-plusplus */

/**
 * Parse CSV
 *
 * https://gist.github.com/plbowers/7560ae793613ee839151624182133159
 * modified to comply with eslint rules
 */
const csvStringToArray = (strData, header = true) => {
  const objPattern = new RegExp(('(\\,|\\r?\\n|\\r|^)(?:"((?:\\\\.|""|[^\\\\"])*)"|([^\\,"\\r\\n]*))'), 'gi');
  let arrMatches = null;
  let hData;
  let hashData;
  const arrData = [[]];
  while (arrMatches = objPattern.exec(strData)) {
    if (arrMatches[1].length && arrMatches[1] !== ',') arrData.push([]);
    arrData[arrData.length - 1].push(arrMatches[2]
      ? arrMatches[2].replace(new RegExp('[\\\\"](.)', 'g'), '$1')
      : arrMatches[3]);
  }
  if (header) {
    hData = arrData.shift();
    hashData = arrData.map((row) => {
      let i = 0;
      return hData.reduce(
        (acc, key) => {
          acc[key] = row[i++];
          return acc;
        },
        {},
      );
    });
    return hashData;
  }
  return arrData;
};

const CSVToJSON = (...args) => csvStringToArray(...args);

module.exports = CSVToJSON;
