const { c6Requests } = require("../../../api/banks/c6");
const { apiRequests } = require("../../../api/banks/mercantil");
const { panRequests } = require("../../../api/banks/pan");
const { saveDb } = require("../../../api/databases/conversations");
const { getRowsFunc } = require("../../../api/googleAPI");
const { contador } = require("../../../util/contador");
const { readFile } = require("../../../util/fileHandle");
const { addLeadingZeros, delay, testregex, timeoutPromise, jsonFromGoogleSpreadsheet, hour_validation } = require("../../../util/util");
const { correspondentKeyPan, correspondentKeyMercantil, correspondentKeyC6 } = require("../../keys/apiKeys");
const { panValues, errorHandle} = require("../../whatsapp/errorHandle");
const { arrayNmbsCreate } = require("../../whatsapp/phoneArray");
const { banktext } = require("../../whatsapp/texts");
const { mercantilBuild } = require("../Mercantil");
const { lastSimulation } = require("../bankHandler");
const { error_handle } = require("./error_handle");
const { notDuplicatedCpf } = require("./notDuplicatedCpf");
let defaultArrayToRetry = [
    "Ocorreu um erro na chamada na chamada da API de Consulta Saldo FGTS. Mensagem original: Specified cast is not valid.",
    "Autorizações digitais não encontradas com o identificador da proposta informado.",
    "Valor principal da parcela inválido",
    "\"Não foi possível consultar o saldo FGTS. Tente novamente mais tarde\"",
    "","#N/A","#REF", "default","timeout", undefined,
    "Authorization has been denied for this request."
];
let contract_spreadsheet_id = "1xzdCDXGNbmZ58bNUf-x3HRUpgXrgy1enyXa_tMz_468";
let timeoutinterval = 1200000;
const errorList = [
    {messageValidator: "Trabalhador NÃO possui saldo disponível que permita realizar Operações Fiduciárias.", errorStep: "value", continue_step: false},
    {messageValidator: "indisponibilidade|simulacaoFGTS timed-out and fallback failed.|Ocorreu um erro na chamada na chamada da API de Consulta Saldo FGTS. Mensagem original: Specified cast is not valid.|backend-server|O Valor Principal de parcelas acumuladas acumuladas", errorStep: "default", continue_step: "timeout"},
    {messageValidator: "Autorizações digitais não encontradas com o identificador da proposta informado.|Dados da simulação não encontrada com o identificador informado", errorStep: "cpf", continue_step: false},
    {messageValidator: "Banco ou Agência inválido.", errorStep: "bank", continue_step: false},
    {messageValidator: "Tipo de Logradouro informado é inválido.", errorStep: "cep", continue_step: false},
    {messageValidator: "Informe o número da conta|Informe o dígito verificador da conta|Número da Agência inválida|Tipo de conta bancária informada é inválida", errorStep: "account", continue_step: false},
    {messageValidator: "The field Cpf is invalid.|DadoCadastral.CPF", errorStep: "invalid_cpf", continue_step: false},
    {messageValidator: "Número do telefone deve conter 9 caracteres.|ddd tem que estar preenchido|numero tem que estar preenchido", errorStep: "phone", continue_step: false },
    {messageValidator: "Informe o Email.", errorStep: "email", continue_step: false},
    {messageValidator: "numero_documento tem que estar preenchido", errorStep: "document_pan", continue_step: false},
    {messageValidator: "Informe um tipo de documento válido.|O número do documento de identificação é obrigatório.|O órgão emissor do documento de identificação é obrigatório|A data de emissão do documento de identificação é obrigatória.", errorStep: "document", continue_step: false},
    {messageValidator: "Este banco possui restrição para liberação de recurso.|Campo NumeroBanco com tamanho acima do máximo permitido 3|DigitoContaCorrente", errorStep: "bank", continue_step: false},
    {messageValidator: "Cep informado não encontrado.|Informe o número da residência do cliente.|O número da residência do cliente deve conter menos que 11 caracteres.|Campo UF com tamanho acima do máximo permitido 2", errorStep: "cep", continue_step: false},
    {messageValidator: "data_nascimento tem que estar preenchido|LocalDate", errorStep: "birth_date", continue_step: false},
    {messageValidator: "Bloqueio por condição de retorno da análise de risco no SIF", errorStep: "error_mercantil", continue_step: false},
    {messageValidator: "Operação não permitida antes de", errorStep: "birthday", continue_step: false},
    {messageValidator: "aniversário|O Cpf informado não possui Saque aniversário disponivel", errorStep: "blocked", continue_step: false},
    {messageValidator: "TED", errorStep: "bank", continue_step: false },
    {messageValidator: "nome_mae tem que estar preenchido", errorStep: "mother_name", continue_step: false},
    {messageValidator: "nacionalidade tem que estar preenchido", errorStep: "nationality", continue_step: false},
    {messageValidator: "nome tem que estar preenchido", errorStep: "invalid_name", continue_step: false },
    {messageValidator: "Existe uma Operação Fiduciária em andamento.", errorStep: "pending", continue_step: false},
    {messageValidator: "perturbe", errorStep: "disturb", continue_step: false},
    {messageValidator: "politicas", errorStep: "politics", continue_step: false },
    {messageValidator: "receita|federal", errorStep: "irs", continue_step: false },
    {messageValidator: "Caixa", errorStep: "cef", continue_step: false },
    {messageValidator: "exposta", errorStep: "exposed", continue_step: false },
    {messageValidator: "saldo|parcela|valor|PARCELAS", errorStep: "value", continue_step: false},   
    {messageValidator: "fiduciária", errorStep: "trustee", continue_step: true},
    {messageValidator: "18", errorStep: "minor", continue_step: false},
    {messageValidator: "Cpf", errorStep: "cpf", continue_step: false},
    {messageValidator: "Fgts", errorStep: "default", continue_step: false},
    {messageValidator: "", errorStep: "default", continue_step: "timeout"}
];
const spreadSheetFiller = async(message, CPF, correspondent) => {
    if(message?.body){
        const linesSimulated = (await getRowsFunc(contract_spreadsheet_id, "SIMULADOS")).data.values;
        let client_line = linesSimulated.find((array) => array[0] == CPF);
        if(defaultArrayToRetry.includes(client_line?.[1])){
            message?.body && await notDuplicatedCpf(contract_spreadsheet_id, [CPF, message?.body, correspondent], "Página5");
            message?.textFunction && message?.textFunction();
        }
    }
};
const searchDataMessageHandle = async ({searchData, id, message, servidor}) => {
    error_handle(searchData);
    const { continue_step, errorStep } = errorList.find((e) => testregex(searchData?.message || searchData, [e?.messageValidator]));
    message.body = searchData?.message;
    console.info({errorStep});
    if(continue_step === "timeout"){
        message.body = errorStep;
    } else {
        await errorHandle(searchData, {id, message}, true, "Pan", servidor);
    }
};
const proposalTimeValidation = (functionToExecute, time, bddFunction) => new Promise((resolve) => {
    if(!hour_validation(...time)) resolve(functionToExecute);
    else resolve(bddFunction);
});
const functionSelector = (searchData) => {
    if(searchData?.simulacao?.valorEmprestimo) searchData.function = async(data) => await mercantilPost(data);
    else if(searchData?.parcelas) searchData.function = async(data) => await panPost(data);
    else if(searchData?.simulacao?.condicoes_credito) searchData.function = async(data) => { 
        data.searchData.message = "Sem Saldo";
        await searchDataMessageHandle(data);
    };
    else if(searchData?.simulacao?.net_amount) searchData.function = async(data) => await c6Post(data);
    else searchData.function = async(data) => await searchDataMessageHandle(data);
};
const readSpreadSheetLines = async({line, correspondentKey, index, dataFunction, phoneArray}) => {
    let {telefoneCliente, chatbot, CPF, bancoSimulado, parceiro,  uf, cidade, logradouro, numero_endereco, bairro } = line;
    let address = { uf, cidade, logradouro, numero_endereco, bairro };
    Object.entries(address).map((e) =>{if(!e[1]) line[e[0]] = e[0];});
    const servidor = `http://${arrayNmbsCreate(phoneArray).chatbotArr.find((e) => e.bot === chatbot)?.host}`;
    const id = `${telefoneCliente}@c.us`;
    line.cpf = CPF;
    const findCorrespondent = correspondentKey.find((e) => e.name === parceiro);
    let correspondent = findCorrespondent || correspondentKey[index % correspondentKey.length];
    const searchData = await dataFunction({id, CPF, correspondent});
    let message = {bank: bancoSimulado};
    return { servidor, id, correspondent, searchData, message, CPF };
};
const proposalArray = async(bank) => {
    const lines = (await getRowsFunc(contract_spreadsheet_id, "SIMULADOS")).data.values;
    const linesSimulated = (await getRowsFunc(contract_spreadsheet_id, "Página5")).data.values;
    let obj_contract_arr = jsonFromGoogleSpreadsheet(lines).filter((e) => defaultArrayToRetry.includes(e.Status));
    const simulated_contract_arr = jsonFromGoogleSpreadsheet(linesSimulated).filter((e) => !defaultArrayToRetry.includes(e.Status));
    obj_contract_arr = obj_contract_arr.filter((ele) => !simulated_contract_arr.map((e) => e.CPF).includes(ele.CPF));
    if(obj_contract_arr?.length) return obj_contract_arr.filter((e) => e.bancoSimulado === bank);
};

