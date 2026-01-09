const { panRequests } = require("../../../api/banks/pan");
const { banktext } = require("../../whatsapp/texts");
const { addLeadingZeros, delay, testregex } = require("../../../util/util");
const { simulatedSpreadsheet } = require("../Spreadsheets/simulatedSteps");
const { comercialSimulationTime, defaultFlowError } = require("../../../util/wsutils");
const { correspondentKeyPan } = require("../../keys/apiKeys");
const { saveDb } = require("../../../api/databases/conversations");
const { errorList, errors } = require("../../../util/error");
const { server } = require("../../../util/server");
const { apiFGTS } = require("../../../api/databases/fgts_database");

let panValue = (bankHistory) => {
    return bankHistory?.simulacao?.condicoes_credito?.find((simulation, i, alle) => {
        let maxTax = alle?.map((ele) => ele.taxa_referencia_mensal);
        simulation.correpondent = bankHistory?.simulacao?.correspondent;
        return simulation?.sucesso === true && Math.max(...maxTax) === simulation.taxa_referencia_mensal;
    });
};

let linkRetriever = async({message, id}, info, link, proposalId) => {
    const fgts_obj = {
        "cpf": info?.cpf * 1,
        "pan": {
            "link": [],
        },
    };
    if(link?.linkCliente){
        message.step = "finish_contract";
        message.body = `${link?.linkCliente}`;
        fgts_obj.category = "Base Clientes";
        fgts_obj.pan.link.push(link);
        message.textFunction = async() => await banktext.link(id, link?.linkCliente);
    } else {
        for (let index = 0; index < 5; index++) {
            const link = await panRequests.linkFormalization(addLeadingZeros(info?.cpf, 11), proposalId[0]?.numero_proposta, correspondentKeyPan[1]);
            if(link?.linkCliente){
                message.step = "finish_contract";
                message.body = `${link?.linkCliente}`;
                fgts_obj.category = "Base Clientes";
                fgts_obj.pan.link.push(link);
                message.textFunction = async() => await banktext.link(id, link?.linkCliente);
                return;
            }
            await delay(60000);
        }
    }
    await apiFGTS.create(fgts_obj);

};

let postProposal = async({message, id}, panValue, info, simulationObj ) => {
    let correpondent = correspondentKeyPan[1];
    if(panValue?.correpondent) correpondent = correspondentKeyPan?.find((e) => panValue?.correpondent?.name === e.name ) || correspondentKeyPan[1];
    let proposalId = await panRequests.proposalPost(simulationObj, panValue, correpondent);    
    if (proposalId?.[0]?.numero_proposta) {
        const link = await panRequests.linkFormalization(addLeadingZeros(info?.cpf, 11), proposalId[0]?.numero_proposta, correpondent);
        await linkRetriever({message, id}, info, link, proposalId);
    }
    else if(![proposalId?.message, proposalId?.detalhes, typeof searchData === "string"].every((e) => !e)) {
        if(proposalId?.detalhes) proposalId.message = proposalId?.detalhes;
        if(typeof proposalId?.message === "object" ) proposalId.message = proposalId?.message[0];
        const { continue_step, errorStep } = errorList.find((e) => testregex(proposalId?.message || proposalId, [e.messageValidator]));
        message.body = proposalId?.message;
        simulationObj.Status = message.body;
        simulationObj.valor = panValue?.valor_cliente;
        simulatedSpreadsheet(id, simulationObj, "Pan");
        if(continue_step === "timeout"){
            message.body = errorStep;
        } else {
            await errors[errorStep].validate(id, message, null, message.body, "Pan");
        }
    }
    else {
        message.step = "call_security";
        await saveDb({id, status_conversation: "EmAndamento"});
        message.status_conversation = "EmAndamento";
        simulationObj.valor = panValue?.valor_cliente;
        simulationObj.parceiro = panValue?.correspondent?.name;
        simulatedSpreadsheet(id, simulationObj, "Pan");
        message.textFunction = async() => await comercialSimulationTime(id);
    }
};

const fulfill_contractPrd = async (data_info, todaySimulation) => {
    const { id, message, info, simulationObj } = data_info;
    try {
        let bankHistory = {simulacao: todaySimulation};
        let correpondent = correspondentKeyPan[1];
        if(!bankHistory?.simulacao) {
            let simulation = await panRequests.balance(info?.cpf, 0, correpondent);
            bankHistory = simulation;
        }
        let panvalue = panValue(bankHistory); 
        delete panvalue?.simulacao?.sucesso;
        delete panvalue?.simulacao?.mensagem_erro;
        return await postProposal({message, id}, panvalue, info, simulationObj);
    } catch (error) {
        await defaultFlowError(id, message, error, "fulfill_contractPrd Pan");
    }
};

module.exports = { fulfill_contractPrd };
