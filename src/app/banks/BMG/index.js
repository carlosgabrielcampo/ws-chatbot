const { c6Requests } = require("../../../api/banks/c6");
const { banktext } = require("../../whatsapp/texts");
const { delay } = require("../../../util/util");
const { simulatedSpreadsheet } = require("../Spreadsheets/simulatedSteps");
const { comercialSimulationTime, defaultFlowError } = require("../../../util/wsutils");
const { correspondentKeyC6 } = require("../../keys/apiKeys");
const { saveDb } = require("../../../api/databases/conversations");

let linkRetriever = async({message, id}, info, link, proposalId) => {
    if(link?.url){
        message.step = "finish_contract";
        message.body = `${link?.url}`;
        message.textFunction = async() => await banktext.link(id, link?.url);
    } else {
        for (let index = 0; index < 5; index++) {
            const link = await c6Requests().linkFormalization(proposalId?.proposal_number, correspondentKeyC6[0]);
            if(link?.url){
                message.step = "finish_contract";
                message.body = `${link?.url}`;
                message.textFunction = async() => await banktext.link(id, link?.url);
                return;
            }
            await delay(60000);
        }
    }
};

let postProposal = async({message, id}, c6Value, info, simulationObj ) => {
    let proposalId = await c6Requests().proposalPost(simulationObj, c6Value, correspondentKeyC6[0]);
    if (proposalId?.proposal_number) {
        const link = await c6Requests().linkFormalization(proposalId?.proposal_number, correspondentKeyC6[0]);
        console.info({link});
        await linkRetriever({message, id}, info, link, proposalId);
    } else {
        message.step = "call_security";
        await saveDb({id, status_conversation: "EmAndamento"});
        message.status_conversation = "EmAndamento";
        simulationObj.valor = c6Value?.net_amount;
        simulatedSpreadsheet(id, simulationObj, "Pan");
        message.textFunction = async() => await comercialSimulationTime(id);
    }
};

const fulfill_contractPrdC6 = async (data_info) => {
    const { id, message, info, simulationObj } = data_info;
    try {
        let bankHistory = await c6Requests().balance(info?.cpf, 0, correspondentKeyC6[0]);
        return await postProposal({message, id}, bankHistory?.simulacao, info, simulationObj);
    } catch (error) {
        await defaultFlowError(id, message, error, "fulfill_contractPrdC6");
    }
};

module.exports = { fulfill_contractPrdC6 };