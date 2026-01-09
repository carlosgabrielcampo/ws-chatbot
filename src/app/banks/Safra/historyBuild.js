const { safraRequests } = require("../../../api/banks/safra.js");
const { appendFile, writeFile, readFile } = require("../../../util/fileHandle.js");
const { delay, addLeadingZeros } = require("../../../util/util.js");
const { safraKeys } = require("../../keys/apiKeys.js");

const safraReq = async(cpf, simulation_obj, csv_path, correspondent) => {
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
};

const spredsheetRead = async(index) => {
    // const spread = await readFile("./src/app/doc/lists/listSearch.csv");
    const spread = await readFile("./src/app/doc/lists/listPEG.csv");
    const lineArr = spread.split("\n");
    const indice = await readFile("./src/app/doc/indexSafra.txt");
    for (let i = (index || indice) * 1 || 0; i < lineArr.length; i += 1){
        writeFile("./src/app/doc/indexSafra.txt", `${i}`);
        let cpfScala = addLeadingZeros(lineArr[i]?.match(/\d/g)?.join("")*1, 11);
        let simulation_obj_nova = {cpf: cpfScala};
        safraReq(cpfScala, simulation_obj_nova, "src/app/doc/fgtsSafraScala.csv", safraKeys[0]);
        await delay(4000);
    }
    await writeFile("./src/app/doc/indexMerc.txt", "0");
    return await spredsheetRead(0);
};

spredsheetRead();

