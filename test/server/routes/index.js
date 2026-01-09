const { Router } = require("express");
const { cep, code_bank } = require("../controller/brasilAPI");
const { proposal_fgts, marketplace_proposal_fgts, proposal_formalization_url } = require("../controller/c6Requests");
const { Clientes_SaquesAniversario_Saldo, AutorizacoesDigitais_Proposta, Propostas, Propostas_FGTS, Simulacoes_Fgts } = require("../controller/mercantilRequests");
const { formalizador, emprestimos_propostas_fgts, emprestimos_simulacao_fgts } = require("../controller/panRequests");
const { send, sendMedia } = require("../controller/whatsRequests");
const { delete_wsuser, get_wsuser, post_wsuser, put_wsuser, get_wsuser_id} = require("../controller/userRequest");
const {get_client, delete_one_client, post_client, put_client} = require("../controller/clientRequests");
const { get_fgts, delete_one_fgts, post_fgts, put_fgts } = require("../controller/fgtsRequests");
const routes = new Router();


//fgtsRequests
routes.get("/fgts", get_fgts);
routes.put("/fgts/:id", put_fgts);
routes.post("/fgts", post_fgts);
routes.delete("/fgts/:id", delete_one_fgts);

//clientRequests
routes.get("/client", get_client);
routes.put("/client/:id", put_client);
routes.post("/client", post_client);
routes.delete("/client/:id", delete_one_client);

//wsuserRequests
routes.post("/wsuser", post_wsuser);
routes.get("/wsuser/:id", get_wsuser_id);
routes.get("/wsuser", get_wsuser);
routes.delete("/wsuser/:id", delete_wsuser);
routes.put("/wsuser/history", put_wsuser);

//WhatsWeb API 
routes.post("/sendMedia", sendMedia);
routes.post("/send", send);

//Extra
routes.get("/api/cep/v2/:cep", cep);
routes.get("/api/banks/v1/:code_bank", code_bank);

//c6Requests
routes.post("/proposal/fgts", proposal_fgts);
routes.post("/marketplace/proposal/fgts", marketplace_proposal_fgts);
routes.post("/proposal/formalization-url", proposal_formalization_url);

//mercantilRequests
routes.get("/PropostasExternas/v1/Clientes/SaquesAniversario/Saldo", Clientes_SaquesAniversario_Saldo);
routes.post("/PropostasExternas/v1/Simulacoes/Fgts", Simulacoes_Fgts);
routes.post("/PropostasExternas/v1/Propostas/FGTS", Propostas_FGTS);
routes.get("/PropostasExternas/v1/Propostas", Propostas);
routes.get("/PropostasExternas/v1/AutorizacoesDigitais/Proposta", AutorizacoesDigitais_Proposta);

//panRequests
routes.post("/consignado/emprestimos/simulacao/fgts/", emprestimos_simulacao_fgts);
routes.post("/consignado/emprestimos/propostas/fgts", emprestimos_propostas_fgts);
routes.post("/consignado/formalizador", formalizador);

module.exports = routes;