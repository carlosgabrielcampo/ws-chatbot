require("dotenv").config();
const { validTime, comercialTime, defaultError, statesReg, restricted_mercantil, restricted_pan } = require("../../util/wsutils");
const { httpRequisitions } = require("../../api/util").utilHttp;
const { testregex, ruleSplit, TestaCPF } = require("../../util/util");
const { wstext } = require("./texts");
const { clientAPI } = require("../../api/databases/client");
const { apiFGTS } = require("../../api/databases/fgts_database");
const { saveDb } = require("../../api/databases/conversations");
const { bankHandle } = require("../banks/bankHandler");
const mercantilBelt = require("../banks/Mercantil/stepHandle");
const panTrack = require("../banks/Pan/stepHandle");
const { savingInfoByCPF } = require("../../util/database");
const bank_tracks = {
    "Mercantil": mercantilBelt,
    "Pan": panTrack,
    "Simulation_Mercantil": mercantilBelt,
    "Simulation_Pan": panTrack,
    "Simulation_C6": panTrack,
    "C6": panTrack,
};

const creatingDefaultObject = (id, info) => {
    const phoneNumber = id.replace("@c.us", "");
    let ddd = phoneNumber.slice("2","4") * 1;
    let phone = phoneNumber.slice("4") * 1;
    if (!info || typeof info !== "object") { 
        info = { 
            client_data: { 
                bank_data: [],
                address: [],
                documents: [],
                contact: { phones: [{origin: "main", ddd, phone }] }
            } 
        }; 
    }
    if (!info.client_data) { 
        info.client_data = {
            bank_data: [],
            address: [],
            documents: [],
            contact: {phones: [{origin: "main", ddd, phone }]}
        }; 
    }
    if(!info?.client_data?.contact){
        info.client_data.contact = {
            phones: [{origin: "main", ddd, phone }]
        };
    }
    let mainobj = info?.client_data?.contact?.phones?.find((e) => e.origin === "main");
    if(!info?.client_data?.contact?.phones?.at(-1) || !mainobj){ 
        mainobj = { origin: "main", ddd, phone };
        info.client_data.contact.phones.push(mainobj);
    }
};

