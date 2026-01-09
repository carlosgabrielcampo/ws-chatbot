const { manager_server: server } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");
const apiRequests = {
    getall: async() => {
        return await HTTPReq("GET", `${server}:3001/mercantilBelt`);
    },
    getaById: async(id) => {
        return await HTTPReq("GET", `${server}:3001/mercantilBelt/${id}`);
    },
    create: async(data) => {
        // id, name, value, bank, cpf, type, sended, step
        return await HTTPReq("POST", `${server}:3001/mercantilBelt`,{}, data);
    },
    update: async(data, id) => {
        return await HTTPReq("PUT", `${server}:3001/mercantilBelt/${id}?dbkey=${data.dbkey}`,{}, data);
    },
    delete: async(id) => {
        return await HTTPReq("DELETE", `${server}:3001/mercantilBelt/${id}` );
    }
};

module.exports = {
    apiRequests
};