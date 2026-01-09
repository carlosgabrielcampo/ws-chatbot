const { bmgRequests } = require("../../../api/banks/bmg.js");
const { appendFile, writeFile, readFile } = require("../../../util/fileHandle.js");
const { delay } = require("../../../util/util.js");
const { bmgKeys } = require("../../keys/apiKeys.js");

const bmgReq = async(cpf, simulation_obj, csv_path, correpondent) => {
    const bmgReq = await bmgRequests().balance((`${cpf*1}`), 2, correpondent);
    if(bmgReq?.simulacao?.valorLiberado) {
        simulation_obj.Saldo = bmgReq?.simulacao?.valorOriginal;
        simulation_obj.Simulacao = bmgReq?.simulacao?.valorLiberado;
        simulation_obj.Bank = "C6";
        if(simulation_obj?.Simulacao > 0){
            appendFile(csv_path, `${JSON.stringify(simulation_obj)}\n`);
        }
    }
};

const spredsheetRead = async(index) => {
    const spread = await readFile("./src/app/doc/lists/listPEG copy.csv");
    const lineArr = spread.split("\n");
    const indice = await readFile("./src/app/doc/indexBMG.txt");
    
    for (let i = (index || indice) * 1 || 0; i < lineArr.length; i += 1){
        writeFile("./src/app/doc/indexBMG.txt", `${i}`);
        let cpfScala = lineArr[i]?.match(/\d/g)?.join("");
        let simulation_obj_nova = {cpf: cpfScala};
        bmgReq(cpfScala, simulation_obj_nova, "src/app/doc/fgtsBmgNova.csv", bmgKeys[0]);
        await delay(6000);
    }
    return await spredsheetRead(0);
};

spredsheetRead();