module.exports = {
    "toVoid": {
        name: "toVoid",
        validate: async () => {
            return true;
        },
        success: async (id, message) => {
            await saveDb({id, status_conversation: "EmAndamento"});
            message.status_conversation = "EmAndamento";
            message.step = "void";
            message.textFunction = async() => await wstext.void(id);
        },
        invalidStatus: "toVoid.no_status",
        maxTryNmb: 2,
    },
    "void": {
        name: "void",
        validate: async () => {
            return true;
        },
        success: async (id, message) => {
            message.step = "void";
        },
        invalidStatus: "void.no_status",
        maxTryNmb: 2,
    },
    "to_contract_end": {
        validate: async () => {
            return true;
        },
        success: async (id, message) => {
            message.step = "contract_end";
            message.textFunction = async() => await wstext.contract_end(id);
        },
        invalidStatus: "to_contract_end.no_status",
        maxTryNmb: 2,
    },
    "contract_end": {
        validate: async () => {
            return true;
        },
        success: async (id, message) => {
            message.step = "contract_end";
        },
        invalidStatus: "contract_end.no_status",
        maxTryNmb: 2,
    },
    "do_not_disturb": {
        validate: async (id, message) => {
            if(testregex(message.body, ["1"])) return true;
        },
        success: async (id, message) => {
            message.step = "void";
            message.textFunction = async() => await wstext.do_not_disturb(id);
        },
        error: async (id, message) => {
            await defaultError(id, message);
        },
        invalidStatus: "low_value.no_status",
        maxTryNmb: 1,
    },
    "call_security": {
        validate: async () => {
            return true;
        },
        success: async (id, message) => {
            await saveDb({id, status_conversation: "EmAndamento"});
            message.status_conversation = "EmAndamento";
            message.step = "call_security";
        },
        invalidStatus: "call_security.no_status",
        maxTryNmb: 2,
    },
    "low_value": {
        validate: async (id, message) => {
            if(testregex(message.body, ["1", "3"])) return true;
        },
        success: async (id, message) => {
            if(message.body === "1"){
                message.step = "void";
                message.textFunction = async() => await wstext.errors_value_accept(id);
            } 
            if (message.body === "3") {
                message.step = "start";
                message.textFunction = async() => await wstext.start_new_cpf(id);
            }
        },
        error: async (id, message) => {
            await defaultError(id, message);
        },
        invalidStatus: "low_value.no_status",
        maxTryNmb: 1,
    },
    "pre_start": {
        validate: async (id, message) => {
            if (testregex(message.body, ["1"])) return true;
        },
        success: async (id, message) => {
            message.step = "start";
            message.textFunction = async() => await wstext.start_default(id);
        },
        error: async (id, message) => {
            await defaultError(id, message);
        },
        invalidStatus: "restarting",
        maxTryNmb: 1,
    },
    "post_start": {
        name: "post_start",
        validate: async (id, message) => {
            if (testregex(message.body, ["1"])) return true;
        },
        success: async (id, message, info, statusObject) => {
            await saveDb({id, status_conversation: "AutoAtendimento"});
            message.status_conversation = "AutoAtendimento";

            let cpf = info?.cpf;
            message.cpf = cpf;
            info.cpf = cpf;
            await saveDb({id, cpf});
            message.body = `${cpf}`;
            await bankHandle(id, message, cpf, {},statusObject);
        },
        error: async (id, message) => {
            await defaultError(id, message);
        },
        invalidStatus: "restarting",
        maxTryNmb: 1,
    },
    "start": {
        name: "start",
        validate: async (id, message) => {
            const digits = `${message.body}`?.match(/\d/g)?.join("");
            if (digits?.length === 11) return TestaCPF(`${digits}`);
        },
        success: async (id, message, info, statusObject) => {
            await saveDb({id, status_conversation: "AutoAtendimento"});
            message.status_conversation = "AutoAtendimento";
            if (!info || typeof info !== "object") { info = {}; }
            if (!info.client_data) { info.client_data = {}; }
            let cpf = `${message.body}`?.match(/\d/g)?.join("") * 1;
            info.cpf = cpf;
            message.cpf = cpf;
            await savingInfoByCPF(cpf, info);
            await saveDb({id, cpf});
            message.body = `${cpf}`;
            await bankHandle(id, message, cpf, {}, statusObject);
        },
        invalid: async (id, message, history) => {
            message.step = "start";
            let error_step = "cpf_rejeitado";
            message.error = error_step;
            if (history.slice(-1)[0]?.error === error_step) message.textFunction = async() => await wstext.invalid_cpf1(id);
            else message.textFunction = async() => await wstext.invalid_cpf(id);
        },
        error: async (id, message) => {
            await saveDb({id, status_conversation: "EmAndamento"});
            message.status_conversation = "EmAndamento";
            message.step = "call_security";
            message.textFunction = async() => await wstext.errors_cpf(id);
        },
        invalidStatus: "cpf_rejeitado",
        maxTryNmb: 3,
    },
    "resell": {
        name: "resell",
        validate: async (id, message, info) => {
            let cpf = info?.cpf;
            if(!cpf){ message.body = "2"; }
            if (["1", "2"].includes(message.body)) return true;
        },
        success: async (id, message, info, statusObject) => {
            await saveDb({id, status_conversation: "AutoAtendimento"});
            message.status_conversation = "AutoAtendimento";
            if (message.body === "1") {
                let cpf = info?.cpf;
                info.cpf = cpf;
                message.cpf = cpf;
                await saveDb({id, cpf});
                message.body = `${cpf}`;
                await bankHandle(id, message, cpf, {}, statusObject);
            }
            if (message.body === "2") {
                message.step = "start";
                message.textFunction = async() => await wstext.start_new_cpf(id);
            }
        },
        error: async (id, message) => {
            await defaultError(id, message);
        },
        invalidStatus: "resell.no_status",
        maxTryNmb: 1,
    }, 
    "client": {
        "valid_cpf": {
            name: "client.valid_cpf",
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim", "[1]", "2", "n*o"])) return true;
            },
            success: async (id, message, info) => {
                creatingDefaultObject(id, info);
                await savingInfoByCPF(info?.cpf, info);
                if (testregex(message.body, ["1", "sim", "[1]",])) await (await ruleSplit("client.valid_cpf", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                else await defaultError(id, message);
            },
            invalid: async (id, message) => {
                message.step = "client.valid_cpf";
                message.error = "contract_rejected",
                message.textFunction = async() => await wstext.invalid_option12(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "contract_rejected",
            maxTryNmb: 3,
        },
        "name": {
            name: "client.name",
            validate: async (id, message) => {
                if (message.body.split(" ").length > 1 && message.body.split(" ")[1]) {
                    return true;
                }
            },
            success: async (id, message, info) => {
                await (await ruleSplit("client.name", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "client.name";
                message.error = "invalid_name",
                message.textFunction = async() => await wstext.invalid_name(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "invalid_name",
            maxTryNmb: 3,
        },
        "mom-name": {
            name: "client.mom-name",
            validate: async (id, message) => {
                if (message.body.split(" ").length > 1 && message.body.split(" ")[1]) {
                    return true;
                }
            },
            success: async (id, message, info) => {
                await (await ruleSplit("client.mom-name", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "client.mom-name";
                message.error = "invalid_mom_name",
                message.textFunction = async() => await wstext.invalid_name_mom(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "invalid_mom_name",
            maxTryNmb: 3,
        },
        "start_contract": {
            name: "client.start_contract",
            validate: async (id, message) => {

                const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
                const email = `${message.body}`?.split(" ")?.join("")?.toLowerCase();
                if (emailRegex.test(email)) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("client.start_contract", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "client.start_contract";
                message.error = "invalid_email",
                message.textFunction = async() => await wstext.invalid_email(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "invalid_email",
            maxTryNmb: 3,
        },
        "birth-date": {
            validate: async (id, message) => {
                return validTime(message.body, true);
            },
            success: async (id, message, info) => {
                await (await ruleSplit("client.birth-date", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "client.birth-date";
                message.error = "birth-date-rejeitada",
                message.textFunction = async() => await wstext.invalid_date(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "birth-date-rejeitada",
            maxTryNmb: 3,
        },
        "nationality": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "brasileiro, brasileira", "2", "estrangeiro", "estrangeira"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("client.nationality", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "client.nationality";
                message.error = "nationality-rejected",
                message.textFunction = async() => await wstext.invalid_option12(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "nationality-rejected",
            maxTryNmb: 3,
        },
    },
    "documents": {
        "rg": {
            "rg-number": {
                validate: async (id, message) => {
                    const digits = message.body?.match(/\d/g);
                    if (digits || testregex(message.body, ["identidade"])) return true;
                },
                success: async (id, message, info) => {
                    if(!info.client_data.documents){ info.client_data.documents = [{type: " ", number: " ", issuing_agency: " " }]; }
                    !info.client_data.documents.at(-1) && info.client_data.documents.push({type: " ", number: " ", issuing_agency: " " });
                    await savingInfoByCPF(info?.cpf, info);
                    await (await ruleSplit("documents.rg.rg-number", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.rg.rg-number";
                    message.error = "rg_rejeitado",
                    message.textFunction = async() => await wstext.invalid_number(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "rg_rejeitado",
                maxTryNmb: 3,
            },
            "rg-emssion-state": {
                validate: async (id, message) => {
                    const isMatch = statesReg.some(rx => rx.test(message.body));
                    if (message.body && message.body.length === 2 && isMatch) return isMatch;
                },
                success: async (id, message, info) => {
                    await (await ruleSplit("documents.rg.rg-emssion-state", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.rg.rg-emssion-state";
                    message.error = "rg_estado_rejeitado",
                    message.textFunction = async() => await wstext.invalid_uf(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "rg_estado_rejeitado",
                maxTryNmb: 3,
            },
            "rg-emssion-date": {
                validate: async (id, message) => {
                    return validTime(message.body, true);
                },
                success: async (id, message, info) => {
                    await (await ruleSplit("documents.rg.rg-emssion-date", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.rg.rg-emssion-date";
                    message.error = "rg_data_rejeitada",
                    message.textFunction = async() => await wstext.invalid_date(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "rg_data_rejeitada",
                maxTryNmb: 3,
            },
        },
        "cnh": {
            "cnh-number": {
                validate: async (id, message) => {
                    const digits = message.body.match(/\d/g);
                    if (digits) return true;
                },
                success: async (id, message, info) => {
                    if(!info.client_data.documents){ info.client_data.documents = [{type: " ", number: " ", issuing_agency: " " }]; }
                    !info.client_data.documents.at(-1) && info.client_data.documents.push({type: " ", number: " ", issuing_agency: " " });
                    await savingInfoByCPF(info?.cpf, info);
                    await (await ruleSplit("documents.cnh.cnh-number", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.cnh.cnh-number";
                    message.error = "cnh_rejeitado",
                    message.textFunction = async() => await wstext.invalid_number(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "cnh_rejeitado",
                maxTryNmb: 3,
            },
            "cnh-emission-state": {
                validate: async (id, message) => {
                    const isMatch = statesReg.some(rx => rx.test(message.body));
                    if (message.body && message.body.length === 2 && isMatch) return isMatch;
                },
                success: async (id, message, info) => {
                    await (await ruleSplit("documents.cnh.cnh-emission-state", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.cnh.cnh-emission-state";
                    message.error = "cnh_estado_rejeitada",
                    message.textFunction = async() => await wstext.invalid_uf(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "cnh_estado_rejeitada",
                maxTryNmb: 3,
            },
            "cnh-emission-date": {
                validate: async (id, message) => {
                    return validTime(message.body, true);
                },
                success: async (id, message, info) => {
                    await (await ruleSplit("documents.cnh.cnh-emission-date", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.cnh.cnh-emission-date";
                    message.error = "cnh_data_rejeitada",
                    message.textFunction = async() => await wstext.invalid_date(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "cnh_data_rejeitada",
                maxTryNmb: 3,
            },
        },
        "ctps": {
            "ctps-serie-number": {
                validate: async () => {

                    return true;
                },
                success: async (id, message, info) => {
                    if(!info.client_data.documents){ info.client_data.documents = [{type: " ", number: " ", issuing_agency: " " }]; }
                    !info.client_data.documents.at(-1) && info.client_data.documents.push({type: " ", number: " ", issuing_agency: " " });
                    await savingInfoByCPF(info?.cpf, info);
                    await (await ruleSplit("documents.ctps.ctps-serie-number", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalidStatus: "ctps_data_rejeitada",
                maxTryNmb: 3,
            },
            "ctps-emission-state": {
                validate: async (id, message) => {
                    const isMatch = statesReg.some(rx => rx.test(message.body));
                    if (message.body && message.body.length === 2 && isMatch) return isMatch;
                },
                success: async (id, message, info) => {
                    await (await ruleSplit("documents.ctps.ctps-emission-state", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.ctps.ctps-emission-state";
                    message.error = "cnh_data_rejeitada",
                    message.textFunction = async() => await wstext.invalid_uf(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "cnh_data_rejeitada",
                maxTryNmb: 3,
            },
            "ctps-emission-date": {
                validate: async (id, message) => {
                    return validTime(message.body, true);
                },
                success: async (id, message, info) => {
                    await (await ruleSplit("documents.ctps.ctps-emission-date", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
                },
                invalid: async (id, message) => {
                    message.step = "documents.ctps.ctps-emission-date";
                    message.error = "cnh_data_rejeitada",
                    message.textFunction = async() => await wstext.invalid_date(id);
                },
                error: async (id, message) => {
                    await defaultError(id, message);
                },
                invalidStatus: "cnh_data_rejeitada",
                maxTryNmb: 3,
            },
        },
        "accept_document": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("documents.accept_document", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message, info) => {
                delete info?.client_data?.documents?.at(-1);
                message.step = "phone.valid_phone";
                savingInfoByCPF(info.cpf, info);
                message.textFunction = async() => await wstext.document_choose(id);
            },
            invalidStatus: "rejected_document",
            maxTryNmb: 1,
        },
    },
    "birth-place": {
        "birth-place-city": {
            validate: async () => {
                return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("birth-place.birth-place-city", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "rejected_birth_place",
            maxTryNmb: 3,
        },
        "birth-place-state": {
            validate: async (id, message) => {
                const isMatch = statesReg.some(rx => rx.test(message.body));
                if (message.body && message.body.length === 2 && isMatch) return isMatch;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("birth-place.birth-place-state", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "birth-place.birth-place-state";
                message.error = "birth_state_rejeitado",
                message.textFunction = async() => await wstext.invalid_uf(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "birth_state_rejeitado",
            maxTryNmb: 3,
        },
    },
    "address": {
        "cep": {
            validate: async (id, message) => {
                const digits = message.body.match(/\d/g);
                const httpReqs = await httpRequisitions();
                const add = await httpReqs.address(digits?.join("") * 1);
                if (add?.cep) return true; 
            },
            success: async (id, message, info) => {
                await savingInfoByCPF(info?.cpf, info);
                await (await ruleSplit("address.cep", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "address.cep";
                message.error = "rejected_cep";
                message.textFunction = async() => await wstext.invalid_cep(id);
            },
            error: async (id, message) => {
                message.step = "address.cep_select";
                message.textFunction = async() => await wstext.invalid_cep1(id);
            },
            invalidStatus: "rejected_cep",
            maxTryNmb: 2,
        },
        "cep_select": {
            validate: async (id, message) => {
                const digits = message.body.match(/\d/g);
                const httpReqs = await httpRequisitions();
                const add = await httpReqs.address(digits?.join("") * 1);
                if (message.body === "1" || add?.cep) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.cep_select", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "address.cep_select";
                message.error = "cep_select.no_status",
                message.textFunction = async() => await wstext.errors_cep(id);
            },
            error: async (id, message) => {
                await comercialTime(id, message);
            },
            invalidStatus: "cep_select.no_status",
            maxTryNmb: 2,
        },
        "state": {
            validate: async (id, message) => {
                const isMatch = statesReg.some(rx => rx.test(message.body));
                if (message.body && message.body.length === 2 && isMatch) return isMatch;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.state", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "address.state";
                message.error = "rejected_state",
                message.textFunction = async() => await wstext.invalid_uf(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "rejected_state",
            maxTryNmb: 3,
        },
        "city": {
            validate: async () => {
                return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.city", bank_tracks[message.bank || "Mercantil"]))(id, message, info);

            },
            invalidStatus: "city-rejected",
            maxTryNmb: 3,
        },
        "neigborhood": {
            validate: async () => {
                return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.neigborhood", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalidStatus: "neighb_rejeitado",
            maxTryNmb: 3,
        },
        "street": {
            validate: async () => {
                return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.street", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalidStatus: "neighb_rejeitado",
            maxTryNmb: 3,
        },
        "residence_number": {
            validate: async (id, message) => {
                if(message?.body.replace(/\s/g,"")?.length >= 1) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.residence_number", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "address.residence_number";
                message.error = "nmb_rejeitado",
                message.textFunction = async() => await wstext.invalid_addnumber(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "nmb_rejeitado",
            maxTryNmb: 3,
        },
        "residence_complement": {
            validate: async () => {
                return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.residence_complement", bank_tracks[message.bank || "Mercantil"]))(id, message, info);

            },
            invalidStatus: "complement_rejected",
            maxTryNmb: 3,
        },
        "accept_address": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("address.accept_address", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message, info) => {
                delete info.client_data.address.at(-1);
                message.step = "address.cep";
                message.textFunction = async() => await wstext.address_cep(id);
            },
            invalidStatus: "rejected_address",
            maxTryNmb: 1,
        },
    },
    "phone": {
        "phone_accept": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                if(!info?.client_data?.contact?.phones){
                    info.client_data.contact.phones = [{
                        origin: "main",
                        ddd: 0,
                        phone: 0
                    }];
                }
                let mainobj = info.client_data.contact.phones.find((e) => e.origin === "main");
                if(!mainobj){
                    info.client_data.contact.phones.push({
                        origin: "main",
                        ddd: 0,
                        phone: 0
                    });
                }
                await savingInfoByCPF(info?.cpf, info);
                await (await ruleSplit("phone.phone_accept", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message) => {
                message.step = "phone.ddd-phone";
                message.textFunction = async() => await wstext.phone_ddd(id);
            },
            invalidStatus: "not_accepted_phone",
            maxTryNmb: 1,
        },
        "ddd-phone": {
            validate: async (id, message) => {
                const digits = message.body.match(/\d/g);
                if (digits && digits.join("").length === 2) return true;
            },
            success: async (id, message, info) => {
                if(!info?.client_data?.contact){
                    info.client_data.contact = {};
                }
                if(!info?.client_data?.contact?.phones){
                    info.client_data.contact.phones = [];
                }
                let mainobj = info.client_data.contact.phones.find((e) => e.origin === "main");
                if(!mainobj){
                    info.client_data.contact.phones.push({
                        origin: "main",
                        ddd: 0,
                        phone: 0
                    });
                }
                await savingInfoByCPF(info?.cpf, info);
                await (await ruleSplit("phone.ddd-phone", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.error = "ddd_incorreto",
                message.step = "phone.ddd-phone";
                message.textFunction = async() => await wstext.invalid_ddd(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "ddd_incorreto",
            maxTryNmb: 3,
        },
        "phone-number": {
            validate: async (id, message) => {
                const digits = message.body.match(/\d/g);
                if (digits && digits.join("").length >= 8 && digits.join("").length <= 9) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("phone.phone-number", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.error = "telefone_incorreto",
                message.step = "phone.phone-number";
                message.textFunction = async() => await wstext.invalid_phone(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "telefone_incorreto",
            maxTryNmb: 3,
        },
        "valid_phone": {
            validate: async (id, message) => {
                if (["1", "2", "3"].includes(message.body)) return true;
                if (testregex(message.body, ["rg", "cnh", "ctps", "trabalho"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("phone.valid_phone", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "phone.valid_phone";
                message.error = "invalid_selector",
                message.textFunction = async() => await wstext.invalid_option123(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "invalid_selector",
            maxTryNmb: 3,
        },
    },
    "bankInfo": {
        "bank": {
            validate: async (id, message, info) => {
                const httpReqs = await httpRequisitions();
                const digits = message.body.match(/\d/g);
                if (!info.client_data.bank_data) {
                    info.client_data.bank_data = [{account: 0, bank_branch: 0, bank_code: 0}];
                }
                if(!info.client_data.bank_data.at(-1)){
                    info.client_data.bank_data.push({account: 0, bank_branch: 0, bank_code: 0});
                }
                let lastBank = info.client_data.bank_data.at(-1);
                if (["Simulation_Mercantil", "Mercantil"].includes(message.bank)) {
                    if (restricted_mercantil.includes(digits?.join(""))) {
                        await savingInfoByCPF(info?.cpf, info);
                        message.textFunction = async() => await wstext.invalid_bank_restricted(id);
                        return false;
                    }
                } else if (["Simulation_Pan", "Pan", "Simulation_C6", "C6"].includes(message.bank)) {
                    if (restricted_pan.includes(digits?.join(""))) {
                        await savingInfoByCPF(info?.cpf, info);
                        message.textFunction = async() => await wstext.invalid_bank_restricted(id);
                        return false;
                    }
                }

                if (digits?.join("").length <= 3) {
                    const bankTest = await httpReqs.bank(digits.join("") * 1);
                    console.info(bankTest);
                    if (bankTest?.code) {
                        lastBank.bank_code = bankTest?.code;
                        lastBank.bank_name = bankTest?.fullName;
                        await savingInfoByCPF(info?.cpf, info);
                        return true;
                    }
                    if(!bankTest){
                        return true;
                    }
                }
                message.textFunction = async() => await wstext.invalid_bank(id);
            },
            success: async (id, message, info) => {
                await (await ruleSplit("bankInfo.bank", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "bankInfo.bank";
                message.error = "bank_code_incorrect";
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "bank_code_incorrect",
            maxTryNmb: 3,
        },
        "operCEF": {
            validate: async (id, message) => {
                if (testregex(message.body, ["corrente", "001", "simples", " 002", "13", "poupan*a", "013", "23", "f*cil", "023", "32", "investimento", "032", "37", "investimento", "037"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("bankInfo.operCEF", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "bankInfo.operCEF";
                message.error = "operation_code_incorrect",
                message.textFunction = async() => await wstext.invalid_op_cef(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "operation_code_incorrect",
            maxTryNmb: 3,
        },
        "agency": {
            validate: async (id, message, info) => {
                const digits = `${message.body}`?.match(/\d/g)?.join("");
                if([["Pan", "Simulation_Pan"].includes(message.bank), info?.client_data?.bank_data?.at(-1)?.bank_code === 341, digits === "500"].every((e) => e === true)){
                    return false;
                } else if (digits?.length > 0 && digits?.length <= 4 && digits * 1 > 0) {
                    info.client_data.bank_data.at(-1).bank_branch = digits * 1;
                    await savingInfoByCPF(info.cpf, info);
                    return true;
                }
            },
            success: async (id, message, info) => {
                await (await ruleSplit("bankInfo.agency", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "bankInfo.agency";
                message.error = "agency_code_incorrect",
                message.textFunction = async() => await wstext.invalid_agency(id);
            },
            error: async (id, message, info) => {
                const digits = `${message.body}`?.match(/\d/g)?.join("");
                if([["Pan", "Simulation_Pan"].includes(message.bank), info?.client_data?.bank_data?.at(-1)?.bank_code === 341, digits === "500",  digits === "0500"].every((e) => e === true)){
                    message.textFunction = async() => await wstext.invalid_bank_341(id);
                    message.textFunction = async() => await wstext.bank_code(id);
                    message.step = "bankInfo.bank";
                }
                await defaultError(id, message);
            },
            invalidStatus: "agency_code_incorrect",
            maxTryNmb: 3,
        },
        "type_account": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "corrente", "2", "poupança"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("bankInfo.type_account", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "bankInfo.type_account";
                message.error = "bank_type_incorrect",
                message.textFunction = async() => await wstext.invalid_option12(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "bank_type_incorrect",
            maxTryNmb: 3,
        },
        "type_account_pan": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "corrente", "2", "poupança", "3", "4", "5", "6"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("bankInfo.type_account_pan", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "bankInfo.type_account_pan";
                message.error = "type_account_pan_incorrect",
                message.textFunction = async() => await wstext.invalid_option123456(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "type_account_pan_incorrect",
            maxTryNmb: 3,
        },
        "account": {
            validate: async (id, message) => {
                const digits = `${message.body}`?.match(/\d/g)?.join("");
                if (digits?.length > 2 && digits?.length < 13) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("bankInfo.account", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "bankInfo.account";
                message.error = "bank_account_incorrect",
                message.textFunction = async() => await wstext.invalid_account(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "bank_account_incorrect",
            maxTryNmb: 3,
        },
        "digit": {
            validate: async (id, message) => {
                const digits = message.body.match(/\d/g);
                if (digits && digits.join("").length === 1) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("bankInfo.digit", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "bankInfo.digit";
                message.error = "bank_code_incorrect",
                message.textFunction = async() => await wstext.invalid_digit(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "bank_code_incorrect",
            maxTryNmb: 3,
        },
        "accept_account": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message) => {
                message.step = "are_you_sure";
                message.textFunction = async() => await wstext.are_you_sure(id);
            },
            error: async (id, message, info) => {
                delete info.client_data.bank_data.at(-1);
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.type_bank_account(id);
            },
            invalidStatus: "rejected_address",
            maxTryNmb: 1,
        },
    },
    "are_you_sure": {
        validate: async (id, message) => {
            if (testregex(message.body, ["1", "sim"])) return true;
        },
        success: async (id, message, info, statusObject) => {
            console.log({info});
            statusObject[id] = true;
            if(info?.cpf === 10119753944) info.cpf = 49132152809;
            const simulation = await apiFGTS.getbyid(info?.cpf);
            await (await ruleSplit("are_you_sure", bank_tracks[message.bank || "Mercantil"]))(id, message, info, simulation, statusObject);
            statusObject[id] = false;
        },
        error: async (id, message, info) => {
            delete info.client_data.bank_data.at(-1);
            message.step = "bankInfo.bank";
            message.textFunction = async() => await wstext.type_bank_account(id);
        },
        invalidStatus: "rejected_address",
        maxTryNmb: 1,

    },
    "finish_contract": {
        validate: async (id, message) => {
            if (testregex(message.body, ["1"])) return true;
        },
        success: async (id, message) => {
            message.step = "to_contract_end";
            message.textFunction = async() => await wstext.finish_contract(id);
        },
        error: async (id, message) => {
            await defaultError(id, message);
        },
        invalidStatus: "help_needed",
        maxTryNmb: 1,
    },
    "documentFiles": {
        "document_1": {
            validate: async (id, message) => {
                if (message.type === "image") return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("documentFiles.document_1", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "documentFiles.document_1";
                message.error = "document_1_invalid",
                message.textFunction = async() => await wstext.invalid_format_image(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "document_1_invalid",
            maxTryNmb: 2,
        },
        "document_2": {
            validate: async (id, message) => {
                if (message.type === "image") return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("documentFiles.document_2", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "documentFiles.document_2";
                message.error = "document_2_invalid",
                message.textFunction = async() => await wstext.invalid_format_image(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "document_2_invalid",
            maxTryNmb: 2,
        },
        "document_3": {
            validate: async (id, message) => {
                if (message.type === "image") return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("documentFiles.document_3", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            invalid: async (id, message) => {
                message.step = "documentFiles.document_3";
                message.error = "document_3_invalid",
                message.textFunction = async() => await wstext.invalid_format_image(id);
            },
            error: async (id, message) => {
                await defaultError(id, message);
            },
            invalidStatus: "document_3_invalid",
            maxTryNmb: 2,
        },
    },
    "restart": {
        // ok
        validate: async () => {
            return true;
        },
        success: async (id, message, info) => {
            await saveDb({id, status_conversation: "AutoAtendimento"});
            message.status_conversation = "AutoAtendimento";
            if (info?.cpf) {
                message.step = "resell";
                let nome = `${info?.client_data?.name}`?.split(" ")?.[0];
                message.textFunction = async() => await wstext.start_resell(id, nome);
            } else {
                message.step = "start";
                message.textFunction = async() => await wstext.start_default(id);
            }
        },
        invalidStatus: "restart.no_status",
        maxTryNmb: 3,
    },
    "mercantil": {
        "contact": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("mercantil.contact", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message) => {
                message.step = "client.name";
                message.textFunction = async() => await wstext.client_name(id);
            },
            invalidStatus: "not_accepted_phone",
            maxTryNmb: 1
        },
        "documents": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("mercantil.documents", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message) => {
                message.step = "phone.valid_phone";
                message.textFunction = async() => await wstext.document_choose(id);
            },
            invalidStatus: "not_accepted_documents",
            maxTryNmb: 1
        },
        "address": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("mercantil.address", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message) => {
                message.step = "address.cep";
                message.textFunction = async() => await wstext.address_cep(id);
            },
            invalidStatus: "not_accepted_address",
            maxTryNmb: 1
        },
        "bankInfo": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info, statusObject) => {
                const simulation = await apiFGTS.getbyid(info?.cpf);
                await (await ruleSplit("are_you_sure", bank_tracks[message.bank || "Mercantil"]))(id, message, info, simulation, statusObject);
            },
            error: async (id, message) => {
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            },
            invalidStatus: "rejected_address",
            maxTryNmb: 1,
        }
    },
    "pan": {
        "contact": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("pan.contact", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message) => {
                message.step = "client.name";
                message.textFunction = async() => await wstext.client_name(id);
            },
            invalidStatus: "not_accepted_phone",
            maxTryNmb: 1
        },
        "address": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info) => {
                await (await ruleSplit("pan.address", bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            },
            error: async (id, message) => {
                message.step = "address.cep";
                message.textFunction = async() => await wstext.address_cep(id);
            },
            invalidStatus: "not_accepted_address",
            maxTryNmb: 1
        },
        "bankInfo": {
            validate: async (id, message) => {
                if (testregex(message.body, ["1", "sim"])) return true;
            },
            success: async (id, message, info, statusObject) => {
                const simulation = await apiFGTS.getbyid(info?.cpf);
                await (await ruleSplit("are_you_sure", bank_tracks[message.bank || "Mercantil"]))(id, message, info, simulation, statusObject);
            },
            error: async (id, message) => {
                message.step = "bankInfo.bank";
                message.textFunction = async() => await wstext.bank_code(id);
            },
            invalidStatus: "rejected_address",
            maxTryNmb: 1,
        }
    },
    "resume": {
        validate: async () => {
            return true;
        },
        success: async (id, message, info) => {
            await saveDb({id, status_conversation: "AutoAtendimento"});
            message.status_conversation = "AutoAtendimento";
            try {
                await (await ruleSplit(message.last_step, bank_tracks[message.bank || "Mercantil"]))(id, message, info);
            } catch {
                message.step = "start";
                message.textFunction = async() => await wstext.start_new_cpf(id);            
            }
        },
        error: async (id, message) => {
            await defaultError(id, message);
        },
        invalidStatus: "resume",
        maxTryNmb: 5,
    },
};