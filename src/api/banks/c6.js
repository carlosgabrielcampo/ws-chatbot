require("dotenv").config();
const { manager_server } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");

const c6Requests = () => {
    return {
        balance: async(cpf, prd, correspondentKey) => {
            return await HTTPReq("POST",`${manager_server}:3002/proposal/fgts`, {}, {
                cpf, prd, correspondentKey
            });
        },
        proposalPost: async(data, simulation, correspodentKey) => {
            return await HTTPReq("POST",`${manager_server}:3002/marketplace/proposal/fgts`, {}, {
                data, simulation, correspodentKey
            });
        },
        linkFormalization: async(cpf, numeroProposta, correspodentKey) => {
            return await HTTPReq("POST",`${manager_server}:3002/proposal/formalization-url`, {}, {
                cpf, numeroProposta, correspodentKey
            });
        }
    };
};

module.exports = { 
    c6Requests
};