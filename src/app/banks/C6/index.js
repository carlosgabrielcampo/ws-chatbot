const { c6Requests } = require("../../../api/banks/c6");
const { banktext, wstext } = require("../../whatsapp/texts");
const { delay } = require("../../../util/util");
const { simulatedSpreadsheet } = require("../Spreadsheets/simulatedSteps");
const { defaultFlowError } = require("../../../util/wsutils");
const { correspondentKeyC6 } = require("../../keys/apiKeys");
const { saveDb } = require("../../../api/databases/conversations");
const { apiFGTS } = require("../../../api/databases/fgts_database");

let linkRetriever = async({message, id, simulationObj}, info, link, proposalId) => {
    const fgts_obj = {
        "cpf": info?.cpf * 1,
        c6: {
            "link": [],
        },
    };
    if(link?.url){
        message.step = "finish_contract";
        message.body = `${link?.url}`;
        fgts_obj.c6.link.push(link);
        fgts_obj.category = "Base Clientes";
        message.textFunction = async() => await banktext.link(id, link?.url);
    } else {
        for (let index = 0; index < 5; index++) {
            const link = await c6Requests().linkFormalization(proposalId?.proposal_number, correspondentKeyC6[0]);
            if(link?.url){
                message.step = "finish_contract";
                message.body = `${link?.url}`;
                fgts_obj.category = "Base Clientes";
                fgts_obj.c6.link.push(link);
                message.textFunction = async() => await banktext.link(id, link?.url);
                return;
            }
            await delay(110000);
        }
        simulatedSpreadsheet(id, simulationObj, "C6");
        message.textFunction = async() => await wstext.pre_aproved_pan(id);
    }
    await apiFGTS.create(fgts_obj);
};

let postProposal = async({message, id}, c6Value, info, simulationObj ) => {
    let proposalId = await c6Requests().proposalPost(simulationObj, c6Value, correspondentKeyC6[0]);

    if (proposalId?.proposal_number) {
        const link = await c6Requests().linkFormalization(proposalId?.proposal_number, correspondentKeyC6[0]);
        await linkRetriever({message, id, simulationObj}, info, link, proposalId);
    } else {
        message.step = "call_security";
        await saveDb({id, status_conversation: "EmAndamento"});
        message.status_conversation = "EmAndamento";
        simulationObj.valor = c6Value?.net_amount;
        simulatedSpreadsheet(id, simulationObj, "C6");
        message.textFunction = async() => await wstext.pre_aproved_pan(id);
    }
};

const fulfill_contractPrdC6 = async (data_info, todaySimulation) => {
    const { id, message, info, simulationObj } = data_info;
    try {
        let bankHistory = todaySimulation;
        if(!bankHistory) {
            let simulation = await c6Requests().balance(info?.cpf, 0, correspondentKeyC6[0]);
            bankHistory = simulation?.simulacao;
        }
        return await postProposal({message, id}, bankHistory, info, simulationObj);
    } catch (error) {
        await defaultFlowError(id, message, error, "fulfill_contractPrdC6");
    }
};

module.exports = { fulfill_contractPrdC6 };