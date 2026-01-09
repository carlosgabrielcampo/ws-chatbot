const { server } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");

module.exports.getcrm = async() => {
    return {
        get: async(path) => {
            return await HTTPReq("GET",`${server}/crm/${path}`);
        },
    };
};
