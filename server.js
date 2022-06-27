const xl = require('excel4node');
const wb = new xl.Workbook();
const ws = wb.addWorksheet('Apontamentos')
const serv = require('/server');

const data = [
    {
        "name": "teste",
        "celular": "celular",
        "email": "email"
    }
]

const headingColumnName = [
    "Nome",
    "Celular",
    "Email"
]

let headingColumnIndex = 1;
headingColumnName.forEach(heading => {
    ws.cell(1, headingColumnIndex++).string(heading);
});

let rowIndex = 2;
data.forEach(record => {
    let columnIndex = 1;
    Object.keys(record).forEach(columnName => {
        ws.cell(rowIndex, columnIndex++).string(record[columnName])
    });
    rowIndex++;
});

wb.write(`Apontamentos.xlsx`)

module.exports = serv;