const mercantilPost = async({lineObj: {id, cpf, servidor}, simulation_mercantil, correspondent, simulationObj, message}) => {
    const mercantilAPI = await apiRequests(cpf, correspondent);
    simulationObj.banco = simulationObj.banco*1;
    let proposalPost = await mercantilAPI.proposalPost(simulation_mercantil?.simulacao?.id_code, simulationObj);
    console.info("mercantilPost", {proposalPost});
    if(proposalPost?.errors?.length && proposalPost?.errors[0]?.message){ message.body = proposalPost?.errors[0]?.message; }
    if(proposalPost?.id){
        for(let i = 0; i < 5; i += 1){
            let status = await mercantilAPI.contractStatus(proposalPost.id, cpf);
            if(status?.situacaoProposta === "EmAndamento"){
                contador({id: cpf, name: "status_proposal", message: JSON.stringify(status), success: true, bank: "Mercantil" });
                let externalLink = await mercantilAPI.externalLink(proposalPost.id, cpf);
                message.body = "EmAndamento";
                message.status_conversation = "EmAndamento";
                if(externalLink?.errors?.length && externalLink?.errors[0]?.message){
                    contador({id: cpf, name: "link_fgts", message: JSON.stringify(externalLink), success: false, bank: "Mercantil" });
                    return message.body = externalLink?.errors[0]?.message;
                }
                if(externalLink.linkEncurtado) {
                    contador({id: cpf, name: "link_fgts", message: JSON.stringify(externalLink), success: true, bank: "Mercantil" });
                    message.step = "finish_contract";
                    message.body = `${externalLink.linkEncurtado}`;
                    message.textFunction = async() => await banktext.link(id, externalLink.linkEncurtado, servidor);
                    return await saveDb({id, message});
                }
            }
            await delay(10000);
            if(["Pendente", "Reprovada"].includes(status?.situacaoProposta)){
                contador({id: cpf, name: "status_proposal", message: JSON.stringify(status), success: false, bank: "Mercantil" });
                if(status?.errors?.length && status?.errors[0]?.message){
                    message.body = status?.errors[0]?.message;
                }
            }
        }
    }
};
const panPost = async({lineObj: {cpf, id, servidor}, simulationObj, searchData, message, correspondent}) => {
    console.info("panPost", {searchData});
    let proposalId = await panRequests.proposalPost(simulationObj, searchData, correspondent);
    if (proposalId?.[0]?.numero_proposta) {
        contador({id: cpf, name: "proposal_fgts", message: JSON.stringify(proposalId), success: true, bank: "Pan" });
        message.body = proposalId?.[0]?.numero_proposta;
        let link = await panRequests.linkFormalization(addLeadingZeros(cpf, 11), proposalId[0]?.numero_proposta, correspondent);
        if(link?.linkCliente){
            message.step = "finish_contract";
            message.body = `${link?.linkCliente}`;
            message.textFunction = async() => await banktext.link(id, link?.linkCliente, servidor);
            await saveDb({id, message});
            contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: true, bank: "Pan" });
        } else {
            contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: false, bank: "Pan" });
            for (let index = 0; index < 5; index++) {
                link = await panRequests.linkFormalization(addLeadingZeros(cpf, 11), proposalId[0]?.numero_proposta, correspondent);
                if(link?.linkCliente){
                    message.step = "finish_contract";
                    message.body = `${link?.linkCliente}`;
                    message.textFunction = async() => await banktext.link(id, link?.linkCliente, servidor);
                    await saveDb({id, message});
                    return contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: true, bank: "Pan" });
                }
                await delay(60000);
                contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: false, bank: "Pan" });
            }
        }
    } else {
        if(![proposalId?.message, proposalId?.detalhes, typeof proposalId === "string"].every((e) => !e)) {
            if(proposalId?.detalhes) proposalId.message = proposalId?.detalhes;
            if(typeof proposalId.message === "object" ) proposalId.message = proposalId?.message[0];
            message.body = proposalId.message;
        }
        contador({id: cpf, name: "proposal_fgts", message: JSON.stringify(proposalId), success: false, bank: "Pan" });
    }
};
const c6Post = async({lineObj: {cpf, id, servidor}, simulationObj, searchData, message, correspondent}) => {
    let proposalId = await c6Requests().proposalPost(simulationObj, searchData.simulacao, correspondent);
    if (proposalId?.proposal_number) {
        contador({id: cpf, name: "proposal_fgts", message: JSON.stringify(proposalId), success: true, bank: "Pan" });
        message.body = proposalId?.proposal_number;
        let link = await c6Requests().linkFormalization(proposalId?.proposal_number, correspondent);
        if(link?.url){
            message.step = "finish_contract";
            message.body = `${link?.url}`;
            message.textFunction = async() => await banktext.link(id, link?.url, servidor);
            await saveDb({id, message});
            contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: true, bank: "C6" });
        } else {
            contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: false, bank: "C6" });
            for (let index = 0; index < 5; index++) {
                link = await c6Requests().linkFormalization(proposalId?.proposal_number, correspondent);
                if(link?.url){
                    message.step = "finish_contract";
                    message.body = `${link?.url}`;
                    message.textFunction = async() => await banktext.link(id, link?.url, servidor);
                    await saveDb({id, message});
                    return contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: true, bank: "C6" });
                }
                await delay(110000);
                contador({id: cpf, name: "link_fgts", message: JSON.stringify(link), success: false, bank: "C6" });
            }
        }
    } else {
        if(![proposalId?.message, proposalId?.details, typeof proposalId === "string"].every((e) => !e)) {
            if(proposalId?.details) proposalId.message = proposalId?.details;
            if(typeof proposalId.message === "object" ) proposalId.message = proposalId?.message[0];
            message.body = proposalId.message;
        }
        contador({id: cpf, name: "proposal_fgts", message: JSON.stringify(proposalId), success: false, bank: "C6" });
    }
};

