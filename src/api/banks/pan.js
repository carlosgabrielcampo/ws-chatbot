require("dotenv").config();
const { manager_server: server } = require("../../util/server");
const path = require("path");
const { addLeadingZeros } = require("../../util/util");
const { HTTPReq } = require("../apiHandle");

const panRequests = {
    balance: async(cpf, prd, correspodentKey) => {
        return await HTTPReq("POST",`${server}:3002/consignado/emprestimos/simulacao/fgts/`, {}, { 
            cpf: addLeadingZeros(cpf, 11), prd, correspodentKey
        });
    },
    balance_simulated: async(cpf, prd, correspodentKey) => {
        return await HTTPReq("POST",`${server}:3002/consignado/emprestimos/simulacao/fgts/`, {}, { 
            cpf: addLeadingZeros(cpf, 11), prd, type: "balance_fgts_simulated", correspodentKey
        });
    },
    proposalPost: async(data, simulation, correspodentKey) => {
        return await HTTPReq("POST", `${server}:3002/consignado/emprestimos/propostas/fgts`, {}, {
            data, simulation, correspodentKey
        });
    },
    linkFormalization: async(cpf, numeroProposta, correspodentKey) => {
        return await HTTPReq("POST",`${server}:3002/consignado/formalizador`, {}, {
            cpf, numeroProposta, correspodentKey
        });
    }
};

module.exports = { panRequests };


