const { manager_server } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");
require("dotenv").config();

let server = `${manager_server}:3001`;

const header = { username: process.env.userx, password: process.env.password };
const apiFGTS = {
    getall: async(page, limit, server_name) => {
        return await HTTPReq("GET", `${server_name || server}/fgts?page=${page}&limit=${limit}`, header);
    },
    getbyid: async(id, server_name) => {
        return await HTTPReq("GET", `${server_name || server}/fgts/${id}`, header);
    },
    create: async(data, server_name) => {
        return await HTTPReq("POST", `${server_name || server}/fgts`, header, data);
    },
    update: async(id, data, server_name) => {
        return await HTTPReq("PUT", `${server_name || server}/fgts/${id}`, header, data);
    },
    delete: async(cpf, server_name) => {
        return await HTTPReq("DELETE", `${server_name || server}/fgts/${cpf}`, header );
    }
};

module.exports = {
    apiFGTS
};