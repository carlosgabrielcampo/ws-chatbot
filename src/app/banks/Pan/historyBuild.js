const { panRequests } = require("../../../api/banks/pan.js");
const { appendFile, writeFile, readFile, removeFile } = require("../../../util/fileHandle.js");
const { delay } = require("../../../util/util.js");
const { correspondentKeyPan } = require("../../keys/apiKeys.js");
const spreadSheet = require("../../doc/lists/test.fgts.json");
const { requestErrorHandle } = require("../requestErrorHandle.js");

const lineArrCreate = async() => {
    const lineArr = spreadSheet
        .filter((e) =>!["Base Congelada", "Base Fria"].includes(e.category))
        .sort((a, b) => sending.indexOf(a?.category) - sending.indexOf(b?.category));
    const errorcsvPaths = ["src/app/doc/lists/pan1.fgts.csv", "src/app/doc/lists/pan2.fgts.csv"];
    const csvPaths = ["src/app/doc/fgtsPanScala.csv", "src/app/doc/fgtsPanFontes.csv"];
    return { lineArr, errorcsvPaths, csvPaths };
};

const panReq = async(simulation_obj, csv_path, errorcsvPaths, correspondent) => {
    const panReq = await panRequests.balance_simulated((simulation_obj?.cpf*1), 2, correspondent);
    console.info({panReq});
    simulation_obj.Bank = "Pan";
    simulation_obj.parceiro = correspondent?.name;
    if(panReq?.message) simulation_obj.message = panReq.message;
    if(panReq?.simulacao?.condicoes_credito?.[0]?.valor_bruto) {
        simulation_obj.Saldo = panReq?.simulacao?.condicoes_credito[0]?.valor_bruto;
        simulation_obj.Simulacao = panReq?.simulacao?.condicoes_credito[0]?.valor_cliente;
        appendFile(csv_path, `${JSON.stringify(simulation_obj)}\n`);
        appendFile(errorcsvPaths, `${JSON.stringify(simulation_obj)}\n`);
    } else if(!requestErrorHandle(simulation_obj)) {
        console.log({simulation_obj});
        appendFile(errorcsvPaths, `${JSON.stringify(simulation_obj)}\n`);
    }
};

const sending = ["Base Clientes", "Base Morna", "", undefined];
const spredsheetRead = async(index) => {
    let {lineArr, errorcsvPaths, csvPaths } = await lineArrCreate();
    let simulated;
    for (let index = 0; index < errorcsvPaths.length; index++) {
        const simulatedClients = await readFile(errorcsvPaths[index]);
        let simulatedJoin = simulatedClients?.split(/\r?\n/);
        simulated = simulatedJoin?.map((e) => { 
            try { return JSON.parse(e); } 
            catch(error) { console.error(error); }
        });
        simulated = simulated?.map((e) => e?.cpf);
        lineArr = lineArr?.filter((e) => !simulated?.includes(e?.cpf));
        console.log(lineArr.length);
    }
    if(lineArr?.length < 100){
        for (let index = 0; index < errorcsvPaths.length; index++) {
            const element = errorcsvPaths[index];
            const file = await readFile(element);
            await writeFile(`src/app/doc/lists/history/pan_${Date.now()}${index}.csv`, file);
            await removeFile(element);
        }
        let array = await lineArrCreate();
        lineArr = array.lineArr;
    }
    console.info("length ==>", lineArr.length);

    for (let i = index * 1 || 0; i < lineArr.length; i += 2){
        errorcsvPaths.map((e, ind) => {
            const [cpf, tipo] = [lineArr[ind + i]?.cpf, lineArr[ind + i]?.category];
            console.log({cpf, tipo});
            panReq({cpf, tipo}, csvPaths[ind], e, correspondentKeyPan[ind]);
        });
        await delay(8000);
    }
    
    return await spredsheetRead(0);
};

spredsheetRead();

