const { manager_server: server } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");

module.exports = {
    saveHistory: async(id, history) => {
        const { bankHistory } = history;
        await HTTPReq("POST", `${server}:3001/wsuser`, {}, {id, history: bankHistory});
    },
    saveDb: async(data) => {
        return await HTTPReq("POST", `${server}:3001/wsuser`, {}, data);
    },
    getid: async(id) => {
        return await HTTPReq("GET", `${server}:3001/wsuser/${id}`, {});
    },
    getByReceiver: async(receiver, date) => {
        return await HTTPReq("POST", `${server}:3001/wsuser/receiver/${receiver}`, {date});
    },
    getpage: async(page) => {
        return await HTTPReq("GET", `${server}:3001/wsuser/?page=${page}`);
    },
    getrdid: async(id) => {
        return await HTTPReq("GET", `${server}:3001/wsuser/rd/${id}`);
    },
    getall: async() => {
        return await HTTPReq("GET", `${server}:3001/wsuser`);
    },
    delete: async(id, dbkey) => {
        return await HTTPReq("DELETE", `${server}:3001/wsuser/${id}?dbkey=${dbkey}`);
    },
    put: async(id, history) => {
        return await HTTPReq("PUT", `${server}:3001/wsuser/history`,{}, {id, history});
    }
};

