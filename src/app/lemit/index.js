const { cpfOnBdd, crawlerLemit } = require("./crawler");
const { planilhaLemit } = require("./planilha");
const { delay, addLeadingZeros } = require("../../util/util");
const { readFile, writeFile, appendFile } = require("../../util/fileHandle");
const { saveDb } = require("../../api/databases/conversations");
const { clientAPI } = require("../../api/databases/client");
const { apiRequests } = require("../../api/databases/factorybelts");
const fs = require("fs");
const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");
const { fgtsFileCreate } = require("../banks/fgtsFileCreate");
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});

const jsonList = [ "./src/app/doc/fgtsSafraScala.csv","./src/app/doc/fgtsC6Scala.csv", "./src/app/doc/fgtsPanScala.csv", "./src/app/doc/fgtsPanFontes.csv", "./src/app/doc/fgtsMercNOVA.csv","./src/app/doc/fgtsMercFONTES.csv"];
let ws = new Client({
    authStrategy: new LocalAuth({ clientId: "2001" })
});

const timeCalculate = () => {
    let now = new Date();
    let oneDay = 86400000;
    const nineandahalf = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 7, 0, 0, 0);
    let millisTill10 = nineandahalf - now;
    if (millisTill10 <= 0) {
        millisTill10 = oneDay;
    }
    if(millisTill10 > oneDay ){
        millisTill10 = millisTill10 - oneDay;
    }
    console.info(millisTill10);
    return millisTill10;
};

const factorybelt = async(client, start) => {
    console.info("timecalculate", timeCalculate());
    setTimeout(
        async() => {
            start_list_process(client);
            await factorybelt(client,  timeCalculate());
        }, start || timeCalculate()
    );
};


const start_list_process = async(client) => {
    await fgtsFileCreate();
    let year = new Date().getFullYear();
    let getMonth = new Date().getMonth() + 1;
    let day = new Date().getDate();
    const date = `${day}-${getMonth}-${year}`;
    const file_name = `SCALA_FGTS_MERCANTIL_${date}`;
    const file_path = "./src/app/doc/lemit";    
    const csv_name = `${file_name}.csv`;
    const jsonpath = `${file_path}/${file_name}.json`;
    console.log();
    let numeroArquivo;
    if(!fs.existsSync(`${jsonpath}`)) {
        let fullList = [];
        let counter = 0;
        await appendFile("./src/app/doc/lemit/counter.txt", `${file_name}\n`);
        for (let index = 0; index < jsonList.length; index++) {
            let file =  (await readFile(jsonList[index])).split("\n");
            await appendFile("src/app/doc/lemit/counter.txt", `${jsonList[index]?.split("doc/")[1]?.split(".csv")[0]}: ${(file.length)-1}\n`);
            counter += file.length;
            file.map((e) => {
                try {
                    let json = JSON.parse(e);
                    json.simulation = new Date();
                    fullList.push(json);
                }
                catch (err){ 
                    console.error(err);
                }
            });
            await writeFile(jsonList[index], "");
        }
        await appendFile("./src/app/doc/lemit/counter.txt", `TOTAL LEADS FGTS: ${counter}\n`);
        await writeFile(jsonpath, JSON.stringify(fullList));
    }
    if(!fs.existsSync(`${file_path}/${csv_name}`)) {
        await cpfOnBdd(csv_name, file_path, jsonpath);
        numeroArquivo = await crawlerLemit(file_path, csv_name);
    }
    // numeroArquivo = "594265";
    await delay(1000);
    await planilhaLemit(`${file_path}/${numeroArquivo}-${csv_name}`, jsonpath, true);
    const file = JSON.parse(await readFile(jsonpath));
    await trackBuilder(file, client);
    await planilhaLemit(`${file_path}/${numeroArquivo}-${csv_name}`, jsonpath, false);
};

const trackBuilder = async(file, client_ws) => {
    const phoneResult = {true: 0, false: 0};
    for(let i = 0; i < file.length; i += 1) {
        try {
            const line = file[i];
            let cpfNmb = line?.cpf*1;
            const fullname = line?.nome?.split(" ")[0]?.toLowerCase();
            const nomeComplete = fullname?.charAt(0)?.toUpperCase() + fullname?.slice(1);
            let userPhone;
            let phoneArray = [line?.main, line?.Lemit_1, line?.Lemit_2, line?.Lemit_3, line?.Lemit_4];
            for (let index = 0; index < phoneArray.length; index += 1) {
                try {
                    const element = phoneArray[index];
                    if(typeof element === "string"){
                        let phone = `${element}`?.match(/\d/g)?.join("");
                        phone = addLeadingZeros(phone*1,8);
                        if(index === 0) userPhone = await client_ws?.getNumberId(`${phone}`);
                        if(phone && !userPhone) userPhone = await client_ws?.getNumberId(`55${phone}`);
                        if(userPhone?._serialized) {
                            console.log({userPhone, index});
                            break;
                        }
                    }
                } catch(err) {
                    console.error({trackBuilderErr: err});
                }
            }
            if(userPhone?._serialized) {
                phoneResult.true += 1;
                const factoryapi = apiRequests;
                const object_creation = {
                    id: userPhone._serialized,
                    name: nomeComplete,
                    value: line?.Simulacao,
                    bank: line?.Bank,
                    cpf: `${cpfNmb}`,
                    sended: false,
                    step: "torpedeira",
                    partner: line?.parceiro,
                    simulation: new Date(), 
                    category: line?.tipo
                };
                console.log(object_creation);
                await factoryapi.create(object_creation);
                console.log(line?._id);
                if(!line?._id){
                    clientAPI.post({ _id: line?._id, cpf: cpfNmb, main_whats: userPhone?._serialized, client_data: {name: nomeComplete}}, "_id");
                } else {
                    clientAPI.post({ _id: line?._id, cpf: cpfNmb, main_whats: userPhone?._serialized}, "_id");
                }
                await saveDb({id: userPhone._serialized, cpf: cpfNmb});
            } else {
                console.error("erro", cpfNmb, userPhone?._serialize);
                phoneResult.false += 1;
            }
            console.info(phoneResult);
        } catch (err) {
            console.error({err});
        }
    }
};
ws.initialize();
ws.on("qr", qr => { qrcode.generate(qr, { small: true }); });
ws.on("ready", () => {
    console.log("ready");
    factorybelt(ws, 1);
});
