const { defaultFlowError } = require("../../util/wsutils");
require("dotenv").config();

async function message_handle_flow(wsMessage) {
    try{
        wsMessage.step = "call_security";
        wsMessage.status_conversation = "EmAndamento";
    } catch(error) {
        await defaultFlowError(wsMessage.from, wsMessage, error, "message_handle");
    }
}

module.exports = { message_handle_flow };