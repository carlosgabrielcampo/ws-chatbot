const { writeFile, readFile, appendFile } = require("../../../util/fileHandle.js");
const { delay } = require("../../../util/util.js");
const { testregex } = require("../../../util/util.js");
const { safraKeys } = require("../../keys/apiKeys.js");
const { safraRequests } = require("../../../api/banks/safra.js");
require("dotenv").config();
let searches = "";
const messageValidator =  "Trabalhador não possui adesão ao saque aniversário vigente na data corrente.";

const safraReq = async(cpf, simulation_obj, csv_path, correspondent, position) => {
    const safraReq = await safraRequests.balance((cpf*1), 2, correspondent);
    if(safraReq?.balance) {
        let simulationFormat = safraReq?.balance?.map((e) =>{ return { "DataRepasse": e.dtRepasse, "valorRepasse": e.valor, "valorFinanciado": e.valor };});
        const safraSimul = await safraRequests.simulation((cpf * 1), simulationFormat, correspondent );
        simulation_obj.Simulacao = safraSimul?.simulacao?.valorPrincipal;
        simulation_obj.Bank = "Safra";
        if(simulation_obj?.Simulacao > 0){
            appendFile(csv_path, `${JSON.stringify(simulation_obj)}\n`);
        }
    }

    if((position % 100) === 0){
        await appendFile("./src/app/banks/Spreadsheets/fgts.csv", searches);
        searches = "";
    }  
    if(!testregex(safraReq?.message, [messageValidator])){
        searches += `${safraReq?.message},${cpf}\n`;
        return searches;
    }
 
};

const spredsheetRead = async() => {
    const spread = await readFile("./src/app/doc/lists/access1.csv");
    const lineArr = spread.split("\n");
    const indice = await readFile("./src/app/doc/indexSafra.txt");
    for (let i = indice * 1 || 0; i < lineArr.length; i += 1){
        let line = lineArr[i].split(",")[1];
        writeFile("./src/app/doc/indexSafra.txt", `${i}`);
        let cpfScala = line;
        let simulation_obj_nova = {cpf: cpfScala};
        safraReq(cpfScala, simulation_obj_nova, "src/app/doc/fgtsSafraScala.csv", safraKeys[0], i);
        await delay(2000);
    }
};

spredsheetRead();