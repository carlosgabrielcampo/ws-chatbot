require("dotenv").config();
const qrcode = require("qrcode-terminal");
const { Client, MessageMedia, LocalAuth } = require("whatsapp-web.js");
const { saveDb, getByReceiver } = require("../../api/databases/conversations.js");
const { cadenceSender } = require("../../app/factorybelt/cadence.js");
const { arrayNmbsCreate } = require("../../app/whatsapp/phoneArray.js");
const { server_port } = require("../../util/server_port.js");
const { delay } = require("../../util/util.js");
const { defaultFlowError } = require("../../util/wsutils.js");
const fs =  require("fs");
const WebSocket = require("ws");
const { message_create } = require("../service/message_create.js");
const { localhostIp } = require("../../util/server.js");
const { writeFile, readFile } = require("../../util/fileHandle.js");
const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
});
const statusObject = {};
const phoneArrayPathFront = "C:/Users/carlo/OneDrive/Área de Trabalho/SCALA/front_chatbot/src/Components/DesktopLandingPage/MessageBigBox/phones.json";
const phoneArrayPathBack = "./src/app/whatsapp/phoneArray.json";

let ws;
const withSession = (phoneArrayBack) => {
    console.info({number: "000000000@c.us", server_port, phoneArray: phoneArrayBack[`CHATBOT${process.env.CHATBOT}`]});
    let message_array = [];
    let messages = [];
    let client_message = [];
    let data_array = [];
    ws = new Client();
    function onMessage(ws, data) {
        try{
            const conversation = JSON.parse(JSON.parse(data));
            if(conversation["id"]){
                delete conversation.message;
                let msgFind = message_array.find((e) => e.id === conversation["id"]);
                message_array = message_array.filter((e) => e.id !== conversation["id"]);
                msgFind = {...msgFind, ...conversation};
                message_array = [...message_array, msgFind];
            }
        } catch(error) {
            console.error(error);
        }
    }
    function broadcast(jsonObject) {
        try {
            if (!this.clients) return;
            this.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(jsonObject));
                }
            });
        } catch (error){
            console.error(error);
        }
    }
    const appWs = () => {
        const wss = new WebSocket.Server({
            port: +server_port + 200,
            perMessageDeflate: { zlibDeflateOptions: {
                chunkSize: 1024, 
                memLevel: 7, 
                level: 3 
            }, 
            zlibInflateOptions: { chunkSize: 10 * 1024 },
            clientNoContextTakeover: true,
            serverNoContextTakeover: true,
            serverMaxWindowBits: 10,
            concurrencyLimit: 10,
            threshold: 1024
            }
        });
        wss.on("connection", (ws) => {
            console.info("connected");
            ws.on("message", data => onMessage(ws, data));    
            ws.on("error", error => console.error(`onError: ${error.message}`));
        });
        wss.broadcast = broadcast;  
        console.info("App Web Socket Server is running!");
        return wss;
    };
    const wss = appWs();
    ws.on("qr", qr => { qrcode.generate(qr, { small: true }); });
    ws.on("ready", async () => {
        const number = ws?.info?.me?._serialized;
        console.info({number});
        phoneArrayBack[`CHATBOT${process.env.CHATBOT}`].number = number;
        writeFile(phoneArrayPathFront, JSON.stringify(phoneArrayBack));
        writeFile(phoneArrayPathBack, JSON.stringify(phoneArrayBack));
        const dataResponse  = await getByReceiver(ws?.info?.me?._serialized);
        message_array = dataResponse || [];
        let filteredPhones = arrayNmbsCreate(phoneArrayBack).typeFilter([undefined, "1", 1]);
        if(arrayNmbsCreate(filteredPhones).portArray.includes(server_port)) setInterval(async() => {cadenceSender(message_array, ws, wss, statusObject);}, 600000);
    });
    ws.on("message_create", async(msg) => {
        try {
            await wss.broadcast({msg: msg});
            console.info(`${msg?.type} ${new Date().getDate()}/${new Date().getMonth() + 1} ${new Date().getHours()}:${new Date().getMinutes()} ${msg?.from} - ${msg?.to}:`, msg?.body);
            messages.push(msg);
        } catch(error) {
            await defaultFlowError(msg.from, msg, error, "message_create");
        }
    });
    ws.on("disconnected", () =>  console.info("disconnected"));
    ws.initialize();
    setInterval(async () => {
        if(messages.length){
            let msg = messages[0];
            const phoneArray = arrayNmbsCreate(phoneArrayBack);
            console.info(`${msg?.from} - ${msg?.to}:`, msg?.body, "response" );
            message_create({msg, message_array, data_array, wss, client_message, ws, statusObject, phoneArray});
            messages.shift();
        }
    }, 1000 + (1000 * Math.random()));
    setInterval(async () => {
        if(client_message.length){
            let ids = client_message.map((e) => e?.id_client);
            let uniqueIds = [...new Set(ids)];
            for (let index = 0; index < uniqueIds.length; index++) {
                let filteredArray = [];
                const element = uniqueIds[index];
                filteredArray = client_message.filter((e) => e.id_client === element );
                await saveDb({id: element, message: filteredArray});
            }
            client_message = [];
        }
    }, 60000);
};
const withOutSession = (phoneArrayBack) => {
    let messages = [];
    ws = new Client({
        authStrategy: new LocalAuth({ clientId: server_port })
    });
    let message_array = [];
    let client_message = [];
    let data_array = [];
    ws.on("qr", qr => { qrcode.generate(qr, { small: true }); });
    ws.on("ready", async () => {const number = ws?.info?.me?._serialized; console.info({number}); });
    ws.on("message_create", async(msg) => {
        try {
            console.info(`${msg?.type} ${new Date().getDate()}/${new Date().getMonth() + 1} ${new Date().getHours()}:${new Date().getMinutes()} ${msg?.from} - ${msg?.to}:`, msg?.body);
            messages.push(msg);
        } catch(error) {
            await defaultFlowError(msg.from, msg, error, "message_create");
        }
    });
    setInterval(async () => {
        if(messages.length){
            let msg = messages[0];
            const phoneArray = arrayNmbsCreate(phoneArrayBack);
            console.info(`${msg?.from} - ${msg?.to}:`, msg?.body, "response" );
            message_create({msg, message_array, data_array, wss: {broadcast: () => {}}, client_message, ws, statusObject, phoneArray});
            messages.shift();
        }
    }, 1000 + (1000 * Math.random()));
    ws.on("disconnected", () =>  console.info("disconnected"));
    ws.initialize();
};
async function testing(){
    let phoneArrayBack = JSON.parse(await readFile(phoneArrayPathBack));
    process.env.CHATBOT = "TEST";
    withOutSession(phoneArrayBack);
}

