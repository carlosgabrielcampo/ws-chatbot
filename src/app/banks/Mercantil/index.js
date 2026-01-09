require("dotenv").config();
const { apiRequests} = require("../../../api/banks/mercantil");
const { banktext, wstext } = require("../../whatsapp/texts");
const { delay, timeoutPromise } = require("../../../util/util");
const { apiFGTS } = require("../../../api/databases/fgts_database");
const { responseHandle } = require("../../whatsapp/errorHandle");
const { contador } = require("../../../util/contador");
const { simulatedSpreadsheet } = require("../Spreadsheets/simulatedSteps");
const { correspondentKeyMercantil } = require("../../keys/apiKeys");
const { saveDb } = require("../../../api/databases/conversations");
const { defaultFlowError } = require("../../../util/wsutils");

const mercantilBuild = async(data_info, bankHistory, prd, obj_correp) => {
    const { cpf } = data_info;
    let id = `${cpf * 1}`;
    try {
        let api = await apiRequests(cpf * 1, obj_correp || correspondentKeyMercantil[1]);
        let balance = await api.balance(prd);
        let id = `${cpf * 1}`;
        if(balance?.message){
            bankHistory = balance;
        } else if(balance?.parcelas) {
            bankHistory = await api.simulation(balance?.parcelas, prd);
            contador({id, name: "balance_fgts", success: true, message: `${balance?.valorTotal}`,  bank: "Mercantil" });
            bankHistory?.message
                ?  contador({id, name: "simulation_fgts", message: bankHistory?.message, success: false,  bank: "Mercantil" })
                :  contador({id, name: "simulation_fgts", message: `${bankHistory?.simulacao?.valorEmprestimo}`, success: true,  bank: "Mercantil" });
        } else {
            bankHistory = undefined;
            contador({id, name: "simulation_fgts", message: bankHistory?.message, success: false,  bank: "Mercantil" });
        }
        return bankHistory;
    } catch(error){
        await defaultFlowError(id, {}, error, "mercantilBuild");
    }
};

const fulfill_contractPrd = async(data_info) => {
    const { id, message, info, simulation_mercantil, simulationObj, bank: banco } = data_info;
    try {
        let bank = "Mercantil";
        const fgts_obj = {
            "cpf": info?.cpf * 1,
            "mercantil": {
                "link": [],
            },
        };
        let externalLink = null;

        const mercantilAPI = await apiRequests(info?.cpf, simulation_mercantil?.correspondent || correspondentKeyMercantil[1]);
        let proposalPost = await mercantilAPI.proposalPost(simulation_mercantil.id_code, simulationObj);
        if(proposalPost?.errors?.length && proposalPost?.errors[0]?.message){
            contador({id: info?.cpf, name: "proposal_fgts", message: proposalPost?.errors[0]?.message, success: false,  bank });
            return await responseHandle({ id, message, info }, {message: proposalPost?.errors[0]?.message}, true);
        }
        if(proposalPost?.id){
            contador({id: info?.cpf, name: "proposal_fgts", message: proposalPost.id, success: true,  bank });
            for(let i = 0; i < 15; i += 1){
                let status = await mercantilAPI.contractStatus(proposalPost.id, info?.cpf);
                contador({id: info?.cpf, name: "status_proposal", message: status?.situacaoProposta, success: false,  bank });
                if(status?.situacaoProposta === "EmAndamento"){
                    for(let i = 0; i < 5; i += 1){
                        contador({id: info?.cpf, name: "status_proposal", message: status?.situacaoProposta, success: true,  bank });
                        externalLink = await mercantilAPI.externalLink(proposalPost.id);
                        if(externalLink?.errors?.length && externalLink?.errors[0]?.message){
                            contador({id: info?.cpf, name: "link_fgts", message: externalLink?.errors[0]?.message, success: false,  bank });
                            fgts_obj.mercantil.link.push({mensagem: "Erro na digitação da proposta", erro: proposalPost});
                            await apiFGTS.create(fgts_obj);
                            return await responseHandle({ id, message, info }, {message: externalLink?.errors[0]?.message}, true);
                        }
                        if(externalLink.linkEncurtado) {
                            contador({id: info?.cpf, name: "link_fgts", message: externalLink.linkEncurtado, success: true,  bank });
                            fgts_obj.mercantil.link.push(externalLink);
                            await apiFGTS.create(fgts_obj);
                            message.step = "finish_contract";
                            message.body = `${externalLink.linkEncurtado}`;
                            message.textFunction = async() => await banktext.link(id, externalLink.linkEncurtado);
                            fgts_obj.category = "Base Clientes";
                            return;
                        }
                    }
                }
                if(["Pendente", "Reprovada"].includes(status?.situacaoProposta)){
                    if(status?.errors?.length && status?.errors[0]?.message){
                        contador({id: info?.cpf, name: "link_fgts", message: externalLink?.errors[0]?.message, success: false,  bank });
                        fgts_obj.mercantil.link.push({mensagem: "Erro na digitação da proposta", erro: proposalPost});
                        await apiFGTS.create(fgts_obj);
                        return await responseHandle({ id, message, info }, {message: status?.errors[0]?.message}, true);
                    }
                }
                if(["Integrada"].includes(status?.situacaoProposta)){
                    message.step = "low_value";
                    message.textFunction = async() => await wstext.integrada(id);
                    return;
                }
                await delay(240000);
            }
        }
        message.step = "call_security";
        await saveDb({id, status_conversation: "EmAndamento"});
        message.status_conversation = "EmAndamento";
        fgts_obj.mercantil.link.push({mensagem: "Erro na digitação da proposta", erro: proposalPost});
        simulationObj.valor = simulation_mercantil?.valorEmprestimo;
        simulatedSpreadsheet(id, simulationObj, "Mercantil");
        await apiFGTS.create(fgts_obj);
        if(banco !== "Simulation_Mercantil") message.textFunction = async() => await banktext.error_link(id, simulation_mercantil?.id_code);
    } catch(error) {
        await defaultFlowError(id, message, error, "fulfill_contractPrd Mercantil");
    }
};

module.exports = {
    fulfill_contractPrd,
    mercantilBuild
};

