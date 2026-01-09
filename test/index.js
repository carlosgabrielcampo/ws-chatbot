const { message_create } = require("../src/database/service/message_create");
const messageModel = require("./model/messageModel.json");
const messageChatMercantil = require("./chat/mercantil.json");
const messageChatPan = require("./chat/pan.json");
const messageChatC6 = require("./chat/c6.json");


const { RequestTestServer } = require("./server/requestApp");
const { delay } = require("../src/util/util");
const { server_port } = require("../src/util/server_port");
const { clientAPI } = require("../src/api/databases/client");
const { delete: deleteConversation } = require("../src/api/databases/conversations");
const { apiFGTS } = require("../src/api/databases/fgts_database");
const { panSuccessMock, mercantilSuccessMock, c6SuccessMock } = require("./mocks/bankSimulation");
const { arrayNmbsCreate } = require("../src/app/whatsapp/phoneArray");
const phoneArray = {
    "CHATBOTTEST": {
        "host": `192.168.20.115:${server_port}`,
        "time": 300000,
        "bot": "CHATBOTTEST",
        "type": "1",
        "number": "111111111111@c.us"
    }
};
const message_array = [];
const data_array = [];
const client_message = [];
const wsMock = {
    getProfilePicUrl: () => {}, 
    getChatById: () => {
        return {
            sendSeen: () => {}
        };
    }, 
    sendPresenceAvailable: () => {},
};
const wssMock = {
    broadcast: () => {}
};
const fgts_obj = {
    cpf: "",
    "mercantil": {
        "balance": [],
        "simulation": [],
    },
    "c6": {
        "balance": [],
        "simulation": [],
    },
    "pan": {
        "balance": [],
        "simulation": [],
    },
};

const defaultClientCreate = async(cpf, simulation, bank) => {
    await apiFGTS.delete(cpf);
    fgts_obj.cpf = cpf;
    fgts_obj[bank].simulation.push(simulation);
    await apiFGTS.create(fgts_obj);
    await clientAPI.delete_one(cpf, "cpf");
    await deleteConversation("1111111111111@c.us", "id");
};

const messageFlow = async(chat) => {
    let statusObject = [];
    for (let index = 0; index < chat.length; index++) {
        chat[index]?.timeout && await delay(chat[index].timeout);
        const msg ={...messageModel, ...chat[index]};
        msg.id._serialized = `${(1000000000**2)*Math.random()}`;
        let phones = arrayNmbsCreate(phoneArray);
        console.info(`${msg?.type} ${new Date().getDate()}/${new Date().getMonth() + 1} ${new Date().getHours()}:${new Date().getMinutes()} ${msg?.from} - ${msg?.to}:`, msg?.body);
        const { msg: msgReturn } = await message_create({msg, message_array, data_array, wss: wssMock, client_message, ws: wsMock, statusObject, phoneArray: phones});
    }
};

const messageFlowLine = async(chat) => {
    let statusObject = [];
    let messages = [];
    setInterval(async () => {
        if(messages.length){
            let msg = messages[0];
            let phones = arrayNmbsCreate(phoneArray);
            console.info(`${msg?.from} - ${msg?.to}:`, msg?.body, "response" );
            message_create({msg, message_array, data_array, wss: wssMock, client_message, ws: wsMock, statusObject, phoneArray: phones});
            messages.shift();
        }
    }, 1000 + (1000 * Math.random()));
    for (let index = 0; index < chat.length; index++) {
        chat[index]?.timeout && await delay(chat[index].timeout);
        const msg ={...messageModel, ...chat[index]};
        console.time(msg?.from);
        msg.id._serialized = `${(1000000000**2)*Math.random()}`;
        console.info(`${msg?.type} ${new Date().getDate()}/${new Date().getMonth() + 1} ${new Date().getHours()}:${new Date().getMinutes()} ${msg?.from} - ${msg?.to}:`, msg?.body);
        messages.push(msg);
        console.timeEnd(msg?.from);
    }

};


const PanTrue = async () => {
    const conversation = messageChatPan["success-pan-full-conversation"];
    const cpf = conversation.cpf * 1;
    await defaultClientCreate(cpf, panSuccessMock, "pan");
    await messageFlow(conversation.message);
};
const PanTrueErrors = async () => {
    const conversation = messageChatPan["success-pan-full-conversation-error"];
    const cpf = conversation.cpf * 1;
    await defaultClientCreate(cpf, panSuccessMock, "pan");
    await messageFlow(conversation.message);
};
const PanReContract = async () => {
    const conversation = messageChatPan["success-pan-re-conversation"];
    await messageFlow(conversation.message);
};
const MercantilTrue = async () => {
    const conversation = messageChatMercantil["success-mercantil-full-conversation"];
    const cpf = conversation.cpf * 1;
    await defaultClientCreate(cpf, mercantilSuccessMock, "mercantil");
    await messageFlow(conversation.message);
};
const MercantilTrueErrors = async () => {
    const conversation = messageChatMercantil["success-mercantil-full-conversation-error"];
    const cpf = conversation.cpf * 1;
    await defaultClientCreate(cpf, mercantilSuccessMock, "mercantil");
    await messageFlowLine(conversation.message);
};
const MercantilTrueErrorsInter = async () => {
    const conversation = messageChatMercantil["success-mercantil-full-conversation-error-interchanged"];
    const cpf = conversation.cpf * 1;
    await defaultClientCreate(cpf, mercantilSuccessMock, "mercantil");
    await defaultClientCreate(10119753944, mercantilSuccessMock, "mercantil");

    await messageFlowLine(conversation.message);
};
const MercantilReContract = async () => {
    const conversation = messageChatMercantil["success-mercantil-re-contract"];
    await messageFlow(conversation.message);
};
const C6True = async () => {
    const conversation = messageChatC6["success-c6-full-conversation"];
    const cpf = conversation.cpf * 1;
    await defaultClientCreate(cpf, c6SuccessMock, "c6");
    await messageFlow(conversation.message);
};
const C6TrueErrors = async () => {
    const conversation = messageChatC6["success-c6-full-conversation-error"];
    const cpf = conversation.cpf * 1;
    await defaultClientCreate(cpf, c6SuccessMock, "c6");
    await messageFlow(conversation.message);
};
const C6ReContract = async () => {
    const conversation = messageChatC6["success-c6-re-contract"];
    await messageFlow(conversation.message);
};
const PanTests = async() => {
    await PanTrue();
    // await PanTrueErrors();
    // await PanReContract();
};
const MercantilTests = async() => {
    // await MercantilTrue();
    // await MercantilReContract();
    // await MercantilTrueErrors();
    await MercantilTrueErrorsInter();
};
const C6Tests = async () => {
    await C6True();
    // await C6ReContract();
    // await C6TrueErrors();
};
const PaolaTest = async () => {
    RequestTestServer.listen(process.env.PORT, () => console.info(`Listening on Port ${process.env.PORT}`));
    await MercantilTests();
    // await PanTests();
    // await C6Tests();
};

PaolaTest();