if(process.env.TEST) {
    testing();
} else {
    readline.question("CHATBOT a ser conectado", (response) => {
        process.env.CHATBOT = response;
        readline.question("Tipo do CHATBOT\n 1 - FGTS \n 2- CONSIG", async (type) => {
            let phoneArrayBack = JSON.parse(await readFile(phoneArrayPathBack));
            phoneArrayBack[`CHATBOT${process.env.CHATBOT}`] = {
                host: `${localhostIp}:${server_port}`,
                time: 300000,
                bot: `CHATBOT${process.env.CHATBOT}`,
                type
            };
            if(server_port && !["7000", "7001", "2000", "2002"].includes(server_port)){
                withSession(phoneArrayBack);
            }
        });
    
    });
}

async function sendAudio(req, res){
    try{
        const data = req.body;
        sendMessageMedia(data.number, data.fileName, data.caption);
        res.send({ status: "Enviado mensagem multimidia!" });
    } catch(error){
        console.error(error);
    }
}
async function sendText(req, res) {
    const { message, number, delay } = req.body;
    sendMessage(number, message, delay).then(() =>{
        res.json({status: "enviado"});
    }).catch((err) => console.error({err}) );
}
async function sendMidia(req, res) {
    try{
        const {file, body} = req;
        const extension = file?.mimetype?.split("/")[1];
        const oldFileName = file?.path;
        const fileName = `${file?.path}.${extension}`;
        let number;
        let caption;
        if(oldFileName && fileName && file?.originalname){
            fs.rename(oldFileName, fileName, (err) => {
                console.info("\nFile Renamed!\n");
                if(err) console.error(err);
            });
            file.originalname = file?.originalname?.replaceAll("%22","\"");
            // number = JSON.parse(file?.originalname)?.number;
            number = body.number;
            // caption = JSON.parse(file?.originalname)?.caption;
            caption = body.caption;
        }
        
        if(!req.file){
            res.send({code: 500, msg: "err"});
        } else{
            await delay(5000 * Math.random() );
            sendMessageMedia(number, fileName, caption);
            res.send({ status: "Enviado mensagem multimidia!" });
        }
    }catch(error){
        console.error(error);
    }
}
async function sendVideo(req, res) {
    try {
        const {file} = req;
        const extension = file?.mimetype?.split("/")[1];
        const oldFileName = file?.path;
        const fileName = `${file?.path}.${extension}`;
        let number;
        let caption;
        if(oldFileName && fileName && file?.originalname){
            fs.rename(oldFileName, fileName, (err) => {
                console.info("\nFile Renamed!\n");
                if(err) console.error(err);
            });
            file.originalname = file?.originalname?.replaceAll("%22","\"");
            number = JSON.parse(file?.originalname)?.number;
            caption = JSON.parse(file?.originalname)?.caption;
        }
        if(!req.file){
            res.send({code: 500, msg: "err"});
        }else{
            await delay(5000);
            sendMessageMedia(number, fileName, caption);
            res.send({ status: "Enviado mensagem multimidia!" });
            if(oldFileName && fileName){
                fs.unlink(fileName, (err) => {
                    console.info("path/file.txt was deleted");
                });
            }
        }
    }catch(error){
        console.error(error);
    }
}
const sendMessageMedia = (number, fileName, caption) => {
    try {
        number = `${number}`;
        number = number?.replace("@c.us", "");
        number = `${number}@c.us`;
        const media = MessageMedia.fromFilePath(`${fileName}`);
        ws.sendMessage(number, media, { caption: caption }).catch((err) => console.error({err}) );
    } catch (err) {
        console.error("sendMessageMedia", err);
    }
};
async function sendMessage(number, text, delayTime = 0) {
    try {
        const checkNumber = await ws.getNumberId(number);
        const chatById = await ws.getChatById(checkNumber?._serialized);
        await chatById.sendStateTyping();
        delayTime && await delay(delayTime);
        const newNumber = chatById?.id?._serialized;
        const message = text;
        if (ws && ws.sendMessage && message) {
            return await ws.sendMessage(newNumber, message).catch((err) => console.error({err}) ); 
        } else {
            return new Error("not found");
        }
    } catch (error){
        console.error(error);
    }

}

const sendMessageHistory = async(req, res) => {
    try {
        const {id} = req.params;
        const chatById = await ws.getChatById(id);
        const chat = await chatById.fetchMessages({limit: 200});
        if(chat) res.status(200).json(chat);
        else res.status(400);
    } catch(error) {
        console.error(error);
        res.status(400).json(error);
    }
};
const download = async(req, res) =>{
    try {
        const {clientId, msgId} = req.body;
        const chatById = await ws.getChatById(clientId);
        const chat = await chatById.fetchMessages();
        let msg = chat.find((e) => {
            return e.id._serialized === msgId;
        });
        const download = (await msg?.downloadMedia())?.data;
        res.status(200).json(download);
    } catch(error) {
        console.error(error);
        res.status(400).json(error);
    }
};

module.exports = { sendText, sendMidia, sendVideo, ws, withOutSession, sendMessage, download, sendMessageHistory, sendAudio };
