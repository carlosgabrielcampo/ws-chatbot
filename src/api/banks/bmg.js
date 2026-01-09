const { manager_server } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");

const bmgRequests = () => {
    return {
        balance: async(cpf, prd, correspondentKey) => {
            return await HTTPReq("POST",`${manager_server}:3003/simularsaqueaniversariofgts`, {}, {
                cpf, prd, correspondentKey
            });
        },
    };
};
module.exports = { bmgRequests };