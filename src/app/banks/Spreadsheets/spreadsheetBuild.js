const { readFile, writeFile } = require("../../../util/fileHandle");
const { delay } = require("../../../util/util");

const spredsheetRead = async({index_file, json_path, bank, delay_time, bank_function}) => {
    const spread = await readFile("./src/app/doc/lists/listSearch.csv");
    const lineArr = spread.split("\n");
    const indice = await readFile(index_file);

    for (let i = indice * 1 || 0; i < lineArr.length; i += 1){
        writeFile(index_file, `${i}`);
        let cpf = lineArr[i]?.match(/\d/g)?.join("");
        let simulation_obj = {cpf};
        bank_function(cpf, simulation_obj, json_path);
        if(bank === "Pan"){
            const new_date = new Date();
            const date_now = Date.now();
            const start_hour = new Date(new_date.getFullYear(), new_date.getMonth(), new_date.getDate() + 1, 6, 0, 0, 0) - date_now;
            const finish_hour = new Date(new_date.getFullYear(), new_date.getMonth(), new_date.getDate(), 22, 0, 0, 0) - date_now;
            finish_hour < 0 && await delay(start_hour);
            await delay(delay_time);
        }
    }
};

module.exports = { spredsheetRead };
