const { manager_server: server, host } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");
require("dotenv").config();
const header = { username: process.env.database_user, password: process.env.database_password };

const apiCounter = {
    getall: async(page, limit) => {
        return await HTTPReq("GET", `http://${host}:3001/counter?page=${page}&limit=${limit}`, header);
    },
    getbyid: async(id) => {
        return await HTTPReq("GET", `http://${host}:3001/counter/${id}`, header);
    },
    create: async(data) => {
        return await HTTPReq("POST", `http://${host}:3001/counter`, header, data);
    },
    update: async(id, data) => {
        return await HTTPReq("PUT", `http://${host}:3001/counter/${id}`, header, data);
    },
    delete: async(cpf) => {
        return await HTTPReq("DELETE", `http://${host}:3001/counter/${cpf}`, header );
    }
};

module.exports = { apiCounter };