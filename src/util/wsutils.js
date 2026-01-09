const { saveDb } = require("../api/databases/conversations");
const { wstext } = require("../app/whatsapp/texts");
const { addLeadingZeros, isValidDate, randomNumber } = require("./util");

require("dotenv").config();

const comercialTime = async(id) => {
    const random = randomNumber(2);
    if ( new Date().getHours() >= 18 || new Date().getHours() < 9 || new Date().getDay() === 0 || new Date().getDay() === 6 ){ 
        return await wstext[`comercial_timeoff${random}`](id);
    } 
    else { 
        return await wstext[`comercial_timeon${random}`](id); 
    }
};
const comercialSimulationTime = async(id) => {
    const random = randomNumber(2);
    if ( new Date().getHours() >= 18 || new Date().getHours() < 9 || new Date().getDay() === 0 || new Date().getDay() === 6 ){ 
        return await wstext[`comercial_simulation_off${random}`](id);
    } 
    else { 
        return await wstext[`comercial_simulation_on${random}`](id); 
    }
};
const validTime = async(body, ymd) => {
    try {
        let correctdate = null;
        let digits = body?.match(/\d/g);
    
        if(digits && digits?.length > 1){
            digits = digits.join("")*1;
        }
        let day = null;
        let month = null;
        let year = null;
        if(String(digits)?.length === 8){
            year = String(digits).slice(-4)*1, 4;
            month = addLeadingZeros(String(digits).slice(2,4)*1, 2);
            day = String(digits).slice(0,2)*1 - 1, 2;
        }
        if(String(digits)?.length === 7){
            year = String(digits).slice(-4)*1, 4;
            month = addLeadingZeros(String(digits).slice(1,3)*1, 2);
            day = String(digits).slice(0,1)*1 - 1, 2;
        }
        if(day === 0) day = 1;
        if(!(day * 1) || !(month * 1) || !(year * 1)) return false;
    
        
        if((day) <= 31 || month <= 12 && isValidDate(new Date(correctdate))){
            correctdate = `${addLeadingZeros(day + 1, 2)}-${month}-${year}`;
            if(ymd) correctdate = `${year}-${month}-${addLeadingZeros(day + 1, 2)}`;
            return correctdate;
        }
        return false;
    } catch {
        return false;
    }
};

const defaultError = async(id, message) => {
    message.textFunction = async() => await comercialTime(id, message);
    message.step = "call_security";
    await saveDb({id, status_conversation: "EmAndamento"});
    message.status_conversation = "EmAndamento";
};
const defaultFlowError = async(id, message, error, step) => {
    try {
        console.error(step,  error);
        message.status_conversation = "EmAndamento";
        message.step = "call_security";
        await saveDb({id, status_conversation: "EmAndamento"});
        await wstext.error_flow(id);
    } catch (err) {
        console.error("defaultFlowError", step, err);
    }

};

const statesReg = [
    /AC/i, /AL/i, /AM/i, /AP/i, /BA/i, /CE/i, /DF/i, /ES/i, /GO/i, /MA/i, /MG/i, /MS/i, /MT/i, /PA/i, /PB/i, /PE/i, /PI/i, /PR/i, /RJ/i, /RN/i, /RO/i, /RR/i, /RS/i, /SC/i, /SE/i, /SP/i, /TO/i
];

const restricted_mercantil = [
    "003", "03", "3", "007", "07", "7", "011", "11", "069", "69", "079", "79", "093", "93", "102", "121", "125", "134", "140", "183", "197", "212", "218", "280", "290", "318", "323", "332", "335", "336", "340", "349", "364", "380", "383", "396", "401", "422", "450", "623", "637", "653", "654", "655", "720", "735", "746", "748"
];

const restricted_pan = [
    "003", "03", "3", "069", "69", "077", "77", "079", "79", "093", "93", "102", "121", "125", "134", "140", "183", "197", "212", "218", "280", "290", "318", "323", "332", "335", "340", "349", "380", "383", "396", "401", "422", "450", "452", "637", "653", "654", "655", "735", "746", "748"
];

module.exports = { comercialTime, validTime, defaultError, comercialSimulationTime, defaultFlowError, statesReg, restricted_mercantil, restricted_pan };