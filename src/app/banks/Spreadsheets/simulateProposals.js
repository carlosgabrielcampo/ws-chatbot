const { c6Requests } = require("../../../api/banks/c6");
const { panRequests } = require("../../../api/banks/pan");
const { getRowsFunc } = require("../../../api/googleAPI");
const { readFile } = require("../../../util/fileHandle");
const { delay, testregex, timeoutPromise, jsonFromGoogleSpreadsheet } = require("../../../util/util");
const { correspondentKeyPan, correspondentKeyMercantil, correspondentKeyC6 } = require("../../keys/apiKeys");
const { panValues, responseHandle, errorHandle } = require("../../whatsapp/errorHandle");
const { arrayNmbsCreate } = require("../../whatsapp/phoneArray");
const { mercantilBuild } = require("../Mercantil");
const { notDuplicatedCpf } = require("./notDuplicatedCpf");
let defaultArrayToRetry = ["Autorizações digitais não encontradas com o identificador da proposta informado.","","#N/A","#REF", "default","timeout", undefined, "Authorization has been denied for this request."];
const errorList = [
    {messageValidator: "indisponibilidade|simulacaoFGTS timed-out and fallback failed.", errorStep: "default", continue_step: "timeout"},
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
    {messageValidator: "parcela|valor|PARCELAS", errorStep: "value", continue_step: false},   
    {messageValidator: "fiduciária", errorStep: "trustee", continue_step: true},
    {messageValidator: "18", errorStep: "minor", continue_step: false},
    {messageValidator: "Cpf", errorStep: "cpf", continue_step: false},
    {messageValidator: "Fgts", errorStep: "default", continue_step: false},
    {messageValidator: "", errorStep: "default", continue_step: "timeout"}
];

const newMercantilContract = async(obj_arr) => {
    for (let index = 0; index < obj_arr.length; index++) {
        let correspondent = correspondentKeyMercantil[index % 2];
        let {CPF, TELEFONE, CHATBOT} = obj_arr[index];
        const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
        const servidor = `http://${arrayNmbsCreate(phoneArray).chatbotArr.find((e) => e.bot === CHATBOT)?.host}`;
        const id = `${TELEFONE?.match(/\d/g)?.join("")*1}@c.us`;
        const cpf = CPF?.match(/\d/g)?.join("");
        mercantilBuild({cpf}, {}, 0, correspondent).then(async(searchData) => {
            let message = {};
            await responseHandle({ id, message }, searchData, true, "Pan", servidor);
            if(searchData?.simulacao?.valorEmprestimo) {
                message.body = searchData?.simulacao?.valorEmprestimo;
            }  else 
            if(![searchData?.message, searchData?.detalhes, typeof searchData === "string"].every((e) => !e)) {
                if(searchData?.detalhes) searchData.message = searchData?.detalhes;
                if(typeof searchData?.message === "object" ) searchData.message = searchData?.message[0];
                const { continue_step, errorStep } = errorList.find((e) => testregex(searchData?.message || searchData, [e?.messageValidator]));
                message.body = searchData?.message;
                if(continue_step === "timeout"){
                    message.body = errorStep;
                }
            }
            console.log("newMercantilContract", {cpf});
            message?.textFunction && message?.textFunction();
            message?.body && await notDuplicatedCpf("1xzdCDXGNbmZ58bNUf-x3HRUpgXrgy1enyXa_tMz_468", [cpf, message?.body], "Página6");
        });

        await delay(10000);
    }
    return obj_arr;
};
const newPanContract = async(obj_arr) => {
    for (let index = 0; index < obj_arr.length; index++) {
        let {CPF, TELEFONE, CHATBOT} = obj_arr[index];
        let correspondent = correspondentKeyPan[1];
        const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
        let searchData = await panRequests?.balance(CPF, 0, correspondent);
        let message = {};
        const servidor = `http://${arrayNmbsCreate(phoneArray).chatbotArr.find((e) => e.bot === CHATBOT)?.host}`;
        const id = `${TELEFONE?.match(/\d/g)?.join("")*1}@c.us`;
        const cpf = CPF?.match(/\d/g).join("");

        await responseHandle({ id, message }, searchData, true, "Pan", servidor);
        let panValue = await panValues(searchData);
        if(panValue?.parcelas) {
            message.body = panValue.valor_cliente;
        } else if(searchData?.simulacao) {
            await errorHandle("parcela", {id, message}, true, "Pan", servidor); 
            message.body = "Sem Saldo";
        } else {
            if(searchData?.detalhes) searchData.message = searchData?.detalhes;
            if(typeof searchData?.message === "object" ) searchData.message = searchData?.message[0];
            const { continue_step, errorStep } = errorList.find((e) => testregex(searchData?.message || searchData, [e?.messageValidator]));
            message.body = searchData.message;
            if(continue_step === "timeout"){
                message.body = errorStep;
            }
        }
        console.log("newPanContract", {cpf});
        message?.textFunction && message?.textFunction();
        message?.body && await notDuplicatedCpf("1xzdCDXGNbmZ58bNUf-x3HRUpgXrgy1enyXa_tMz_468", [cpf, message?.body], "Página6");
    }
    return obj_arr;
};

