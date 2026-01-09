const { c6Requests } = require("../../../api/banks/c6.js");
const { appendFile, writeFile, readFile, removeFile } = require("../../../util/fileHandle.js");
const spreadSheet = require("../../doc/lists/test.fgts.json");
const { delay } = require("../../../util/util.js");
const { correspondentKeyC6 } = require("../../keys/apiKeys.js");
const { requestErrorHandle } = require("../requestErrorHandle.js");
const sending = ["Base Clientes", "Base Morna", "Base Fria", "", undefined];
const lineArrCreate = async() => {
    const lineArr = spreadSheet
        .filter((e) =>!["Base Congelada", "Base Fria"].includes(e.category) )
        .sort((a, b) => sending.indexOf(a?.category) - sending.indexOf(b?.category));
    console.log(lineArr);
    const errorcsvPaths = ["src/app/doc/lists/c6.fgts.csv"];
    const csvPaths = ["src/app/doc/fgtsC6Scala.csv"];
    return { lineArr, errorcsvPaths, csvPaths };
};

const c6Req = async(simulation_obj, csv_path, errorcsvPaths, correspondent) => {
    const c6Req = await c6Requests().balance((simulation_obj.cpf*1), 2, correspondent);
    console.log(c6Req);
    simulation_obj.Bank = "C6";
    simulation_obj.parceiro = correspondent?.name;
    if(c6Req?.message) simulation_obj.message = c6Req.message;
    if(c6Req?.simulacao?.net_amount) {
        simulation_obj.Saldo = c6Req?.simulacao?.gross_amount;
        simulation_obj.Simulacao = c6Req?.simulacao?.net_amount;
        appendFile(csv_path, `${JSON.stringify(simulation_obj)}\n`);
        appendFile(errorcsvPaths, `${JSON.stringify(simulation_obj)}\n`);
    } else if(!requestErrorHandle(simulation_obj)) {
        console.log({simulation_obj});
        appendFile(errorcsvPaths, `${JSON.stringify(simulation_obj)}\n`);
    }
};

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
            await writeFile(`src/app/doc/lists/c6${Date.now()}${index}.csv`, file);
            await removeFile(element);
        }
        let array = await lineArrCreate();
        lineArr = array.lineArr;
    }
    console.log("length ==>", lineArr.length);
    for (let i = index * 1 || 0; i < lineArr.length; i += 1){
        const [cpf, tipo] = [lineArr[i]?.cpf, lineArr[i]?.category];
        console.log({cpf, tipo});
        c6Req({cpf, tipo}, csvPaths[0], errorcsvPaths[0], correspondentKeyC6[0]);
        await delay(6000);
    }
    return await spredsheetRead(0);
};

spredsheetRead();

