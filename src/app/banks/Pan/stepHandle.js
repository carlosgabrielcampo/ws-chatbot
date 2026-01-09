const { validTime, defaultError, defaultFlowError } = require("../../../util/wsutils");
const { testregex, isValidDate, addLeadingOnes, addLeadingZeros } = require("../../../util/util");
const { fulfill_contractPrd } = require("./index");
const { httpRequisitions } = require("../../../api/util").utilHttp;
const { wstext, multiple_not_hidden, multiple_hidden } = require("../../whatsapp/texts");
const { validators } = require("./validator");
const { simulatedSpreadsheet } = require("../Spreadsheets/simulatedSteps");
const { saveDb } = require("../../../api/databases/conversations");
const { lastSimulation } = require("../bankHandler");
const { fulfill_contractPrdC6 } = require("../C6");
const { savingInfoByCPF } = require("../../../util/database");
let oneDay = 1000 * 60 * 60 * 24;
const simulationObjectCreate = (info) => {
    let bank_data = info?.client_data?.bank_data?.at(-1) || {};
    let address = info?.client_data?.address?.at(-1) || {};
    let mainphone = info?.client_data?.contact?.phones?.find((e) => e.origin = "main") || {};
    let rg = info?.client_data?.documents?.find((e) => e.type = "RG") || {};

    let { account_type: TipoContaBancaria, bank_code: banco, account: conta, code_cef: CodOperCEF, account_digit: contaDigito, bank_branch: agencia } = bank_data;
    let { city: cidade, cep, street: logradouro, number: numero_endereco, neighborhood: bairro, state: uf } = address;
    let { birth_date: data_nascimento, mother_name: nome_mae, nationality: nacionalidade, name: nome } = info.client_data;
    let { ddd: dddCelular, phone: numeroCelular } = mainphone;
    let { number: numero_documento } = rg;

    data_nascimento = isValidDate(new Date(data_nascimento)) ? new Date(data_nascimento) : new Date(validTime(data_nascimento, true));

    const ano_documento = new Date(data_nascimento)?.getFullYear();
    const mes_documento = addLeadingZeros(new Date(data_nascimento)?.getMonth() + 1, 2); 
    const dia_documento = addLeadingZeros(new Date(data_nascimento)?.getDate(), 2);
    const data_completa = `${dia_documento}-${mes_documento}-${ano_documento}`;
    if(`${cep}`.length < 8) cep = `${addLeadingOnes(`${cep}`, 8)}`*1;
    const contract_obj = {
        TipoContaBancaria, banco, data_nascimento: data_completa, numero_documento, 
        nome_mae, cpf: info?.cpf, cidade, nome, dddCelular, numeroCelular, 
        logradouro, numero_endereco, nacionalidade, bairro, 
        uf, cep, CodOperCEF, contaDigito, conta, agencia
    };
    return contract_obj;
};

