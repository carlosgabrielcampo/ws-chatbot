const { manager_server: path } = require("../../../util/server");
const { HTTPReq } = require("../../apiHandle");

require("dotenv").config();
const header = { username: process.env.userx, password: process.env.password };


module.exports.clientAPI = {
    get_id: async(id, dbkey, serverpath) => {
        return await HTTPReq("GET",`${serverpath || path}:3001/client/${id}?dbkey=${dbkey}`, header);
    },
    get_page: async(id, page, limit) => {
        return await HTTPReq("GET",`${path}:3001/client?page=${page}&limit=${limit}`, header);
    },
    get: async() => {
        return await HTTPReq("GET",`${path}:3001/client`, header);
    },
    put: async(id, dbkey, data, serverpath) => {
        return await HTTPReq("PUT",`${serverpath || path}:3001/client/${id}?dbkey=${dbkey}`, header, data);
    },
    post: async(data, dbkey, serverpath) => {
        return await HTTPReq("POST",`${serverpath || path}:3001/client?dbkey=${dbkey}`, header, data);
    },
    delete_one: async(id, dbkey) => {
        return await HTTPReq("DELETE",`${path}:3001/client/${id}?dbkey=${dbkey}`, header);
    },
};