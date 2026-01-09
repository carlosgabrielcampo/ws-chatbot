const { mercantilBuild } = require("./index.js");
const { writeFile, readFile, appendFile, removeFile } = require("../../../util/fileHandle.js");
const { delay, hour_validation } = require("../../../util/util.js");
const { correspondentKeyMercantil } = require("../../keys/apiKeys.js");
const spreadSheet = require("../../doc/lists/test.fgts.json");
const { requestErrorHandle } = require("../requestErrorHandle.js");
require("dotenv").config();
const lineArrCreate = async() => {
    const lineArr = spreadSheet
        .filter((e) =>!["Base Congelada", "Base Fria"].includes(e.category) )
        .sort((a, b) => sending.indexOf(a?.category) - sending.indexOf(b?.category));
    const errorcsvPaths = ["src/app/doc/lists/mercantil1.fgts.csv", "src/app/doc/lists/mercantil2.fgts.csv"];
    const csvPaths = ["src/app/doc/fgtsMercNOVA.csv", "src/app/doc/fgtsMercFONTES.csv"];
    return { lineArr, errorcsvPaths, csvPaths };
};

const mercantilReq = async(simulation_obj, csv_path, errorcsvPaths, correspondent) => {
    let mercReq = await mercantilBuild({cpf: simulation_obj?.cpf, timeout: 2000}, {}, 2, correspondent);    
    console.log(mercReq);
    simulation_obj.parceiro = correspondent?.name;
    simulation_obj.Bank = "Mercantil";
    if(mercReq?.message) simulation_obj.message = mercReq.message;
    if(mercReq?.simulacao?.valorEmprestimo){
        simulation_obj.Saldo = mercReq?.saldo?.valorEmprestimo;
        simulation_obj.Simulacao = mercReq?.simulacao?.valorEmprestimo;
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
            await writeFile(`src/app/doc/lists/history/mercantil_${Date.now()}${index}.csv`, file);
            await removeFile(element);
        }
        let array = await lineArrCreate();
        lineArr = array.lineArr;
    }
    console.info("length ==>", lineArr.length);
    for (let i = index * 1 || 0; i < lineArr.length; i += 2){
        writeFile("./src/app/doc/indexMerc.txt", `${i}`);
        mercantilReq({cpf: lineArr[i]?.cpf, tipo: lineArr[i]?.category}, csvPaths[0], errorcsvPaths[0], correspondentKeyMercantil[0]);
        mercantilReq({cpf: lineArr[i + 1]?.cpf, tipo: lineArr[i + 1]?.category}, csvPaths[1], errorcsvPaths[1], correspondentKeyMercantil[1]);
        await delay(6000);
        hour_validation(7, 19, 0) && await delay(hour_validation(7, 19, 0));
    }
    await writeFile("./src/app/doc/indexMerc.txt", "0");
    return await spredsheetRead(0);
};


spredsheetRead();