module.exports = {
    "client": {
        "valid_cpf": async (id, message, info) => {
            if (testregex(message.body, ["2", "n*o"])) {
                return await defaultError(id, message);
            } else {
                const data = validators.Contatos(info);
                if(data){
                    message.step = "pan.contact";
                    message.textFunction = async() => await multiple_hidden(id, data);
                } else {
                    message.step = "client.name";
                    message.textFunction = async() => await wstext.client_name(id);
                }
            }
        },
        "name": async (id, message, info) => {
            info.client_data.name = message.body;
            message.step = "client.mom-name";
            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.client_momname(id);
        },
        "mom-name": async (id, message, info) => {
            info.client_data.mother_name = message.body;
            message.step = "client.birth-date";

            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.client_birth_date(id);
        },
        "birth-date": async (id, message, info) => {
            info.client_data.birth_date = await validTime(message.body, true);
            info.client_data.nationality = "BRASILEIRA";
            message.step = "documents.rg.rg-number";
            if(!info.client_data.documents){ info.client_data.documents = [{type: "", number: "", issuing_agency: "" }]; }
            !info.client_data.documents.at(-1) && info.client_data.documents.push({type: "", number: "", issuing_agency: "" });
            
            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.client_document_generic(id);
        },
    },
    "documents": {
        "rg": {
            "rg-number": async (id, message, info) => {

                info.client_data.documents.at(-1).type = "RG";
                info.client_data.documents.at(-1).number = message.body;
                info.client_data.documents.at(-1).issuing_agency = "SSP";

                let data = validators.EnderecoResidencial(info);
                if(data){
                    const dados_bancarios_data = validators.DadosBancarios(info);
                    if(dados_bancarios_data){
                        message.step = "pan.bankInfo";
                        message.textFunction = async() => multiple_not_hidden(id, dados_bancarios_data);
                    } else {
                        message.step = "bankInfo.bank";
                        message.textFunction = async() => await wstext.bank_code(id);
                    }
                } else {
                    message.step = "address.cep";
                    message.textFunction = async() => await wstext.address_cep(id);
                }
                await savingInfoByCPF(info?.cpf, info);
            },
        },
    },
    "address": {
        "cep": async (id, message, info) => {
            if(!info.client_data.address) { info.client_data.address = [{cep: "", street: "", city: "", bairro: "", uf: ""}]; }
            !info.client_data.address.at(-1) && info.client_data.address.push({cep: "", street: "", city: "", bairro: "", uf: ""});
            const address = info.client_data.address;
            try {
                const httpReqs = await httpRequisitions();
                const add = await httpReqs.address(`${message.body}`?.match(/\d/g)?.join("")*1);

                if (add?.cep) {
                    address.at(-1).cep = `${message.body}`?.match(/\d/g)?.join("")*1;
                    address.at(-1).street = add?.street;
                    address.at(-1).city = add?.city;
                    address.at(-1).neighborhood = add?.neighborhood;
                    address.at(-1).state = add?.state;
                    address.at(-1).number = "100";
                } else {
                    address.at(-1).cep = "88101170";
                    address.at(-1).number = "600";
                    address.at(-1).state = "SC";
                    address.at(-1).city = "São José";
                    address.at(-1).neighborhood = "Campinas";
                    address.at(-1).street = "Rua Victor Meirelles";
                }

                const data = validators.DadosBancarios(info);
                if(data){
                    message.step = "pan.bankInfo";
                    message.textFunction = async() => await multiple_not_hidden(id, data);
                } else {
                    info.client_data.address.at(-1).number = message.body;
                    message.step = "bankInfo.bank";
                    message.textFunction = async() => await wstext.bank_code(id);
                }
                await savingInfoByCPF(info?.cpf, info);
            } catch (error) {
                await defaultFlowError(id, message, error, "cep");
            }
        },
        "cep_select": async (id, message, info) => {
            const httpReqs = await httpRequisitions();
            const add = await httpReqs.address(`${message.body}`?.match(/\d/g)?.join("")*1);
            const address = info.client_data.address;
            if(add?.cep){
                address.at(-1).cep = `${message.body}`?.match(/\d/g)?.join("")*1;
                address.at(-1).street = add?.street;
                address.at(-1).city = add?.city;
                address.at(-1).bairro = add?.neighborhood;
                address.at(-1).uf = add?.state;
                address.at(-1).number = "100";
            } else {
                address.at(-1).cep = "88101170";
                address.at(-1).number = "600";
                address.at(-1).state = "SC";
                address.at(-1).city = "São José";
                address.at(-1).neighborhood = "Campinas";
                address.at(-1).street = "Rua Victor Meirelles";
            }
            const data = validators.DadosBancarios(info);
            if(data){
                message.step = "pan.bankInfo";
                message.textFunction = async() => await multiple_not_hidden(id, data);
            } else {
                info.client_data.address.at(-1).number = message.body;
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            }
            await savingInfoByCPF(info?.cpf, info);
        },
    },
    "bankInfo": {
        "bank": async (id, message) => {
            if (message.body === "104") {
                message.step = "bankInfo.operCEF";
                message.textFunction = async() => await wstext.bank_op_cef(id);
            } else {
                message.step = "bankInfo.agency";
                message.textFunction = async() => await wstext.bank_agency(id);
            }
        },
        "operCEF": async (id, message, info) => {
            message.step = "bankInfo.agency";
            if (testregex(message.body, ["corrente", "001"])) {
                info.client_data.bank_data.at(-1).code_cef = "001"; 
            }
            if (testregex(message.body, ["simples", "002"])) {
                info.client_data.bank_data.at(-1).code_cef = "002"; 
            }
            if (testregex(message.body, ["13", "poupan*a", "013"])) {
                info.client_data.bank_data.at(-1).code_cef = "013"; 
            }
            if (testregex(message.body, ["23", "f*cil", "023"])) {
                info.client_data.bank_data.at(-1).code_cef = "023"; 
            }
            if (testregex(message.body, ["32", "investimento", "032"])) {
                info.client_data.bank_data.at(-1).code_cef = "032"; 
            }
            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.bank_agency(id);
        },
        "agency": async (id, message) => {
            message.step = "bankInfo.type_account_pan";
            message.textFunction = async() => await wstext.bank_account_type_pan(id);
        },
        "type_account_pan": async (id, message, info) => {
            message.step = "bankInfo.account";
            if (testregex(message.body, ["1", "corrente"])) { 
                info.client_data.bank_data.at(-1).account_type = "CONTA_CORRENTE_INDIVIDUAL"; 
            }
            if (testregex(message.body, ["2", "poupança"])) { 
                info.client_data.bank_data.at(-1).account_type = "CONTA_POUPANCA_INDIVIDUAL"; 
            }
            if (testregex(message.body, ["4"])) { 
                info.client_data.bank_data.at(-1).account_type = "CONTA_CORRENTE_CONJUNTA"; 
            }
            if (testregex(message.body, ["5"])) { 
                info.client_data.bank_data.at(-1).account_type = "CONTA_POUPANCA_CONJUNTA"; 
            }
            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.bank_account(id);
        },
        "account": async (id, message, info) => {
            const { account_type, bank_code, bank_name, bank_branch } = info.client_data.bank_data.at(-1);
            let digits = `${message.body}`?.match(/\d/g)?.join("");
            let digit = digits.at(-1);

            info.client_data.bank_data.at(-1).account_digit = digit;
            info.client_data.bank_data.at(-1).account = digits.slice(0, -1);
            message.step = "bankInfo.accept_account";
            
            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.accept_bank_account(id, bank_code, bank_name, bank_branch, account_type, message.body);
        },
    },
    "are_you_sure": async(id, message, info, simulation) => {
        const simulationObj = simulationObjectCreate(info);
        try {
            const lastsimulation = simulation?.pan?.simulation?.at(-1);
            const simulation_pan = lastsimulation?.condicoes_credito[0];
            simulationObj.valor = simulation_pan?.valor_cliente;
            simulationObj.parceiro = lastsimulation?.correspondent?.name;

            if(message.bank === "Simulation_Pan"){
                let creationTime = new Date(lastsimulation?.createdAt);
                let todaySimulation = ((new Date() - creationTime) < oneDay && new Date().getDate() === creationTime.getDate()) ? lastsimulation : null;
                await  wstext.pre_aproved(id);
                message.step = "call_security";
                if(simulation_pan.valor_cliente && todaySimulation){
                    await fulfill_contractPrd({id, message, info, simulationObj}, todaySimulation);
                } else {
                    simulatedSpreadsheet(id, simulationObj, "Pan");
                }
            } else if(["Simulation_C6", "C6"].includes(message.bank)) {
                let c6Simulation = simulation?.c6?.simulation?.at(-1);
                let creationTime = new Date(c6Simulation?.createdAt);
                let todaySimulation = ((new Date() - creationTime) < oneDay && new Date().getDate() === creationTime.getDate()) ? c6Simulation : null;
                message.step = "call_security";
                const simulated = await lastSimulation(info?.cpf);

                simulationObj.valor = simulated?.net_amount;
                simulationObj.parceiro = simulated?.correspondent?.name;

                if(c6Simulation?.net_amount && todaySimulation){
                    await wstext.proposal_completed(id, "C6");
                    await fulfill_contractPrdC6({id, message, info, simulationObj}, todaySimulation);
                } else {
                    message.textFunction = async() => await wstext.pre_aproved(id);
                    simulatedSpreadsheet(id, simulationObj, "C6");
                }
            }  else if(!simulation_pan.valor_cliente){
                message.step = "call_security";
                await saveDb({id, status_conversation: "EmAndamento"});
                message.status_conversation = "EmAndamento";
                message.textFunction = async() => await wstext.pre_aproved(id);
                simulatedSpreadsheet(id, simulationObj, "Pan");

            } else if (simulation_pan.valor_cliente >= 5000) {
                message.status_conversation = "EmAndamento";
                await saveDb({id, status_conversation: "EmAndamento"});
                message.step = "documentFiles.document_1"; 
                message.textFunction = async() => await wstext.documents_one(id);
                
            }  else {
                message.step = "call_security";
                await wstext.proposal_completed(id, message.bank);
                await fulfill_contractPrd({id, message, info, simulationObj});
            }
        } catch (error){
            simulatedSpreadsheet(id, simulationObj, "Pan");
        }
    },
    "documentFiles": {
        "document_1": async (id, message) => {
            message.step = "documentFiles.document_2";
            message.textFunction = async() => await wstext.documents_two(id);
        },
        "document_2": async (id, message) => {
            message.step = "documentFiles.document_3";
            message.textFunction = async() => await wstext.documents_three(id);
        },
        "document_3": async (id, message) => {
            message.step = "call_security";
            await saveDb({id, status_conversation: "EmAndamento"});
            message.status_conversation = "EmAndamento";
            message.textFunction = async() => await wstext.pre_aproved_pan(id);
        },
    },
    "pan": {
        "contact": async(id, message, info) => {
            const data = validators.EnderecoResidencial(info);
            if(data){
                const dados_bancarios_data = validators.DadosBancarios(info);
                if(dados_bancarios_data){
                    message.step = "pan.bankInfo";
                    message.textFunction = async() => multiple_not_hidden(id, dados_bancarios_data);
                } else {
                    message.step = "bankInfo.bank";
                    message.textFunction = async() => await wstext.bank_code(id);
                }
            } else {
                message.step = "address.cep";
                message.textFunction = async() => await wstext.address_cep(id);
            }
        },
        "address": async(id, message, info) => {
            const data = validators.DadosBancarios(info);
            if(data){
                message.step = "pan.bankInfo";
                message.textFunction = async() => await multiple_not_hidden(id, data);
            } else {
                info.client_data.address.at(-1).number = message.body;
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            }
        },
        "bankInfo": async(id, message, info) => {
            const data = validators.DadosBancarios(info);
            if(data){
                message.step = "pan.bankInfo";
                message.textFunction = async() => await multiple_not_hidden(id, data);
            } else {
                info.client_data.address.at(-1).number = message.body;
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            }
        }
    }
};
