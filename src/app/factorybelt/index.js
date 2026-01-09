require("dotenv").config();
const { delay, currencyFormat, randomNumber, timeoutPromise } = require("../../util/util");
const { apiRequests } = require("../../api/databases/factorybelts");
const { infotext } = require("../whatsapp/texts");
const { server_port } = require("../../util/server_port");
const { contador } = require("../../util/contador");
const { arrayNmbsCreate } = require("../whatsapp/phoneArray");
const { getRowsFunc } = require("../../api/googleAPI");
const { saveDb } = require("../../api/databases/conversations");
const { readFile } = require("../../util/fileHandle");
require("dotenv").config();
let oneDay = 86400000;

let message_array = [];
const table = {
    "Pan": 0.1115,
    "Mercantil": 0.123,
    "C6": 0.0915,
    "Safra": 0.02
};
const sending = [ "ura", "torpedeira", undefined];
const savingLog = async (list, bot, canal) => {
    const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
    await saveDb({
        id: list?.id, 
        cpf: list?.cpf * 1, 
        receiver: phoneArray[bot].number,
        status_conversation: "AutoAtendimento",
        log: [{
            data: new Date(), canal
        }] 
    });
};
const timeCalculate = () => {
    let now = new Date();
    let oneDay = 86400000;
    const nineandahalf = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 7, 0, 0, 0);
    let millisTill10 = nineandahalf - now;
    if (millisTill10 <= 0) {
        millisTill10 = oneDay;
    }
};
const listSender = async({send_qtd, delay_time, list, phone}) => {
    let valor = currencyFormat(list?.value);
    let random = randomNumber(5);
    const message = list?.step === "ura" ? "captacaoUra" : `captacao${random}`;
    if(message_array.includes(list?.id) !== true){
        message_array.push(list?.id);
        const messageSend = await infotext[`${message}`](list?.id, list?.name, valor, `http://${phone.host}`, list?.bank || "");
        await messageStatusValidation({list, messageSend, message, valor, phone});
    } else {
        message_array = message_array.filter((e) => e !== list?.id );
        await delay(delay_time);
        await sendListLogic({send_qtd, delay_time, phone});
    }
};

const listFilter = (list) => {
    return list
        ?.filter((e) => !e.sended)
        ?.sort((a, b) => {
            let commissionB = table[b.bank];
            let commissionA = table[a.bank];
            return (b.value * commissionB) - (a.value * commissionA); 
        })
        ?.sort((a, b) => Math.round(new Date(b.updatedAt)/86400000) - Math.round(new Date(a.updatedAt)/86400000))
        ?.sort((a, b) => sending.indexOf(a?.step) - sending.indexOf(b?.step))
        ?.find(e => e?.bank);
};
const get_list = async (send_qtd) => {
    let list = listFilter(await(await apiRequests.getall()));
    console.log("get_list", typeof list);
    if(!list){
        list = listFilter(await(await apiRequests.getall()));
        send_qtd + 1;
    }
    return { list, send_qtd };
};
const sendListLogic = async({send_qtd, delay_time, phone}) => {

    let { list, send_qtd: sended } = await get_list(send_qtd);
    if(list){
        console.log(phone.bot, list.id);
        await listSender({send_qtd: sended, delay_time, list, phone});
    }
    await delay(delay_time);
};
const beltSender = async(phone, delay_time, send_qtd, ) => {
    console.log(send_qtd);
    try {
        for(let i = 0; i < send_qtd; i += 1){
            const timeRemaining = timeCalculate({day: 0, hour: 20, minute: 0});
            console.log(timeRemaining >= oneDay, send_qtd);
            if(timeRemaining >= oneDay) return; 
            await sendListLogic({send_qtd, delay_time, phone});
        }
    } catch(err) {
        console.error(err);
    }
};

const phoneArrayFileReader = async() => JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
const factorybelt = async(start) => {
    let chatArr = {};
    let phoneArr = (await getRowsFunc("1nwBj5jUUQywMtCr-n4LFK--PiinRnYvQEr-aPv-IcnA","ENVIO")).data.values;
    if(phoneArr?.length){
        phoneArr?.shift();
        phoneArr?.forEach((ele) => chatArr[ele[0]] = +ele[1]);
        let filteredChatArr = Object.entries(chatArr).filter((e) => e[1] > 1).map((e) => e[0]);
        setTimeout(
            async() => {
                let filteredPhones = arrayNmbsCreate(await phoneArrayFileReader())
                    .typeFilter([undefined, "1", 1])
                    .filter((e) => filteredChatArr.includes(e.bot));
                let phoneArray = arrayNmbsCreate(filteredPhones).chatbotArr;
                for (let i = 0; i < phoneArray.length; i++) {
                    let phone = phoneArray[i];                
                    const time = timeCalculate({day: 0, hour: 18, minute: 0})/chatArr[phone.bot];
                    beltSender(phone, time, chatArr[phone.bot]);
                    await delay((10000 * Math.random()) + 50000);
                }
                return await factorybelt();
            }, start || timeCalculate({day: 1, hour: 8, minute: 0})
        );
    } else {
        await delay(60000);
        return await factorybelt(true); 
    }
};
const start_belt = async() => ["2000", "2002"].includes(server_port) && await factorybelt(true);
module.exports = { start_belt };