const newc6Contract = async(obj_arr) => {
    for (let index = 0; index < obj_arr.length; index++) {
        let {CPF, TELEFONE, CHATBOT} = obj_arr[index];
        let correspondent = correspondentKeyC6[0];
        const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
        let searchData = await c6Requests()?.balance(CPF, 0, correspondent);
        let message = {};
        const servidor = `http://${arrayNmbsCreate(phoneArray).chatbotArr.find((e) => e.bot === CHATBOT)?.host}`;
        const id = `${TELEFONE?.match(/\d/g)?.join("")*1}@c.us`;
        const cpf = CPF?.match(/\d/g).join("");
        await responseHandle({ id, message }, searchData, true, "C6", servidor);
        if(searchData?.simulacao) {
            message.body = searchData?.simulacao.net_amount;
        } else {
            const { continue_step, errorStep } = errorList.find((e) => testregex(searchData?.message || searchData, [e?.messageValidator]));
            message.body = searchData?.message;
            if(continue_step === "timeout"){
                message.body = errorStep;
            }
        }
        console.log("newc6Contract", {cpf});
        message?.textFunction && message?.textFunction();
        message?.body && await notDuplicatedCpf("1xzdCDXGNbmZ58bNUf-x3HRUpgXrgy1enyXa_tMz_468", [cpf, message?.body], "Página6");
    }
    return obj_arr;
};

const newBankSimulation = async(obj_arr) => {
    const mercantil = obj_arr.filter((e) => e.BANCO.trim() === "Mercantil");
    const pan = obj_arr.filter((e) => e.BANCO.trim() === "Pan");
    const c6 = obj_arr.filter((e) => e.BANCO.trim() === "C6");
    const phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
    newMercantilContract(mercantil, phoneArray);
    newPanContract(pan, phoneArray);
    newc6Contract(c6, phoneArray);
};
const simulateProposals = async () => {
    const lines = (await getRowsFunc("1xzdCDXGNbmZ58bNUf-x3HRUpgXrgy1enyXa_tMz_468", "SIMULAR")).data.values;
    const linesSimulated = (await getRowsFunc("1xzdCDXGNbmZ58bNUf-x3HRUpgXrgy1enyXa_tMz_468", "Página6")).data.values;

    let obj_contract_arr = jsonFromGoogleSpreadsheet(lines).filter((e) => defaultArrayToRetry.includes(e.Status));
    const simulated_contract_arr = jsonFromGoogleSpreadsheet(linesSimulated).filter((e) => !defaultArrayToRetry.includes(e.Status));

    obj_contract_arr = obj_contract_arr.filter((ele) => !simulated_contract_arr.map((e) => e.CPF).includes(ele.CPF));
    obj_contract_arr.length && await newBankSimulation(obj_contract_arr);
};
const startProposalSearch = async(interval) => {
    setTimeout(async() => {
        await Promise.any([simulateProposals(), timeoutPromise(1800000)]).then(async (response) => {
            if(response) return;
        });
        startProposalSearch(1800000);
    }, interval || 0);
};



startProposalSearch();