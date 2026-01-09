const { clientAPI } = require("../../api/databases/client");
const { readFile, writeFile } = require("../../util/fileHandle");
const { manager_server } = require("../../util/server");
const { delay } = require("../../util/util");
const { client_obj } = require("../../util/importer/importer_pattern");
const { savingInfoByCPF } = require("../../util/database");

const phoneCreator = (arrayN, arrayT, everyString, client ) => {
    let count = 0;
    let phoneobj = {};
    arrayN.forEach((e, i) => {
        let phones = {};
        let origin = i <= 2 ? `Lemit_Fixo_${i+1}` : `Lemit_${i-2}`;
        if(client_obj.client_data.contact.phones.phone(everyString[e])){
            count = count + 1;
            phones.phone = client_obj.client_data.contact.phones.phone(everyString[e]);
            phones.ddd = client_obj.client_data.contact.phones.ddd(everyString[e -1]);
            phones.whatsapp = client_obj.client_data.contact.phones.is_whatsapp(everyString[e +4] === "1" ? true : false) ;
            phones.origin = client_obj.client_data.contact.phones.origin(origin);
            phones.createdAt = Date.now();
            arrayT.push(phones);
        }
        client[origin] = `${client_obj.client_data.contact.phones.ddd(everyString[e -1])}${client_obj.client_data.contact.phones.phone(everyString[e])}`;

    });
    if(count === 0){
        phoneobj.phone = 0;
        phoneobj.ddd = 0;
        phoneobj.origin = "Lemit_0";
        arrayT.push(phoneobj);
    }
};

const addressFunc = (everyString) =>{
    const addressArray = ["street","number","complement","neighborhood","city","state","cep"];
    const address = {};
    addressArray.map((e,i) => {
        address[e] = client_obj["client_data"]["address"][e]?.(everyString[i+3]);
    });
    return address;
};

const planilhaLemit = async (file, jsonpath, boolean) =>{
    let data = await readFile(file);
    let json = JSON.parse(await readFile(jsonpath));
    let dataSplit = data?.toString().split(/\r?\n/);
    let dataFinal = {};
    let divisor = data?.toString()?.split(";")?.length > dataSplit?.length ? ";" : "."; 
    for (let i = 1; i < dataSplit?.length; i++) {
        try{
            console.info({i});
            const e = dataSplit[i];
            let everyString = e.split(divisor);
            if(!everyString[0] === "NOME" || everyString[0]){
                dataFinal.cpf = client_obj.cpf(everyString[1]);
                const client = json.find((e) => (e.cliente || e.cpf) == client_obj.cpf(everyString[1]));
                dataFinal.client_data = {};
                dataFinal.client_data.name = client_obj.client_data.name(everyString[0]);
                dataFinal.client_data.address = [];
                client.nome = client_obj?.client_data?.name(everyString[0]);
                let address = addressFunc(everyString);
                dataFinal.client_data.address.push(address);
                dataFinal.client_data.contact = {};
                dataFinal.client_data.contact.phones = [];
                phoneCreator([35,41,47,53,59,65,71], dataFinal.client_data.contact.phones, everyString, client);
                if(client_obj.client_data.contact.emails.email(everyString[82])){
                    dataFinal.client_data.contact.emails = [];
                    let email = {};
                    email.email = client_obj.client_data.contact.emails.email(everyString[82]);
                    dataFinal.client_data.contact.emails.push(email);
                }
                if(boolean){
                    await writeFile(jsonpath, JSON.stringify(json));
                    await delay(100);
                } else {
                    const updated = await clientAPI.post(dataFinal, "cpf", `${manager_server}`);
                    await savingInfoByCPF(dataFinal.cpf, updated, `${manager_server}`);
                }
            }
        } catch(err) {
            console.error(err);
        }
    }
};

module.exports = { planilhaLemit };