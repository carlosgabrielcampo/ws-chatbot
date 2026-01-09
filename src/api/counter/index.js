// const { server, manager_server } = require("../../util/server");
const { host } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");
require("dotenv").config();
const header = { username: process.env.userx, password: process.env.password };

const apiCounter = {
    getall: async(page, limit) => {
        return await HTTPReq("GET", `http://${host}:3001/counter?page=${page}&limit=${limit}`, header);
    },
    getbyid: async(id, bank, name) => {
        return await HTTPReq("GET", `http://${host}:3001/counter/${id}?bank=${bank}&name=${name}`, header);
    },
    create: async(data) => {
        return await HTTPReq("POST", `http://${host}:3001/counter`, header, data);
    },
    update: async(id, data) => {
        return await HTTPReq("PUT", `http://${host}:3001/counter/update?${id}`, header, data);
    },
    delete: async(cpf) => {
        return await HTTPReq("DELETE", `http://${host}:3001/counter/${cpf}`, header );
    }
};

module.exports = { apiCounter };