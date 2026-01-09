const testregex = (param, validator) => {
    let validate = validator.join("|");
    return new RegExp(validate, "i").test(param);
};
const requestError = [{
    message: "A requisição não foi finalizada com sucesso"
},{
    message: "Horário de lançamento de propostas excedido"
},{
    message: "Authorization has been denied for this request"
},{
    message: "Rate limit excedido. Contate o administrador do serviço"
},{
    message: "Não foi possível acessar o backend."
},{
    message: "Usuário não possui acesso a origem 3"
},{
    message: "simulacaoFGTS timed-out and fallback failed."
},{
    message: "Usuário não autenticado"
},{
    message: "Quota has exceeded"
},{
    message: "Erro ao realizar a consulta"
},{
    message: "Limite da conta excedido"
},{
    message: "Não foi possível processar sua solicitação, tente novamente."
},{
    message: "Tente novamente mais tarde."
},{
    message: "Rate limit exceeded"
},{
    message: "Ocorreu um erro inesperado. Tente novamente mais tarde."
},{
    message: "upstream connect error or disconnect/reset before headers"
},{
    message: "Não foi possível consultar o saldo FGTS. Tente novamente mais tarde"
},{
    message: "An internal error has occurred"
},{
    message: "Erro ao realizar a consulta. HTTPStatus: 404 "
},{
    message: "Não foi possivel realizar comunicação com a CEF devido a quantidade de requisições. Tente novamente!"
}];
module.exports.requestErrorHandle = (searchData) => {
    const textRegex = requestError.map((e) => testregex(searchData?.message || searchData, [e.message]));
    if(textRegex.some(e => e) || !searchData.message) return true;
};
