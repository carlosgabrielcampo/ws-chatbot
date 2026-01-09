const { saveDb } = require("../../api/databases/conversations");
const { cadence } = require("../whatsapp/texts");
const { delay, between, randomNumber } = require("../../util/util");

let oneMinute = 60000;
let oneHour = oneMinute*60;  
let oneDay = oneHour*24;
const filteringAndSorting = (msgArr, position) => {
    let filtered = msgArr;
    if(msgArr?.length) {
        filtered = msgArr?.filter((e) => !e.fromMe && e.step);
        filtered = filtered?.sort((a, b) => new Date(a.timestamp) - b.timestamp);
        if(position){
            filtered = filtered?.at(position) || {};
        }
    } else {
        if(position) filtered = {};
    }
    return filtered;
};

const selector = async (id, date, message, client_conversation, message_array, wss, ...params) => {
    
    let index = 0;
    let now = (new Date() - oneHour*3);

    if(message?.cadence){
        index = params?.map((ele) => { return ele?.cadenceName; })?.indexOf(message?.cadence) + 1;
    }

    let rule = params[index]; 

    if(!rule) return;

    if(((now - date) > rule?.cadenceTime - ((params[index - 1]?.cadenceTime) || 0))) {
        const hour = new Date().getHours();
        if(hour >= 8 && hour < 20 ){
            if(rule?.cadenceStep) message.step = rule?.cadenceStep;
            message.body = "";
            let cadenceName = rule.cadenceName;
            message.cadence = cadenceName;
            message_array = message_array.filter((e) => e?.id !== id);
            client_conversation.message.push(message);
            client_conversation.status_conversation = "AutoAtendimento";
            message_array = [...message_array, client_conversation];
            await saveDb({id, message});
            const random = randomNumber(2);
            await cadence[`${cadenceName}${random}`](id);
        }
    }
};

const cadenceOrder = [{
    cadenceName: "first",
    cadenceTime: oneMinute*15,
},{
    cadenceName: "second",
    cadenceTime: oneMinute*45,
},{
    cadenceName: "third",
    cadenceTime: oneHour*6,
}];

const cadenceSender = async(message_array, ws, wss, statusObject) => {
    try{
        let neutralSteps = [
            "call_security", "pre_start", "post_start",
            // "start",
            "void","low_value","toVoid","restart",
            "cadence.cadence1Response","cadence.cadence2Response","documentFiles.document_1",
            // "resell",
            "finish_contract","contract_end","to_contract_end","do_not_disturb", "are_you_sure", undefined
        ];
        let chats = await ws?.getChats();
        for (let index = 0; index < chats?.length; index++) {
            const e = chats[index];
            let id = e.id._serialized;
            statusObject[id] = false;
            let conversationDate = new Date((e.timestamp*1000)-(oneHour*3));
            let date =  conversationDate - (new Date() - oneDay*3);       

            if(between(id.length, 17, 18) && date > 0) {
                let client_conversation = message_array.find((e) => e?.id === id);
                let lastMsg = filteringAndSorting(client_conversation?.message, -1);
                conversationDate = new Date((lastMsg?.timestamp)) - (oneHour*3);
                date =  conversationDate - (new Date() - oneDay*3); 

                if(!(neutralSteps.includes(lastMsg?.step)) && lastMsg?.step) {
                    if(between(id.length, 17, 18) && date > 0) {
                        await selector(id, conversationDate, lastMsg, client_conversation, message_array, wss, ...cadenceOrder);
                        await delay(60000);
                    }
                }
            }
        }
    } catch(err) {
        console.error("cadence needs fix", err);
    }
};

module.exports = { cadenceSender };