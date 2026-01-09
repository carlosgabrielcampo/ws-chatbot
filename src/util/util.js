const { writeFile, appendFile } = require("./fileHandle");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const addLeadingZeros = (num, totalLength) => {
    return String(num).padStart(totalLength, "0");
};
const addLeadingOnes = (num, totalLength) => {
    return String(num).padStart(totalLength, "1");
};
const testregex = (param, validator) => {
    let validate = validator.join("|");
    return new RegExp(validate, "i").test(param);
};
const currencyFormat = (value) => {
    let formatter = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
    return formatter.format(value);
};
const between = (x, min, max) => {
    return x >= min && x <= max;
};
const randomNumber = (num) =>{
    return Math.floor(num * Math.random());
};

const cpfMask = (cpf) =>{
    cpf=cpf.replace(/\D/g,"");
    cpf=cpf.replace(/(\d{3})(\d)/,"$1.$2");
    cpf=cpf.replace(/(\d{3})(\d)/,"$1.$2");
    cpf=cpf.replace(/(\d{3})(\d{1,2})$/,"$1-$2");
    return cpf;
};

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

const ruleSplit = async(step, ruleset) => {
    return step?.split(".").reduce((p,c)=>p&&p[c]||null, ruleset);
};

const array_validation = (object) => {
    return !Object.values(object)?.some((e) => !e);
};

const TestaCPF = (strCPF) => {
    let Soma;
    let Resto;
    Soma = 0;
    if (strCPF == "00000000000") return false;
    for (let i = 1; i <= 9; i += 1)
        Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
    Resto = (Soma * 10) % 11;
    if ((Resto == 10) || (Resto == 11)) Resto = 0;
    if (Resto != parseInt(strCPF.substring(9, 10))) return false;
    Soma = 0;
    for (let i = 1; i <= 10; i += 1)
        Soma = Soma + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
    Resto = (Soma * 10) % 11;
    if ((Resto == 10) || (Resto == 11)) Resto = 0;
    if (Resto != parseInt(strCPF.substring(10, 11))) return false;
    return true;
};

const jsonFromGoogleSpreadsheet = (array) => {
    const header = array?.[0];
    array?.shift();
    return array?.map((line) => {
        const simulations_object = {};
        header.map((head, i) => simulations_object[head] = line[i]);
        return simulations_object;
    });
};

const timeoutPromise = async(timeout) => {
    return await new Promise((resolve, reject) => {
        setTimeout(function () {
            try {
                resolve("timeout");
            } catch (e) {
                reject(e);
            }
        }, timeout);
    });
};


const hour_validation = (initialHour = 22, endHour = 6, daysFoward = 1) => {
    const new_date = new Date();
    const date_now = Date.now();
    let initialTime = new Date(new_date.getFullYear(), new_date.getMonth(), new_date.getDate(), initialHour, 0, 0, 0);
    let endtime = new Date(new_date.getFullYear(), new_date.getMonth(), new_date.getDate() + daysFoward, endHour, 0, 0, 0) ;
    if( initialTime - date_now < 0 && endtime - date_now > 0 ){
        return endtime - date_now;
    } else {
        return false;
    }
};

module.exports = { 
    delay, 
    addLeadingZeros, 
    testregex, 
    currencyFormat,
    between,
    cpfMask,
    ruleSplit,
    isValidDate,
    array_validation,
    randomNumber,
    addLeadingOnes,
    TestaCPF,
    timeoutPromise,
    jsonFromGoogleSpreadsheet,
    hour_validation
};