const mercantilContract = async({bank}) => {
    const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
    const obj_arr = await proposalArray(bank);
    console.info({mercantil: obj_arr?.length});
    await Promise.all(
        [ timeoutPromise(timeoutinterval), ( async() => {
            for (let index = 0; index < obj_arr?.length; index++) {
                try {
                    let dataFunction = ({id, CPF, correspondent}) => proposalTimeValidation(mercantilBuild({id, cpf: CPF}, {}, 0, correspondent), [7, 19, 0], lastSimulation(CPF, "mercantil"));
                    const { servidor, id, correspondent, searchData, message, CPF } = await readSpreadSheetLines({line: obj_arr[index], correspondentKey: correspondentKeyMercantil, index, dataFunction, phoneArray});
                    functionSelector(searchData);
                    await searchData.function({searchData, id, message, servidor, correspondent, simulationObj: obj_arr[index], lineObj: {id, cpf: CPF, servidor}});
                    console.info("mercantilContract", {searchData, message, CPF, correspondent: correspondent?.name});
                    await spreadSheetFiller(message, CPF, correspondent?.name);
                    
                } catch (error){
                    console.error(error);
                }
            }
        })()]);
    return await mercantilContract({bank});
};
const panContract = async({bank}) => {
    const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
    const obj_arr = await proposalArray(bank);
    console.info({pan: obj_arr?.length});
    await Promise.all([timeoutPromise(timeoutinterval), (async() => {
        for (let index = 0; index < obj_arr?.length; index++) {
            try {
                let dataFunction = ({CPF, correspondent}) => panRequests?.balance(CPF, 0, correspondent);
                let { servidor, id, correspondent, searchData, message, CPF } = await readSpreadSheetLines({line: obj_arr[index], correspondentKey: correspondentKeyPan, index, dataFunction, phoneArray});
                let panValue = await panValues(searchData);
                if(panValue?.parcelas) searchData = panValue;
                
                functionSelector(searchData);
                await searchData.function({searchData, id, message, servidor, correspondent, simulationObj: obj_arr[index], lineObj: {id, cpf: CPF, servidor}});
                console.log("panContract", {searchData, message, CPF, correspondent: correspondent?.name});
                await spreadSheetFiller(message, CPF, correspondent?.name);
            } catch (error) {
                console.error(error);
            }
        }
    })()]);
    return await panContract({bank});
};
const c6Contract = async({bank}) => {
    const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
    const obj_arr = await proposalArray(bank);
    console.info({c6: obj_arr?.length});
    await Promise.all([timeoutPromise(timeoutinterval), (
        async() => {
            for (let index = 0; index < obj_arr?.length; index++) {
                try {
                    let dataFunction = ({CPF, correspondent}) => c6Requests()?.balance(CPF, 0, correspondent);
                    let { servidor, id, correspondent, searchData, message, CPF } = await readSpreadSheetLines({line: obj_arr[index], correspondentKey: correspondentKeyC6, index, dataFunction, phoneArray});
                    functionSelector(searchData);
                    await searchData.function({searchData, id, message, servidor, correspondent, simulationObj: obj_arr[index], lineObj: {id, cpf: CPF, servidor}});
                    console.log("c6Contract", {searchData, message, CPF, correspondent: correspondent?.name});
                    await spreadSheetFiller(message, CPF, correspondent?.name);
                } catch (err){
                    console.error(err);
                }
            }
        })()]);
    return await c6Contract({bank});
};
const contractSpreadsheet = async() => {
    c6Contract({ bank: "C6" });
    mercantilContract({bank: "Mercantil" });
    panContract({ bank: "Pan" });
};
contractSpreadsheet();