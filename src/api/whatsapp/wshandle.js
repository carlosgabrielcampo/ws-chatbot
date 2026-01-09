const { localServer } = require("../../util/server");
const { HTTPReq } = require("../apiHandle");
let max = 9000;
let min = 4000;
let oneminute = 60000;

const sendMultiple = async(number, arr, servidor) => {
    const msg = [];
    for (let index = 0; index < arr.length; index++) {
        const message = arr[index];
        let wordsPerMinute = 123 + (50 * Math.random());
        let length = message.split(" ").length;
        let timing = oneminute * length/wordsPerMinute;
        if(timing > max) timing = max + message.length;
        if(timing < min) timing = min - message.length;
        const sendedMessage = await HTTPReq("POST", `${servidor || localServer}/send`, {}, {number, message, delay: timing});
        console.info("\x1b[33m%s\x1b[0m", {number, message, sendedMessage: sendedMessage?.status, timing});
        msg.push(sendedMessage?.status);
    }
    if(msg[0] === "enviado"){
        return { status: true, msgs: arr };
    }
};
const sendAudio = async(number, fileName, caption) => {
    await HTTPReq("POST", `${localServer}/sendAudio`,{},{ number, fileName, caption });
};

module.exports = {
    sendMultiple, sendAudio
};