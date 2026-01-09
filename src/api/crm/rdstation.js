const { HTTPReq } = require("../apiHandle");

module.exports = async(token) => {
    return {
        list: async(deal_stage_id) => {
            return await HTTPReq("GET", `https://plugcrm.net/api/v1/deals?token=${token}&deal_stage_id=${deal_stage_id}&closed_at=false&limit=200`); 
        },
        update: async(deal_stage_id, proposal_id, win, deal_lost_reason_id) => {
            return await HTTPReq("PUT", `https://plugcrm.net/api/v1/deals/${proposal_id}`,"", {
                token,
                deal_stage_id,
                win,
                deal_lost_reason_id
            });
        },
        search: async(id) => {
            return await HTTPReq("GET", `https://plugcrm.net/api/v1/organizations/${id}?token=${token}`); 
        },
    };
};