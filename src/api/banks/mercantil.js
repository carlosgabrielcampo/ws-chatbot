require("dotenv").config();
const { manager_server: path } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");

const apiRequests = async(cpf, correspondent) => {
    return {
        balance: async(prd) => {
            return await HTTPReq("GET",`${path}:3002/PropostasExternas/v1/Clientes/SaquesAniversario/Saldo`, {}, { cpf, prd, correspondent });
        },
        simulation: async(parcelas, prd) => {
            return await HTTPReq("POST", `${path}:3002/PropostasExternas/v1/Simulacoes/Fgts`, {}, { cpf, parcelas, prd, correspondent });
        },
        proposalPost: async(id, simulationObj) => {
            return await HTTPReq("POST", `${path}:3002/PropostasExternas/v1/Propostas/FGTS`, {}, {postData: simulationObj, id, correspondent});
        },
        contractStatus: async(id) => {
            return await HTTPReq("GET", `${path}:3002/PropostasExternas/v1/Propostas`, {}, {id, cpf, correspondent});
        },
        externalLink: async(id) => {
            return await HTTPReq("GET",`${path}:3002/PropostasExternas/v1/AutorizacoesDigitais/Proposta`, {}, {id, cpf, correspondent});
        },
    };
};


module.exports = {
    apiRequests,
};