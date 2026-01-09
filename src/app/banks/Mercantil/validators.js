const { addLeadingZeros, array_validation } = require("../../../util/util");
const { restricted_mercantil } = require("../../../util/wsutils");


module.exports.validators = {
    DadosBancarios: (data) => {
        const bank_info = data?.client_data?.bank_data?.at(-1);
        const bank = addLeadingZeros(bank_info?.bank_code, 3);
        const client_data = {
            "Tipo Conta Bancária": bank_info?.account_type,
            Banco: restricted_mercantil.includes(bank) ? false : bank,
            "Agência": bank_info?.bank_branch,
            "Número Conta": bank_info?.account,
            "Dígito Conta": bank_info?.account_digit,
        };
        if(array_validation(client_data)) return client_data;
    },
    EnderecoResidencial: (data) => {
        const add = data?.client_data?.address?.at(-1);
        const client_data = {
            Cep: add?.cep ? `${add?.cep}` : false,
        };
        if(array_validation(client_data)) return client_data;
    },
    Contatos: (data) => {
        const client_data = {
            Nome: data?.client_data?.name?.split(" ")[0],
        };
        if(array_validation(client_data)) return client_data;
    },
    DocumentoIdentificacao: (data) => {
        const docs = data?.client_data?.documents?.at(-1);
        const client_data = {
            "Documento": docs?.type,
            Numero: docs?.number,
        };
        if(array_validation(client_data)) return client_data;
    }
};