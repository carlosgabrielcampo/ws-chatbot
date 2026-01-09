const { apiRequests } = require("../../api/databases/factorybelts");

module.exports.uraList = async (ws, msg) => {
    try {
        let firstNumber = msg.body.split("wa.me/")[2];
        const userPhone = await ws.getNumberId(`${firstNumber}`?.slice(0, 20));
        const updated = await apiRequests?.update({dbkey: "id", step: "ura", sended: false}, userPhone?._serialized);
        console.info({updated, userPhone});
    } catch(error){
        console.error(error);
    }
};