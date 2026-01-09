require("dotenv").config();
const ruleset = require("./ruleSet");
const { testregex, ruleSplit } = require("../../util/util");
const { defaultError, defaultFlowError } = require("../../util/wsutils");
let oneDay = 1000 * 60 * 60 * 24;
const filteringAndSorting = (msgArr, position) => {
    let filtered = msgArr;
    if(msgArr.length) {
        filtered = msgArr?.filter((e) => !e.fromMe && e.step && e.type === "chat");
        filtered = filtered?.sort((a, b) => new Date(a.timestamp) - b.timestamp);
        if(position){
            filtered = filtered?.at(position) || {};
        }
    } else {
        if(position) filtered = {};
    }
    return filtered;
};
const bodyValidationArray = [
    {
        regexArray: ["iniciar", "reiniciar", "reininciar","reinicia", "renicia", "reincia"],
        text: "reiniciar"
    },{
        regexArray: ["resumir", "retomar", "retoma", "retmar", "rtomar", "retornar", "retorna", "retona", "retrna"],
        text: "retomar"
    },{
        regexArray: ["atendimento", "atendente", "atedete", "aetdente", "atedimento", "atndimento", "atendmento"],
        text: "atendimento"
    }
];
const validationArrayFunction = {
    "reiniciar": async(wsMessage, lastMsg) => {
        wsMessage.step = "restart";
        wsMessage.last_step = "restart";
        lastMsg.step = "restart";
        lastMsg.last_step = "restart";
    },
    "retomar": async(wsMessage, lastMsg, user_messages) => {
        const reverse = filteringAndSorting(user_messages)?.reverse();
        const reverseFilter = reverse?.filter(msg => !["call_security", "toVoid", "void"].includes(msg.step));
        const index = reverseFilter?.findIndex((msg) => msg.step !== reverseFilter[0].step);
        wsMessage.body = reverseFilter[index-1]?.body;
        wsMessage.step = reverseFilter[index]?.step;
        wsMessage.last_step = reverseFilter[index]?.step;
    },
    "atendimento": async(wsMessage, lastMsg) => {
        if(lastMsg !== "toVoid"){
            return await defaultError(wsMessage.from, wsMessage);
        }
    }
};
const lastMessageValidation = [
    {
        validation: (lastMsg) => !lastMsg?.type
            ? "new_restart"
            : false
    },
    {
        validation: (lastMsg, actualTime) => lastMsg?.step === "contract_end" && (actualTime - new Date(lastMsg?.timestamp))/(oneDay) < 5
            ? "contract_end"
            : ((actualTime - new Date(lastMsg?.timestamp))/(oneDay)) >= 1
                ? "restart"
                : false
    },
    {
        validation: (lastMsg) => lastMsg?.step === "contract_end" && lastMsg.type === "ptt" && "audio"
    }
];
const validationLastMessage = {
    "contract_end": (wsMessage, lastMsg) => {
        wsMessage.step = "contract_end";
        wsMessage.last_step = "contract_end";
        lastMsg.step = "contract_end";
        lastMsg.last_step = "contract_end";
    },
    "restart": (wsMessage, lastMsg) => {
        wsMessage.step = "restart";
        wsMessage.last_step = "restart";
        lastMsg.step = "restart";
        lastMsg.last_step = "restart";
    },
    "new_restart": (wsMessage, lastMsg, user_conversation) => {

        lastMsg.step = "restart";
        lastMsg.last_step = "restart";
        lastMsg.fromMe = false;
        lastMsg.timestamp = 0;
        wsMessage.step = "restart";
        wsMessage.last_step = "restart";
        user_conversation.message.push(lastMsg);
    },
};
const ruleStepSelection = async(wsMessage, user_info, rule, rejections, history, statusObject) => {
    statusObject[wsMessage.id_client] = true;
    try {
        if(await rule?.validate(wsMessage.from, wsMessage, user_info)) await rule.success(wsMessage.from, wsMessage, user_info, statusObject);
        else if(rejections?.length === rule.maxTryNmb - 1) {
            await rule.error(wsMessage.from, wsMessage, user_info);
            rejections?.push(wsMessage);
        }
        else await rule.invalid(wsMessage.from, wsMessage, history);
    } catch (error) {
        statusObject[wsMessage.id_client] = false;
        await defaultFlowError(wsMessage.from, wsMessage, error, "ruleStepSelection");
    }
};
const lastMessageStep = async(wsMessage, user_info, user_messages = [], statusObject, lastMsg) => {
    try {
        const {body} = wsMessage;
        wsMessage.bank = lastMsg?.bank;
        let rule = await ruleSplit(lastMsg?.step, ruleset);

        let bodyValidation = bodyValidationArray?.find((e) => testregex(body, e.regexArray));
        if(bodyValidation?.text && !(wsMessage.type === "image")){
            await validationArrayFunction[bodyValidation?.text](wsMessage, lastMsg, user_messages);
            statusObject[wsMessage.id_client] = false;
            rule = await ruleSplit(wsMessage?.step, ruleset);
            if(rule?.maxTryNmb >= 2 && bodyValidation?.text === "retomar") rule.maxTryNmb = rule?.maxTryNmb * 2;
            if(!rule?.maxTryNmb){rule = await ruleSplit("restart", ruleset);}
        }
        let rejections = filteringAndSorting(user_messages)?.slice(-rule?.maxTryNmb)?.filter((e) => e?.error === rule?.invalidStatus);
        !statusObject[wsMessage.id_client] && rule && await ruleStepSelection(wsMessage, user_info, rule, rejections, user_messages, statusObject); 
    } catch(error) {
        statusObject[wsMessage.id_client] = false;
        await defaultFlowError(wsMessage.from, wsMessage, error, "lastMessageStep");
    }
};
const bodyValidationStep = async(wsMessage, user_conversation, user_info, statusObject) => {
    try {
        const {message: user_messages = []} = user_conversation;
        let lastMsg = filteringAndSorting(user_messages, -1) || {};
        const actualTime = new Date(wsMessage?.timestamp);
        let messageValidation = (lastMessageValidation.find((e) => e.validation(lastMsg, actualTime)))?.validation(lastMsg, actualTime);
        if(!user_conversation?.message || !user_conversation?.message?.length){
            user_conversation.message = [];
        }
        if(messageValidation && !(wsMessage.type === "image")){
            validationLastMessage[messageValidation](wsMessage, lastMsg, user_conversation);
            statusObject[wsMessage.id_client] = false;
        }
        wsMessage.type !== "ptt" && await lastMessageStep(wsMessage, user_info, user_messages, statusObject, lastMsg);
    } catch (error) {
        statusObject[wsMessage.id_client] = false;
        await defaultFlowError(wsMessage.from, wsMessage, error, "bodyValidationStep");
    }
};
const message_handle = async(wsMessage, user_conversation, user_info, statusObject  ) => {
    try {
        if(wsMessage.body !== "" && ["chat", "image", "ptt"].includes(wsMessage.type)) {
            await bodyValidationStep(wsMessage, user_conversation, user_info, statusObject);
        }
    } catch (error) {
        statusObject[wsMessage.id_client] = false;
        await defaultFlowError(wsMessage.from, wsMessage, error, "history_create");
    }
};

module.exports = { message_handle };