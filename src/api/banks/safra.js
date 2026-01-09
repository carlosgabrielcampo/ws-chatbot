const { manager_server: server } = require("../../util/server");
const { addLeadingZeros } = require("../../util/util");
const { HTTPReq } = require("../apiHandle");

const safraRequests = {
    balance: async(cpf, prd, correspodentKey) => {
        return await HTTPReq("POST",`${server}:3002/api/v1/Fgts`, {}, { 
            cpf, prd, correspodentKey
        });
    },
    simulation: async(cpf, periodos, correspodentKey) => {
        return await HTTPReq("POST",`${server}:3002/api/v1/Calculo/FGTS`, {}, { 
            cpf, periodos, correspodentKey
        });
    },
};

module.exports = { safraRequests };