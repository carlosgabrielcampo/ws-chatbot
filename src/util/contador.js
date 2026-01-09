const { apiCounter } = require("../api/counter");

module.exports.contador = async(args, messageSend) =>{
    const { id, bank, name, convenio, type, message, success } = args;
    try {
        let status = messageSend?.status;
        let msgs = messageSend?.msgs;
        const client_obj = {
            id: `${id}`,
            date: new Date(),
            convenio,
            type,
            name,
            message: JSON.stringify(msgs || message),
            bank,
            success: success || status,
        };
        return await apiCounter.create(client_obj);
    } catch (err) {
        console.error(err);
    }
};