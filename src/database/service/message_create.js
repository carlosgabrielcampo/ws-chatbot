const { clientAPI } = require("../../api/databases/client");
const { saveDb, getid } = require("../../api/databases/conversations");
const { message_handle } = require("../../app/whatsapp/message_handle");
const { arrayNmbsCreate } = require("../../app/whatsapp/phoneArray");
const { server_port } = require("../../util/server_port");
const { delay } = require("../../util/util");
const { defaultFlowError } = require("../../util/wsutils");
const { message_handle_flow } = require("../../app/whatsapp/consigFlow");
const { uraList } = require("../../app/factorybelt/ura");
const { contador } = require("../../util/contador");
const createDatabaseObject = (msg) => {
    try{
        const messageDatabaseModel = { timestamp: "", body: "", fromMe: "", msg_id: "", error: "", type: "", bank: "", step: "", last_step: ""};
        return Object.assign({}, ...Object.keys(messageDatabaseModel).map((ele) =>({[ele]: Object.entries(msg).find(([key]) => key === ele)?.[1] }))); 
    } catch(error) {
        console.error(error);
    }
};
const msgConfig = async(msg, ws) => {
    try {
        msg.msg_id = msg.id._serialized;
        msg.id_client = msg.to;
        msg.receiver = msg.from;
        msg.block = true;
        if(!msg.fromMe){
            msg.name = msg?._data.notifyName;
            msg.id_client = msg.from;
            msg.receiver = msg.to;
        }
        msg.profilePic = await ws?.getProfilePicUrl(msg.id_client);    
        msg.timestamp = process.env.TEST ? msg.timestamp : new Date();
    } catch(error) {
        console.error(error);
    }
};
const historyCreate = async (msg, message_array) => {
    try{
        const defaultUserObject = {
            id: msg.id_client, 
            status_conversation: "AutoAtendimento", 
            msgs_unread: 0, 
            message: [{
                timestamp: process.env.TEST ? msg.timestamp : new Date(),
                body: msg.body,
                type: msg.type,
                step: "restart",
                last_step: "restart",
                ...msg,
            }],
            profilePic: msg?.profilePic,
            log: []
        };
        let user_conversation = await getid(msg.id_client);
        !process.env.TEST && await delay(30000 + (Math.random() * 30000));
        if(!user_conversation || typeof user_conversation === "string") {
            if(msg?.tag){
                const botInfo = { id: msg.id_client, bank: "", name: msg?.tag, convenio: "FGTS", type: "message", message: msg.body };
                console.info(await contador(botInfo));
                defaultUserObject.log.push({data: new Date(), canal: msg.tag});
            }
            await saveDb(defaultUserObject);
            user_conversation = await getid(msg.id_client) || defaultUserObject;
            if(typeof user_conversation === "string" || !user_conversation) user_conversation = defaultUserObject;
        }
        if((!user_conversation || typeof user_conversation === "string") && !message_array?.find((e) => e?.id === msg?.id_client)){
            user_conversation = defaultUserObject;
        }
        message_array.push(user_conversation);
        return user_conversation;
    } catch(error) {
        console.error(error);
    }
};
const userCreate = async (msg, clientHistory, data_array) => {
    try {
        const phoneNumber = msg.id_client.replace("@c.us", "");
        const ddd = phoneNumber.slice("2","4") * 1;
        const phone = phoneNumber.slice("4") * 1;
        const defaultDataStructure = {
            main_whats: msg.id_client,
            client_data: {
                bank_data: [],
                address: [],
                documents: [],
                contact: { phones: [{origin: "main", ddd, phone }] }
            }
        };
        let cpf = clientHistory?.cpf;
        let user_info = data_array?.find((e) => e?.cpf === cpf);

        if(!msg.fromMe){
            if(cpf && !user_info) {
                defaultDataStructure.cpf = cpf;
                user_info = (await clientAPI.get_id(cpf, "cpf")); 
                if( user_info === "Nenhum usuário encontrado") {
                    const postClient = await clientAPI.post(
                        {
                            cpf: cpf*1, 
                            client_data: {...defaultDataStructure.client_data}, 
                            main_whats: msg.id_client
                        },
                        "cpf"
                    );
                    user_info = postClient?.client || defaultDataStructure;
                }
                clientHistory.cpf = cpf;
                data_array.push(user_info);
            }
            if(((!cpf || !user_info || typeof user_info === "string" ) && !data_array?.find((e) => e?.cpf === cpf)) ){
                user_info = defaultDataStructure;
                data_array.push(user_info);
            }
        }
        return user_info;  
    } catch(error) {
        console.error(error);
    }
};
const chatbotInitializer = async(msg, user_conversation, user_info, statusObject) => {
    try {
        if(msg.from.length < 20  && !msg.fromMe) {
            await message_handle(msg, user_conversation, user_info, statusObject); 
        }
    } catch (error) {
        await defaultFlowError(msg.from, msg, error, "chatbotInitializer");
    }
};
const consigFlow = async(msg) => {
    try {
        if(msg.from.length <= 20 && !msg.fromMe) await message_handle_flow(msg); 
    } catch (error) {
        await defaultFlowError(msg.from, msg, error, "chatbotInitializer");
    }
};
const historyFill = async(msg, user_conversation, user_info, ws) => {
    try {
        if(msg.hasMedia) {
            msg.body = msg._data.body;
            const [, extension] = (String(await msg._data.mimetype)).split("/");
            msg.fileName = `${await msg.msg_id}.${extension}`;
        }
        const lastMsg = user_conversation?.message?.filter((e) => !e?.fromMe)?.at(-1);
        if(user_conversation){
            if(!msg.fromMe){
                user_conversation.msgs_unread = (await ws.getChatById(msg.id_client)).unreadCount;
                if(msg?.status_conversation !== user_conversation.status_conversation){ 
                    user_conversation.status_conversation = msg?.status_conversation; 
                }
            } else if(msg.fromMe) {
                user_conversation.msgs_unread = 0;
                msg.step = lastMsg?.step;
            }
            if(["chat", "image"].includes(msg.type)){
                user_conversation?.message?.push(msg);
            }
            if(msg?.cpf) user_conversation.cpf = msg?.cpf;
            user_conversation.data = user_info;
            user_conversation.receiver = msg.receiver;
            user_conversation.profilePic = msg.profilePic;
        }
    } catch(error) {
        console.error(error);
    }
};
module.exports.message_create = async ({msg, message_array, data_array, wss, client_message, ws, statusObject, phoneArray}) => {
    const fgtsPhones = phoneArray?.typeFilter([undefined, "1", 1]);
    const consigPhones = phoneArray?.typeFilter(["2", 2]);
    const {bot} = phoneArray.chatbotArr.find((e) => e.host.split(":").at(-1) === `${server_port}`);
    if(["CHATBOT4", "CHATBOT26", "CHATBOT27", "CHATBOT28", "CHATBOT29", "CHATBOTTEST"].includes(bot)) msg.tag = "mkt";
    if(["5565465488@c.us", "553546546546.us"].includes(msg.from)) return uraList(ws, msg);
    if(phoneArray.portArray.includes(server_port) && msg.type !== "call_log"){
        await msgConfig(msg, ws);
        let user_conversation = message_array?.find((e) => e?.id === msg?.id_client);
        if(!user_conversation) user_conversation = await historyCreate(msg, message_array);
        const user_info = await userCreate(msg, user_conversation, data_array);
        
        arrayNmbsCreate(fgtsPhones)?.portArray?.includes(`${server_port}`)
            && !phoneArray.nmbArray.includes(msg?.id_client) 
            && await chatbotInitializer(msg, user_conversation, user_info, statusObject);

        arrayNmbsCreate(consigPhones)?.portArray?.includes(`${server_port}`) && await consigFlow(msg);
        await historyFill(msg, user_conversation, user_info, ws, statusObject);

        await wss.broadcast({bdd: user_conversation});
        client_message.push(msg);
        
        if(msg?.textFunction){
            statusObject[msg.id_client] = true;
            await ws.sendPresenceAvailable();
            const chatById = await ws.getChatById(msg.id_client);
            await chatById.sendSeen();
            await msg?.textFunction();
            statusObject[msg.id_client] = false;
        }

        await saveDb({
            id: msg.id_client,
            profilePic: msg?.profilePic,
            receiver: msg?.receiver,
            name: user_info?.client_data?.name || msg?.name,
            msgs_unread: user_conversation?.msgs_unread,
            status_conversation: user_conversation?.status_conversation
        });

        const msg_model = createDatabaseObject(msg);
        return { user_conversation, user_info, msg: msg_model };
    }
};