const { saveDb } = require("../../api/databases/conversations");
const { apiFGTS } = require("../../api/databases/fgts_database");
const { testregex, currencyFormat, randomNumber } = require("../../util/util");
const { wstext } = require("./texts");

const errors = {
    "blocked": {
        validate: async(id, message, servidor) => {
            message.step = "post_start";
            message.textFunction = async() => await wstext.errors_blocked(id, servidor);
        },
    },
    "disturb": {
        validate: async(id, message, servidor) => {
            message.step = "do_not_disturb";
            message.textFunction = async() => await wstext.errors_disturb(id, servidor);
        },
    },
    "politics": {
        validate: async(id, message, servidor) => {
            console.log({message});
            const mockssimulation = {
                C6: { createdAt: new Date(), "net_amount": 1 },
                Pan: { createdAt: new Date(), "condicoes_credito": [{sucesso: true, createdAt: new Date(), "descricao_tabela_financiamento": "FGTS_CORBAN"}] },
                Mercantil: { createdAt: new Date(), valorEmprestimo: 1 }
            };

            const bankOrder = ["Mercantil", "Pan", "C6"];
            const simulationOrder = ["Simulation_Mercantil", "Simulation_Pan", "Simulation_C6"];
            const bankvalidation = bankOrder.includes(message.bank);
            const simulationvalidation = simulationOrder.includes(message.bank);

            let index;
            if(message.bank){
                if(bankvalidation) index = bankOrder.indexOf(message.bank);
                if(simulationvalidation) index = simulationOrder.indexOf(message.bank);
                message.bank = bankOrder[index + 1] ? bankOrder[index + 1] : bankOrder[0];
            }
            message.step = "post_start";
            const fgts_obj = {cpf: message.cpf * 1, [message.bank.toLowerCase()]: { "simulation": [mockssimulation[message.bank]] } };
            await apiFGTS.create(fgts_obj);
            message.textFunction = await wstext.errors_politics_bank(id, bankOrder[index], message.bank, servidor);

        }
    },
    "irs": {
        validate: async(id, message, servidor) => {
            message.step = "void";
            message.textFunction = async() => await wstext.errors_irs(id, servidor);
        }
    },
    "exposed": {
        validate: async(id, message, servidor) => {
            message.step = "void";
            message.textFunction = async() => await wstext.errors_exposed(id, servidor);
        }
    },
    "value": {
        validate: async(id, message, servidor) => {
            message.step = "call_security";
            message.textFunction = async() => {
                const random = randomNumber(2);
                await wstext[`errors_value${random}`](id, servidor);
            };
        },
    },
    "trustee": {
        validate: async(id, message, servidor, errorMsg, bank, ) => {
            message.step = "post_start";
            message.textFunction = async() => {
                const random = randomNumber(2);
                return await wstext[`errors_trustee${random}`](id, bank, servidor);
            };
        },
    },
    "error_mercantil": {
        validate: async(id, message, servidor) => {
            message.step = "post_start";
            message.textFunction = async() => await wstext.errors_trustee_pan(id, servidor);
        }
    },
    "birthday": {
        validate: async(id, message, servidor, errorMsg) => {
            const nmbs = errorMsg.match(/\d/g);
            const day = nmbs?.splice(0, 2)?.join("");
            const month = nmbs?.slice(0, 2)?.join("");
            message.step = "restart";
            message.textFunction = async() => await wstext.errors_birthday(id, day, month, servidor);
        },
    },
    "birth_date":{
        validate: async(id, message, servidor) => {
            message.step = "client.birth-date";
            message.textFunction = async() => await wstext.errors_birth_date(id, servidor);
        }
    },
    "minor": {
        validate: async(id, message, servidor) => {
            message.step = "call_security";
            message.textFunction = async() => await wstext.errors_minor(id, servidor);
        },
    },
    "mother_name": {
        validate: async(id, message, servidor) => {
            message.step = "client.mom-name";
            message.textFunction = async() => await wstext.invalid_mom_name(id, servidor);
        },
    },
    "cpf": {
        validate: async(id, message, servidor) => {
            message.step = "start";
            message.textFunction = async() => await wstext.invalid_cpf(id, servidor);
        },
    },
    "pending":{
        validate: async(id, message, servidor) => {
            message.step = "call_security";
            message.textFunction = async() => await wstext.errors_pending(id, servidor);
        },
    },
    "cef": {
        validate: async(id, message, servidor)=> {
            message.step = "low_value";
            message.textFunction = async() => await wstext.errors_caixa(id, servidor);
        }
    },
    "account": {
        validate: async(id, message, servidor)=> {
            message.step = "bankInfo.bank";
            message.textFunction = async() => await wstext.account(id, servidor);
        }
    },
    "invalid_cpf": {
        validate: async(id, message, servidor)=> {
            message.step = "start";
            message.textFunction = async() => await wstext.start_new_cpf(id, servidor);
        }
    },
    "invalid_name": {
        validate: async(id, message, servidor)=> {
            message.step = "client.name";
            message.textFunction = async() => await wstext.client_invalid_name(id, servidor);
        }
    },
    "phone": {
        validate: async(id, message, servidor)=> {
            message.step = "phone.phone_accept";
            message.textFunction = async() => await wstext.invalid_phone_proposal(id, servidor);
        }
    },
    "email": {
        validate: async(id, message, servidor)=> {
            message.step = "phone.phone_accept";
            message.textFunction = async() => await wstext.invalid_email_proposal(id, servidor);
        }
    },
    "document": {
        validate: async(id, message, servidor)=> {
            message.step = "phone.valid_phone";
            message.textFunction = async() => await wstext.invalid_document_proposal(id, servidor);
        }
    },
    "nationality": {
        validate: async(id, message, servidor, ) => {
            message.step = "client.nationality";
            message.textFunction = async() => await wstext.invalid_client_nationality(id, servidor);
        }
    },
    "document_pan": {
        validate: async(id, message, servidor)=> {
            message.step = "documents.rg.rg-number";
            message.textFunction = async() => await wstext.invalid_document_proposal_pan(id, servidor);
        }
    },
    "bank": {
        validate: async(id, message, servidor)=> {
            message.step = "bankInfo.bank";
            message.textFunction = async() => await wstext.invalid_bank_proposal(id, servidor);
        }
    },
    "cep": {
        validate: async(id, message, servidor)=> {
            message.step = "address.cep";
            message.textFunction = async() => await wstext.invalid_cep_proposal(id, servidor);
        }
    },
    "default": {
        validate: async(id, message, servidor) => {
            message.step = "call_security";
            await saveDb({id, status_conversation: "EmAndamento"});
            message.status_conversation = "EmAndamento";
            message.textFunction = async() => await wstext.errors_default(id, servidor);
        },
    }
};
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
    {messageValidator: "receita", errorStep: "default", continue_step: "timeout" },
    {messageValidator: "Caixa", errorStep: "cef", continue_step: false },
    {messageValidator: "exposta", errorStep: "exposed", continue_step: false },
    {messageValidator: "parcela|valor|PARCELAS", errorStep: "value", continue_step: false},   
    {messageValidator: "fiduciária", errorStep: "trustee", continue_step: true},
    {messageValidator: "18", errorStep: "minor", continue_step: false},
    {messageValidator: "Cpf", errorStep: "cpf", continue_step: false},
    {messageValidator: "Fgts", errorStep: "default", continue_step: "timeout"},
    {messageValidator: "", errorStep: "default", continue_step: "timeout"}
];

