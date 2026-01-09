const conversationAPI = require("../../../api/databases/conversations"); 
const { addRowFunc } = require("../../../api/googleAPI");
const { readFile } = require("../../../util/fileHandle");
const { arrayNmbsCreate } = require("../../whatsapp/phoneArray");
const simulatedSpreadsheet = async(id, obj, bancoSimulado) => {
    let contract_obj = {
        chatbot: "", telefoneCliente: id.replace("@c.us",""), bancoSimulado,
        cpf: "", nome: "", data_nascimento: "", email: "", dddCelular: "", numeroCelular: "", nome_mae: "", nacionalidade: "",
        numero_documento: "", tipoDocumento: "", OrgaoEmissor: "", DataEmissao: "", 
        TipoContaBancaria: "", CodOperCEF: "", banco: "", agencia: "", conta: "", contaDigito: "",
        cep: "", uf: "", cidade: "", logradouro: "", numero_endereco: "", bairro: "", valor: ""
    };
    const conversation = await conversationAPI.getid(id);
    const chatbot = arrayNmbsCreate(JSON.parse(await readFile("./src/app/whatsapp/phoneArray.json"))).chatbotArr.find((chatbot) => chatbot?.number === conversation?.receiver);

    contract_obj.chatbot = chatbot?.bot;
    contract_obj = { ...contract_obj, ...obj };
    const values = Object.values(contract_obj);
    await addRowFunc("1xzdCDXGNbmZ58bNUf-x3HRUpgXrgy1enyXa_tMz_468", [values], "SIMULADOS");
};

module.exports = { simulatedSpreadsheet };
