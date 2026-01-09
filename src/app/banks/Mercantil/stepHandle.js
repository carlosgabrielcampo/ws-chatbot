const { testregex } = require("../../../util/util");
const { defaultError} = require("../../../util/wsutils");
const { httpRequisitions } = require("../../../api/util").utilHttp;
const {fulfill_contractPrd} = require(".");
const { wstext, multiple_hidden, multiple_not_hidden } = require("../../whatsapp/texts");
const { validators } = require("./validators");
const { clientAPI } = require("../../../api/databases/client");
const { simulatedSpreadsheet } = require("../Spreadsheets/simulatedSteps");
// const { lastSimulation } = require("../../whatsapp/bankHandler");
const { saveDb } = require("../../../api/databases/conversations");
const { lastSimulation } = require("../bankHandler");
const { savingInfoByCPF } = require("../../../util/database");
let oneDay = 1000 * 60 * 60 * 24;


const simulationObjectCreate = (info) => {
    const document = info?.client_data?.documents?.at(-1);
    const bank_data = info?.client_data?.bank_data?.at(-1);
    const address = info?.client_data?.address?.at(-1);
    const main_phone = info?.client_data?.contact?.phones?.find((e) => e.origin = "main");
    let { account_type: TipoContaBancaria, bank_code: banco, account: conta, account_digit: contaDigito, bank_branch: agencia } = bank_data;
    let { cep } = address;
    let { ddd: dddCelular, phone: numeroCelular } = main_phone;
    let { number: numero_documento, type: tipoDocumento, issuing_agency: OrgaoEmissor} = document;

    TipoContaBancaria = TipoContaBancaria.replace(" ", "");
    if(`${main_phone?.phone}`.length === 8){
        main_phone.phone = `9${main_phone?.phone}`;
    }
    if(!["ContaCorrente", "ContaPoupanca"].includes(TipoContaBancaria)){
        TipoContaBancaria = "ContaCorrente";
    }
    const postData = {
        TipoContaBancaria, banco, numero_documento, cpf: info?.cpf, dddCelular, numeroCelular, numero_endereco: "100",
        email: "nãotem@gmail.com", cep, contaDigito, conta, agencia, tipoDocumento, OrgaoEmissor,
    };
    return postData;
};