const c6BalanaceHandle = async(searchData, message, id, bank, servidor) => {
    await saveDb({id, status_conversation: "AutoAtendimento"});
    message.status_conversation = "AutoAtendimento";
    message.bank = bank || "C6";
    searchData.installments = searchData?.installments?.filter((e, i) => {
        return `Parcela ${i + 1} - *${currencyFormat(e.valor_parcela)}*`;
    });
    const parcelamento = searchData?.installments?.map((e, i) => {return `Parcela ${i + 1} - *${currencyFormat(e.amount)}*`;});
    message.step = "client.valid_cpf";
    const random = randomNumber(2);
    message.body = parcelamento;
    message.textFunction = async() => await wstext[`balance${random}`](id, currencyFormat(searchData?.net_amount), searchData?.installments?.length, parcelamento?.join("\n"), servidor);
};
const mercantilBalanceHandle = async(searchData, message, id, bank, servidor) => {
    await saveDb({id, status_conversation: "AutoAtendimento"});
    message.status_conversation = "AutoAtendimento";
    message.bank = bank || "Mercantil";
    searchData.calculoParcelas = searchData?.calculoParcelas?.filter((e, i) => {
        if(e.valorTotalParcela > 9) return `Parcela ${i + 1} - *${currencyFormat(e.valorTotalParcela)}*`;
    });
    const parcelamento = searchData?.calculoParcelas?.map((e, i) => {return `Parcela ${i + 1} - *${currencyFormat(e.valorTotalParcela)}*`;});
    message.step = "client.valid_cpf";
    message.body = parcelamento;
    const random = randomNumber(2);
    message.textFunction = async() => await wstext[`balance${random}`](id, currencyFormat(searchData?.valorEmprestimo), searchData?.calculoParcelas?.length, parcelamento?.join("\n"), servidor);
};
const panBalanaceHandle = async(panValue, message, id, bank, servidor) => {
    await saveDb({id, status_conversation: "AutoAtendimento"});
    message.status_conversation = "AutoAtendimento";
    message.bank = bank || "Pan";
    panValue.parcelas = panValue?.parcelas?.filter((e, i) => {
        return `Parcela ${i + 1} - *${currencyFormat(e.valor_parcela)}*`;
    });
    const parcelamento = panValue?.parcelas?.map((e, i) => {return `Parcela ${i + 1} - *${currencyFormat(e.valor_parcela)}*`;});
    message.step = "client.valid_cpf";
    message.body = parcelamento;
    const random = randomNumber(2);
    message.textFunction = async() => await wstext[`balance${random}`](id, currencyFormat(panValue?.valor_cliente), panValue?.parcelas?.length, parcelamento?.join("\n"), servidor);
};
const panValues = async(searchData) => {
    return searchData?.simulacao?.condicoes_credito?.find((simulation, i, alle) => {
        let maxTax = alle?.map((ele) => ele.taxa_referencia_mensal);
        return simulation?.sucesso === true && Math.max(...maxTax) === simulation.taxa_referencia_mensal;
    });
};
const apiSimulationHandle = async(data_info, searchData, panValue, bank, servidor) => {
    const { id, message } = data_info;
    if(searchData?.simulacao?.valorEmprestimo) {
        await mercantilBalanceHandle(searchData?.simulacao, message, id, bank, servidor);
        return false;
    }
    if(searchData?.simulacao?.condicoes_credito) {
        if(panValue){
            await panBalanaceHandle(panValue, message, id, bank, servidor);
        } else {
            await errors["value"].validate(id, message, servidor, searchData?.message, bank);
        }
        return false;    
    }
    if(searchData?.simulacao?.net_amount) {
        await c6BalanaceHandle(searchData?.simulacao, message, id, bank, servidor);
        return false;
    }
};
const errorHandle = async(searchData, data_info, boolean, bank, servidor) => {
    const { id, message } = data_info;    
    const { errorStep, continue_step } = errorList.find((e) => testregex(searchData?.message || searchData, [e?.messageValidator]));
    if(continue_step !== "timeout" && (!continue_step || boolean)) {
        await errors[errorStep].validate(id, message, servidor, searchData?.message, bank);
        return false;
    }
    return continue_step;
};
const responseHandle = async(data_info, searchData, boolean, bank, servidor) => {
    let panValue = await panValues(searchData);
    if(await apiSimulationHandle(data_info, searchData, panValue, bank, servidor) === false) return false;
    if(![searchData?.message, searchData?.detalhes, typeof searchData === "string"].every((e) => !e) ) {
        if(searchData?.detalhes) searchData.message = searchData?.detalhes;
        if(typeof searchData?.message === "object" ) searchData.message = searchData?.message[0];
        return await errorHandle(searchData, data_info, boolean, bank, servidor);
    }
    return "timeout";
};

module.exports = { responseHandle, mercantilBalanceHandle, panBalanaceHandle, errorHandle, panValues, c6BalanaceHandle };