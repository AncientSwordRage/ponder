const CSVToJSON = require("./csvToJson");

describe.only('csvToJson.spec.js', () => {
    const exampleCSV = `"Card Name","Cat 1","Cat 2","Cat 3"
"Card 1",1,0,1
"Card 2",1,1,
"Card 3",0,,1`

    it('converts csv to json', () => {
        const actualJson = CSVToJSON(exampleCSV);
        expect(actualJson).toEqual([{
            "Card Name": "Card 1",
            "Cat 1": "1",
            "Cat 2": "0",
            "Cat 3": "1",
        }, {
            "Card Name": "Card 2",
            "Cat 1": "1",
            "Cat 2": "1",
            "Cat 3": "",
        }, {
            "Card Name": "Card 3",
            "Cat 1": "0",
            "Cat 2": "",
            "Cat 3": "1",
        }]);
    })
})