module.exports = {
    "client": {
        "valid_cpf": async(id, message, info) => {
            if(testregex(message.body, ["2","n*o"])) {
                return await defaultError(id, message);
            } else {
                const data = validators.Contatos(info);
                if(data){
                    message.step = "mercantil.contact";
                    message.textFunction = async() => await multiple_not_hidden(id, data);
                } else {
                    message.step = "client.name";
                    message.textFunction = async() => await wstext.client_name(id);
                }
            }
        },
        "name": async(id, message, info) => {
            info.client_data.name = message.body;
            const phoneNumber = id.replace("@c.us", "");
            let ddd = phoneNumber.slice("2","4") * 1;
            let phone = phoneNumber.slice("4") * 1;
            if(!info?.client_data?.contact?.phones){
                info.client_data.contact.phones = [];
            }
            let mainobj = info.client_data.contact.phones.find((e) => e.origin === "main");
            if(!info?.client_data?.contact?.phones?.at(-1) || !mainobj){
                mainobj = { origin: "main" };
                info.client_data.contact.phones.push(mainobj);
            }
            mainobj.ddd = ddd;
            mainobj.phone = phone;
            
            const data = validators.DocumentoIdentificacao(info);

            if(data){
                message.step = "mercantil.documents";
                message.textFunction = async() => await multiple_hidden(id, data);
            } else {
                message.step = "phone.valid_phone";
                message.textFunction = async() => await wstext.document_choose(id);
            }
            await savingInfoByCPF(info?.cpf, info);
        },
    },
    "phone": {
        "valid_phone": async(id, message, info) => {
            if(!info.client_data.documents){ info.client_data.documents = [{type: "", number: "", issuing_agency: "" }]; }
            !info.client_data.documents.at(-1) && info.client_data.documents.push({type: "", number: "", issuing_agency: "" });

            if(testregex(message.body, ["1","rg"])) {
                message.step = "documents.rg.rg-number"; 
                message.textFunction = async() => await wstext.document_number_rg(id);
            }
            if(testregex(message.body, ["2","cnh"])) {
                message.step = "documents.cnh.cnh-number"; 
                message.textFunction = async() => await wstext.document_number_rg(id); 
            }
            if(testregex(message.body, ["3","ctps","trabalho"])) {
                message.step = "documents.ctps.ctps-serie-number"; 
                message.textFunction = async() => await wstext.document_serial_number(id);
            }
        }
    },
    "documents": {
        "rg": {
            "rg-number": async(id, message, info) => {
                
                message.step = "documents.accept_document";           
                info.client_data.documents.at(-1).type = "RG";
                info.client_data.documents.at(-1).number = message.body;
                info.client_data.documents.at(-1).issuing_agency = "SSP";

                const { type, number } = info.client_data.documents.at(-1);
                await savingInfoByCPF(info?.cpf, info);
                message.textFunction = async() => await wstext.accept_document(id, type, number);
            },
        },
        "cnh": {
            "cnh-number": async(id, message, info) => {
                message.step = "documents.accept_document";
                info.client_data.documents.at(-1).type = "CNH";
                info.client_data.documents.at(-1).number = message.body;
                info.client_data.documents.at(-1).issuing_agency = "DETRAN";

                const {type, number} = info.client_data.documents.at(-1);
                await savingInfoByCPF(info?.cpf, info);
                message.textFunction = async() => await wstext.accept_document(id, type, number);
            },
        },
        "ctps": {
            "ctps-serie-number": async(id, message, info) => {
                message.step = "documents.accept_document";
                info.client_data.documents.at(-1).type = "CTPS";
                info.client_data.documents.at(-1).number = message.body;
                info.client_data.documents.at(-1).issuing_agency = "MTE";

                const { type, number } = info.client_data.documents.at(-1);
                await savingInfoByCPF(info?.cpf, info);
                message.textFunction = async() => await wstext.accept_document(id, type, number);
            },
        },
        "accept_document": async(id, message, info) => {
            const data = validators.EnderecoResidencial(info);
            if(data){
                // message.step = "mercantil.address";
                const dados_bancarios_data = validators.DadosBancarios(info);
                if(dados_bancarios_data){
                    message.step = "mercantil.bankInfo";
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
    },
    "address": {
        "cep": async(id, message, info) => {
            const httpReqs = await httpRequisitions();
            const add = await httpReqs.address(`${message.body}`?.match(/\d/g)?.join("")*1);
            if(!info.client_data.address) { info.client_data.address = [{cep: "", street: "", city: "", bairro: "", uf: ""}]; }
            !info.client_data.address.at(-1) && info.client_data.address.push({cep: "", street: "", city: "", bairro: "", uf: ""});
            if(add?.cep){
                info.client_data.address.at(-1).cep = `${message.body}`?.match(/\d/g)?.join("")*1;
                info.client_data.address.at(-1).street = add?.street;
                info.client_data.address.at(-1).city = add?.city;
                info.client_data.address.at(-1).bairro = add?.neighborhood;
                info.client_data.address.at(-1).uf = add?.state;
            } else {
                info.client_data.address.at(-1).cep = 88010030;
            }

            const data = validators.DadosBancarios(info);
            if(data){
                message.step = "mercantil.bankInfo";
                message.textFunction = async() => await multiple_hidden(id, data);
            } else {
                info.client_data.address.at(-1).number = message.body;
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            }

            await savingInfoByCPF(info?.cpf, info);
        },
        "cep_select": async(id, message, info) => {
            const httpReqs = await httpRequisitions();
            const add = await httpReqs.address(`${message.body}`?.match(/\d/g)?.join("")*1);
            if(!info.client_data.address) { info.client_data.address = [{cep: "", street: "", city: "", bairro: "", uf: ""}]; }
            !info.client_data.address.at(-1) && info.client_data.address.push({cep: "", street: "", city: "", bairro: "", uf: ""});
            
            if(add?.cep){
                info.client_data.address.at(-1).cep = `${message.body}`?.match(/\d/g)?.join("")*1;
                info.client_data.address.at(-1).street = add?.street;
                info.client_data.address.at(-1).city = add?.city;
                info.client_data.address.at(-1).bairro = add?.neighborhood;
                info.client_data.address.at(-1).uf = add?.state;
            } else {
                info.client_data.address.at(-1).cep = 88010030;
            }
            const data = validators.DadosBancarios(info);
            if(data){
                message.step = "mercantil.bankInfo";
                message.textFunction = async() => await multiple_hidden(id, data);
            } else {
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            }
            await savingInfoByCPF(info?.cpf, info);
        },
    },
    "bankInfo": {
        "bank": async(id, message, info) => {
            if([260, 77].includes(message.body*1)){
                info.client_data.bank_data.at(-1).bank_branch = 1;
                message.step = "bankInfo.type_account";
                await savingInfoByCPF(info?.cpf, info);
                message.textFunction = async() => await wstext.bank_account_type(id);
            } else {
                message.step = "bankInfo.agency";
                message.textFunction = async() => await wstext.bank_agency(id);
            }
        },
        "agency": async(id, message) => {
            message.step = "bankInfo.type_account";
            message.textFunction = async() => await wstext.bank_account_type(id);
        },
        "type_account": async(id, message, info) => {
            message.step = "bankInfo.account";
            if(testregex(message.body, ["1","corrente"])) { 
                info.client_data.bank_data.at(-1).account_type = "Conta Corrente"; 
            }
            else if(testregex(message.body, ["2","poupança"])) { 
                info.client_data.bank_data.at(-1).account_type = "Conta Poupanca"; 
            }
            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.bank_account(id);
        },
        "account": async(id, message, info) => {
            const {account_type, bank_code, bank_name, bank_branch} = info.client_data.bank_data.at(-1);
            let digits = `${message.body}`?.match(/\d/g)?.join("");
            let digit = digits.at(-1);
            info.client_data.bank_data.at(-1).account_digit = digit;
            info.client_data.bank_data.at(-1).account = digits.slice(0, -1);
            message.step = "bankInfo.accept_account";
            await savingInfoByCPF(info?.cpf, info);
            message.textFunction = async() => await wstext.accept_bank_account_mercantil(id, bank_code, bank_name, bank_branch, account_type, digits.slice(0, -1), digit);
        },
    },
    "are_you_sure": async(id, message, info, simulation) => {
        const simulation_mercantil = simulation?.mercantil?.simulation?.at(-1);
        let creationTime = new Date(simulation_mercantil?.createdAt);
        let todaySimulation = ((new Date() - creationTime) < oneDay && new Date().getDate() === creationTime.getDate()) ? simulation_mercantil : null;
        const simulationObj = simulationObjectCreate(info);        
        simulationObj.valor = simulation_mercantil?.valorEmprestimo;
        simulationObj.parceiro = simulation_mercantil?.correspondent?.name;
        if (message.bank === "Simulation_Mercantil"){
            message.step = "call_security";
            await wstext.pre_aproved(id);
            if(simulation_mercantil?.valorEmprestimo && todaySimulation) {
                await fulfill_contractPrd({id, message, info, simulation_mercantil: todaySimulation, simulationObj, bank: message.bank});
            } else {
                simulatedSpreadsheet(id, simulationObj, "Mercantil");
            }
        } else if (!simulation_mercantil?.valorEmprestimo){
            message.step = "call_security";
            message.textFunction = async() => await wstext.pre_aproved(id);
            simulatedSpreadsheet(id, simulationObj, "Mercantil");
        } else if (simulation_mercantil?.valorEmprestimo >= 5000) {
            message.step = "documentFiles.document_1"; 
            message.textFunction = async() => await wstext.documents_one(id);
        } else {
            message.step = "call_security";
            await wstext.proposal_completed(id, message.bank);
            await fulfill_contractPrd({id, message, info, simulation_mercantil, simulationObj});
        }
    },
    "documentFiles":{
        "document_1": async(id, message) => {
            message.step = "documentFiles.document_2";
            message.textFunction = async() => await wstext.documents_two(id);
        },
        "document_2": async(id, message) => {
            message.step = "documentFiles.document_3";
            message.textFunction = async() => await wstext.documents_three(id);
        },
        "document_3": async(id, message) => {
            message.step = "call_security";
            await saveDb({id, status_conversation: "EmAndamento"});
            message.status_conversation = "EmAndamento";
            message.textFunction = async() => await wstext.pre_aproved(id);
        },
    },
    "mercantil": {
        "contact": async(id, message, info) => {
            const data = validators.DocumentoIdentificacao(info);
            if(data){
                message.step = "mercantil.documents";
                message.textFunction = async() => await multiple_hidden(id, data);
            } else {
                message.step = "phone.valid_phone";
                message.textFunction = async() => await wstext.document_choose(id);
            }
        },
        "documents": async(id, message, info) => {
            const data = validators.EnderecoResidencial(info);
            if(data){
                const dados_bancarios_data = validators.DadosBancarios(info);
                if(dados_bancarios_data){
                    message.step = "mercantil.bankInfo";
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
                message.step = "mercantil.bankInfo";
                message.textFunction = async() => multiple_not_hidden(id, data);
            } else {
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            }
        },
        "bankInfo": async(id, message, info) => {
            const data = validators.DadosBancarios(info);

            if(data){
                message.step = "mercantil.bankInfo";
                message.textFunction = async() => await multiple_not_hidden(id, data);
            } else {
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            }
        },
    },
};