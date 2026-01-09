const { HTTPReq } = require("./apiHandle");

const httpRequisitions = async() => {
    return {
        address: async(cep) => {
            return await HTTPReq("GET",`https://brasilapi.com.br/api/cep/v2/${cep}`);
        },
        bank: async(code_bank) => {
            return await HTTPReq("GET",`https://brasilapi.com.br/api/banks/v1/${code_bank}`);
        },

    };
};


module.exports.utilHttp = {
    httpRequisitions,
};

