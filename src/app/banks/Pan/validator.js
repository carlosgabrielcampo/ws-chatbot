const { addLeadingZeros, array_validation } = require("../../../util/util");
const { restricted_pan } = require("../../../util/wsutils");

module.exports.validators = {
    DadosBancarios: (data) => {
        const bank_info = data?.client_data?.bank_data?.at(-1);
        let bank = addLeadingZeros(bank_info?.bank_code, 3);
        const client_data = {
            "Tipo Conta": bank_info?.account_type,
            "Número Agência": bank_info?.bank_branch,
            "Número Banco": restricted_pan.includes(bank) ? false : bank,
            "Número Conta": bank_info?.account,
        };
        if(client_data["Número Banco"] === "104"){
            client_data["Cod Operação CEF"] = bank_info?.code_cef;
        }
        if(array_validation(client_data)) return client_data;
    },
    EnderecoResidencial: (data) => {
        const add = data?.client_data?.address.at(-1);
        const client_data = {
            "CEP": add?.cep,
            "UF": add?.state,
            "Cidade": add?.city,
            "Rua": add?.street,
            "Número": add?.number,
            "Bairro": add?.neighborhood,
        };
        if(array_validation(client_data)) return client_data;
    },
    Contatos: (data) => {
        const main_phone = data?.client_data?.contact?.phones?.find((e) => e.origin === "main");
        const document = data?.client_data?.documents?.find((e) => e.type === "RG");

        const client_data = {
            "Nome": data?.client_data?.name?.split(" ")[0],
            "Nome Mãe": data?.client_data?.mother_name?.split(" ")[0],
            "Data Nascimento": undefined,
            "Número RG": document?.number,
            "DDD Telefone": main_phone?.ddd,
            "Número Telefone": main_phone?.phone
        };

        const ano_documento = new Date(data?.client_data?.birth_date)?.getFullYear();
        const mes_documento = new Date(data?.client_data?.birth_date)?.getMonth() + 1; 
        const dia_documento = new Date(data?.client_data?.birth_date)?.getDate() ;
        const data_completa = `${dia_documento}/${mes_documento}/${ano_documento}`;
        if(ano_documento){
            client_data["Data Nascimento"] = data_completa;
        }
        if(array_validation(client_data)) return client_data;
    },
};