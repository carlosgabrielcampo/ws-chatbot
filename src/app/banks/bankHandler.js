const { mercantilBuild } = require("./Mercantil/index");
const { saveDb } = require("../../api/databases/conversations");
const { responseHandle, mercantilBalanceHandle, panBalanaceHandle, c6BalanaceHandle } = require("../whatsapp/errorHandle");
const { server_port } = require("../../util/server_port");
const { panRequests } = require("../../api/banks/pan");
const { comercialSimulationTime, defaultFlowError } = require("../../util/wsutils");
const { apiFGTS } = require("../../api/databases/fgts_database");
const { timeoutPromise, hour_validation } = require("../../util/util");
const { correspondentKeyPan, correspondentKeyC6, correspondentKeyMercantil } = require("../keys/apiKeys");
const { c6Requests } = require("../../api/banks/c6");
const { wstext } = require("../whatsapp/texts");
const { arrayNmbsCreate } = require("../whatsapp/phoneArray");
const { readFile } = require("../../util/fileHandle");

const proposalTimeValidation = (functionToExecute, time, bddFunction) => new Promise((resolve) => {
    if(!hour_validation(...time)) resolve(functionToExecute);
    else resolve(bddFunction);
});
const c6Handle = async ({id, message, cpf, info, boolean, timeout, servidor, lastSimulation}) => {
    try {
        let c6Data = {};
        let correspondent = correspondentKeyC6[0];
        if(lastSimulation?.correspondent) correspondent =  correspondentKeyC6.find((e) => lastSimulation?.correspondent?.name === e.name ) || correspondentKeyC6[0];
        c6Data = c6Requests().balance(cpf, 0, correspondent);
        return await Promise.any([c6Data, timeoutPromise(timeout)]).then(async (response) => {
            if(["timeout", undefined].includes(response)) return "timeout";
            return await responseHandle({ id, message, info }, response, boolean, "C6", servidor);
        });
    } catch(error) {
        await defaultFlowError(id, message, error, "c6Data");
    }
};
const mercantilHandle = async ({id, message, cpf, info, boolean, timeout, servidor, lastSimulation}) => {
    try {
        let mercantilData = {};
        let correspondent = correspondentKeyMercantil[1];
        if(lastSimulation?.correspondent) correspondent = correspondentKeyMercantil.find((e) => lastSimulation?.correspondent?.name === e.name ) || correspondentKeyMercantil[1];
        mercantilData = mercantilBuild({ id, cpf }, mercantilData, 1, correspondent);
        return await Promise.any([await proposalTimeValidation(mercantilData, [7, 19, 0], "timeout"), timeoutPromise(timeout)]).then(async (response) => {
            if(["timeout", undefined].includes(response)) return "timeout";
            return await responseHandle({ id, message, info }, response, boolean, "Mercantil", servidor);
        });
    } catch(error) {
        await defaultFlowError(id, message, error, "mercantilData");
    }
};
const panHandle = async ({id, message, cpf, info, boolean, timeout, servidor, lastSimulation}) => {
    try {
        let panData = {};
        let correspondent = correspondentKeyPan[1];
        if(lastSimulation?.correspondent) correspondent = correspondentKeyPan.find((e) => lastSimulation?.correspondent?.name === e.name ) || correspondentKeyPan[1];
        panData = panRequests.balance(cpf, 0, correspondent);
        return await Promise.any([panData, timeoutPromise(timeout)]).then(async (response) => {
            if(["timeout", undefined].includes(response)) return "timeout";
            let simulation_obj = {};
            if(response?.simulacao?.condicoes_credito?.length > 0) {
                simulation_obj.Saldo = response?.simulacao?.condicoes_credito[0]?.valor_bruto;
                simulation_obj.Simulacao = response?.simulacao?.condicoes_credito[0]?.valor_cliente;
                simulation_obj.Bank = "Pan";
            }
            return await responseHandle({ id, message, info }, response, boolean, "Pan", servidor);
        });
    } catch(error) {
        await defaultFlowError(id, message, error, "mercantilData");
    }
};
const lastSimulation = async(cpf, bank) => {
    try {
        const FGTSClient = await apiFGTS.getbyid(cpf);
        let simulationsArr = [];
        const mercantilSimulations = FGTSClient?.mercantil?.simulation?.filter((e) => e?.valorEmprestimo);
        console.log({mercantilSimulations});

        const panSimulations = FGTSClient?.pan?.simulation.filter((e) => {
            if(e?.condicoes_credito?.length) {
                e.condicoes_credito[0].createdAt = e?.createdAt;
                e.condicoes_credito[0].correspondent = e?.correspondent;
                return e?.condicoes_credito[0]?.sucesso === true;
            }
        }).map((e) => e.condicoes_credito[0]);
        const c6Simulations = FGTSClient?.c6?.simulation?.filter((e) => e.net_amount);
        mercantilSimulations?.length && simulationsArr.push(...mercantilSimulations);
        panSimulations?.length && simulationsArr.push(...panSimulations);
        c6Simulations?.length && simulationsArr.push(...c6Simulations);
        simulationsArr = simulationsArr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        const simulations = { "mercantil": mercantilSimulations, "pan": panSimulations, "c6": c6Simulations };
        return bank ? { simulacao: simulations[bank]?.at(-1), type: "simulation"} : simulationsArr?.at(-1);
    } catch(err){
        console.error(err);
    }
};
const create_simulation = async(id, message, lastSimulation) =>{
    try {
        if(lastSimulation) {
            if(lastSimulation?.descricao_tabela_financiamento) {
                await panBalanaceHandle(lastSimulation, message, id, "Simulation_Pan");
            }
            if(lastSimulation?.valorEmprestimo) {
                await mercantilBalanceHandle(lastSimulation, message, id, "Simulation_Mercantil");
            }
            if(lastSimulation?.net_amount) {
                await c6BalanaceHandle(lastSimulation, message, id, "Simulation_C6");
            }
        }
    } catch(error){
        await defaultFlowError(id, message, error, "mercantilData");
    }
};
const bankHandle = async (id, message, cpf, info, statusObject) => {
    statusObject[id] = true;
    try {
        let timeout = 300000;
        let phoneArray = JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"));
        if(process.env.TEST){
            timeout = 0;
            phoneArray = {
                "CHATBOTTEST": {
                    "host": `192.168.20.115:${server_port}`,
                    "time": 300000,
                    "bot": "CHATBOTTEST",
                    "type": "1",
                    "number": "111111111111@c.us"
                }
            };
        }
        if(arrayNmbsCreate(phoneArray).portArray.includes(server_port)) {
            let result;
            const lastsimulation = await lastSimulation(cpf);
            const data = {id, message, cpf, info, boolean: true, timeout, lastSimulation: lastsimulation};
            if(lastsimulation?.valorEmprestimo){
                await wstext.mercantil(id);
                message.bank = "Mercantil";
                result = await mercantilHandle(data);
            } else if(lastsimulation?.descricao_tabela_financiamento){
                message.bank = "Pan";
                await wstext.pan(id);
                result = await panHandle(data);
            } else if(lastsimulation?.net_amount) {
                message.bank = "C6";
                await wstext.c6(id);
                result = await c6Handle(data);
            } else {
                await wstext.mercantil(id);
                message.bank = "Mercantil";
                data.boolean = false;
                data.timeout = timeout/3;
                result = await mercantilHandle(data);
                if(result !== false) {
                    data.boolean = true;
                    message.bank = "Pan";
                    await wstext.pan(id);
                    result = await panHandle(data);
                }
                if(result !== false) {
                    data.boolean = true;
                    message.bank = "C6";
                    await wstext.c6(id);
                    result = await c6Handle(data);
                }
            }
            if(result === "timeout") {
                message.bank = undefined;
                message.step = "call_security";
                await saveDb({id, status_conversation: "EmAndamento"});
                message.status_conversation = "EmAndamento";
                message.textFunction = async() => await comercialSimulationTime(id, message);
                return await create_simulation(id, message, lastsimulation);
            }
        }
    } catch(error) {
        await defaultFlowError(id, message, error, "bankHandle");
    }
    statusObject[id] = false;
};

module.exports = { bankHandle, mercantilHandle, panHandle, lastSimulation };