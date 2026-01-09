const { sendMultiple, sendAudio } = require("../../api/whatsapp/wshandle");
const { delay, randomNumber, addLeadingZeros } = require("../../util/util");

let company = "SCALA";
let prep = "a";
let texts = {
    happy0: "Estamos felizes por ver você aqui! 😃",
    happy1: "Seja bem-vindo à Scala! 😃",
    introduction0: "Meu nome é Paola, a *ROBÔ* 🤖 assistente virtual aqui na Scala, e eu vou guiar a sua contratação!",
    introduction1: "Eu sou a Paola, sua assistente virtual 🤖. Estou pronta para te ajudar a concluir sua contratação.",
    cpf0: "Vamos começar? Por gentileza, me informe abaixo o seu *CPF*",
    cpf1: "Para confirmar a consulta do seu saldo, me informe o seu *CPF*",
    begin: "Vamos começar?",
    understand: "Desculpe, não entendi.",
    typeagain: "Digite novamente:",
    yesno: "*1* - Sim\n*2* - Não",
    datamodification: "Você confirma seus dados?\n*1* - Sim\n*2* - Não, quero alterar algum dado",
    humanize: "Pedir ajuda para atendimento humano",
    choose_pan: "Obrigada por nos escolher",
    choose_mercantil: `Obrigada por escolher ${prep , "", company}!`
};

const word_not_hidden = (object) => {
    try {
        let text_array = [];
        Object.entries(object)?.map((e) =>{
            text_array.push(`${e[0]}: ${e[1]}`);
        });
        return text_array?.join("\n");
    } catch(error){
        console.error(error);
        return false;
    }

};

const word_hidden = (object) => {
    try {
        let text_array = [];
        Object.entries(object).map((e) =>{
            let str = `${e[1]}`;
            let symbolsArr = str?.match(/[^èéòàùì\w]/gi);
            let stringArr = [];
            str?.split(/[^èéòàùì\w]/gi).map((element, i) => {
                let strLen = element.length;
                if ( strLen > 4 ) {
                    stringArr.push(element.substr(0, 2) + element.substr(0, strLen - 4).replace(/\w/g, "*") + element.substr(-2,2));
                } else if(strLen === 4){
                    stringArr.push(element.substr(0, 1) + element.substr(0, strLen - 2).replace(/\w/g, "*") + element.substr(-1,2));
                } else {
                    stringArr.push(element);
                }
                if(symbolsArr?.length >= i + 1){
                    stringArr.push(symbolsArr[i]);
                }
            });
            text_array.push(`${e[0]}: ${stringArr.join("")}`);
        });
        return text_array?.join("\n");
    } catch(error){
        console.error(error);
        return false;
    }
};

const wstext = {
    "error_flow": async (id, servidor) => {
        await sendMultiple(id, ["Ocorreu um erro no fluxo da contratação, vou te encaminhar para o atendimento humano"], servidor);
    },
    "integrada": async (id, servidor) => {
        await sendMultiple(id, ["Você já possui uma proposta em andamento, lembrando que o pagamento pode acontecer em até 24 horas após a aprovação. Confira a sua conta e confirme abaixo:\n","[1] Já recebi o valor e desejo finalizar a conversa","[2] Já recebi o valor, mas quero falar com atendente","[3] Ainda não recebi e quero atendimento"], servidor);
    }, 
    "cadence_one": async (id, nome, servidor) => {
        await sendMultiple(id, [`Olá${" "+nome || ""}!\nA contratação leva cerca de 5 minutos.\nVamos dar continuidade?\n${texts.yesno}, cancelar atendimento`], servidor);
    },
    "cadence_two": async (id, nome, servidor) => {
        await sendMultiple(id, [`Olá${" "+nome || ""}!\nComo não tive retorno, irei retirar o seu contato aqui da minha lista, beleza? Precisando de algo na área de crédito FGTS ou empréstimos é só nos chamar!\nNos ajude a melhorar, informe porque não nos respondeu:\n*1* - Ainda quero fazer a antecipação\n*2* -Já fiz a antecipação em outro lugar pois demoraram a me responder\n*3* -Não solicitei contato ou não tinha entendido do que se tratava`], servidor);
    },
    "cadence_response": async (id, servidor) => {
        await sendMultiple(id, ["Que bom. Vamos reiniciar o atendimento.", texts.cpf0], servidor);
    },
    "errors_blocked": async (id, servidor) => {
        await sendMultiple(id, ["Não conseguimos efetuar a simulação pois você ainda não aderiu ao saque-aniversário. Mas não se preocupe, a solução é rápida. Basta seguir o passo a passo:\n1 - Entre no aplicativo FGTS\n2 - Na tela inicial, clique em \"Saque-Aniversário do FGTS\"\n3 - Leia os termos e faça a Adesão ao Saque-Aniversário\n", `Confirme assim que conseguir:\n*1* - Adesão confirmada\n*2* -${texts.humanize}`], servidor);
    },

    "errors_disturb": async (id, servidor) => {
        await sendMultiple(id, ["Não conseguimos efetuar a simulação pois seu CPF está cadastrado no Não Me Perturbe, e há um lei que impede contratações financeira para clientes cadastrados lá. Mas não se preocupe, podemos resolver seguindo o passo a passo abaixo:\n\n1 - Faça Login no site  https://www.naomeperturbe.com.br\n2 - Exclua os telefones cadastrados\n3 - Reenvie a solicitação de simulação após 3 dias úteis"], servidor);
    },
    "errors_politics": async (id, servidor) => {
        await sendMultiple(id, ["Não foi possível realizar a contratação, pois o banco informou uma restrição com o seu CPF. Mas não se preocupe, podemos avaliar a possibilidade de contratação em outros bancos. Você será redirecionado para nossa equipe de atendimento humano."], servidor);
    },
    "errors_politics_bank": async (id, oldbank, newbank, servidor) => {
        await sendMultiple(id, [`Não foi possível realizar a contratação, pois o banco ${oldbank} informou uma restrição com o seu CPF. Mas não se preocupe, podemos avaliar a possibilidade de contratação em outros bancos.`], servidor);
        await wstext.errors_trustee0(id, newbank);
    },
    "errors_irs": async (id, servidor) => {
        await sendMultiple(id, ["Não foi possível realizar a contratação, pois o banco informou uma restrição com o seu CPF e a Receita Federal. Regularize o seu CPF para fazer uma nova tentativa.\n\nObrigada e até mais! Para contratar para outro CPF digite *reiniciar*."], servidor);
    },
    "errors_exposed": async(id, servidor) => {
        await sendMultiple(id, ["Esse tipo de contratação não é permitido para pessoas politicamente expostas. De qualquer maneira, permanecemos à disposição\n\nObrigada e até mais! Para contratar para outro CPF ou mais informações, digite *reiniciar*."], servidor);
    },
    "errors_value0": async (id, servidor) => {
        await sendMultiple(id, ["No momento seu saldo disponível não é suficiente para realizar a antecipação 😕. Retorne o contato após o próximo depósito recebido, geralmente acontece *dia 10*.\n\nIndique e ganhe R$ 15! Oferecemos *R$ 15* para cada cliente que você indicar e fechar contrato conosco. Basta pedir para o seu indicado informar seu nome completo e número de telefone depois da contratação finalizada."], servidor);
    },
    "errors_value1": async (id, servidor) => {
        await sendMultiple(id, ["Lamentamos informar que, no momento, seu saldo disponível não é suficiente para realizar a antecipação desejada  😕. No entanto, fique atento(a) ao próximo depósito que geralmente acontece no dia 10 e nos chame novamente.\n\nAlém disso, temos um programa de indicação em que oferecemos R$ 15 para cada cliente que você indicar e que contratar nossos serviços. Para participar, basta pedir para o seu indicado informar seu nome completo e número de telefone após a finalização do contrato."], servidor);
    },
    "errors_pending": async (id, servidor) => {
        await sendMultiple(id, ["Não conseguimos realizar a sua contratação, pois o banco informou que você já possui uma operação em andamento. Retorne o contato após o cancelamento da operação atual, ou no próximo depósito recebido para novas simulações\n\nDigite *reiniciar* para contratar para outro CPF ou *atendimento* para mais informações."], servidor);
    },
    "errors_value_accept": async (id, servidor) => {
        await sendMultiple(id, ["Obrigada pelo seu contato! Precisando é só me chamar 🤖💜"], servidor);
    },
    "errors_trustee0": async (id, bank, servidor) => {
        await sendMultiple(id, [`Precisamos autorizar o banco a consultar suas informações para gerar uma simulação. *Siga o passo a passo*:\n 📱  Acesse o aplicativo FGTS\n 👉  Clique em Autorizar Bancos\n 🏦  Adicione o ${bank || "Mercantil"} e confirme até o final\n`], servidor);
        await delay(2000);
        await sendMultiple(id, [`Confirme assim que conseguir:\n*1* - Banco autorizado\n*2* - ${texts.humanize}\n`], servidor);
    },
    "errors_trustee1": async (id, bank, servidor) => {
        await sendMultiple(id, [`Para gerar uma simulação, precisamos *autorizar o banco a consultar suas informações*. Para fazer isso, basta seguir este passo a passo simples:\n\n📱Acesse o aplicativo FGTS\n 👉  Clique em Autorizar Bancos\n 🏦  Adicione o ${bank || "Mercantil"} e confirme até o final\n`], servidor);
        await delay(2000);
        await sendMultiple(id, [`Assim que você tiver feito isso, confirme a autorização através de uma das opções abaixo:\n\n*1* - Banco autorizado\n*2* - ${texts.humanize}\n`], servidor);
    },
    "errors_trustee_pan": async (id, servidor) => {
        await sendMultiple(id, ["Sua simulação não foi concluída pois o banco informou alguma restrição na contratação com o Mercantil.","Mas não se preocupe, temos outras opções de banco para consulta.","Siga o passo a passo:\n📱 Acesse o aplicativo FGTS\n👉 Clique em Autorizar Bancos\n🏦 Adicione o PAN e confirme até o final\n"], servidor);
        await sendMultiple(id, ["Ou se preferir, veja o passo a passo em vídeo: https://youtu.be/N5b9hXaeAww"], servidor);
        await delay(2000);
        await sendMultiple(id, [`Confirme assim que conseguir:\n*1* -Banco autorizado\n*2* -${texts.humanize}\n`], servidor);
    },
    "errors_birthday": async (id, day, month, servidor) => {
        await sendMultiple(id, [`Não conseguimos realizar a sua simulação pois o seu aniversário é no próximo mês. A Caixa bloqueia transações alguns dias antes do saque-aniversário por questões de segurança.\n\n*Retorne o contato no dia ${day}/${month}* para realizar a contratação.\n`], servidor);
    },
    "errors_birth_date": async (id, servidor) => {
        await sendMultiple(id, ["Data de nascimento em formato incorreto\nDigite sua data de nascimento em formato 01/01/2023"], servidor);
    },
    "errors_minor": async (id, servidor) => {
        await sendMultiple(id, ["Esse tipo de contratação só é permitido para maiores de 18 anos. De qualquer maneira, permanecemos à disposição\n\nObrigada e até mais! Para contratar para outro CPF ou mais informações, digite *reiniciar*."], servidor);
    },
    "errors_cpf": async (id, servidor) => {
        await sendMultiple(id, ["Como não conseguimos validar seu CPF, você está sendo direcionado para a nossa equipe de atendimento. Aguarde, em breve você será atendido."], servidor);
    },
    "errors_cep": async (id, servidor) => {
        await sendMultiple(id, ["Não conseguimos validar seu CEP, mas podemos incluir um CEP genérico. Isso não dará problemas na sua proposta, basta fazer a validação.\n\n*1* - Prosseguir com CEP genérico\n*2* - Falar com atendimento humano"], servidor);
    },
    "emission": async (id, servidor) => {
        await sendMultiple(id, ["A data de emissão do documento é inválida ou está incorreta, informe seus dados novamente "], servidor);
        await wstext.document_choose(id);
    },
    "account": async (id, servidor) => {
        await sendMultiple(id, ["Alguma das informações enviadas não é válida ou não é aceita. Por gentileza, envie novos dados bancários. *Envie o código de três dígitos do seu banco* (digital só é permitido Nubank, ou Caixa Tem):\n\nNão sabe o código do banco? Procure abaixo:\n001: Banco do Brasil\n033: Santander\n104: Caixa Econômica Federal\n237: Bradesco\n260: Nubank\n237: Bradesco\n341: Itaú\nOutros:  https://www.conta-corrente.com/codigo-dos-bancos/ "], servidor);
    },
    "errors_invalid": async (id, servidor) => {
        await sendMultiple(id, ["Seu CPF é inválido, "], servidor);
    },

    "errors_caixa": async (id, servidor) => {
        await sendMultiple(id, ["Não conseguimos realizar a sua simulação pois o banco informou inconsistência no seu cadastro com Caixa. Verifique seu cadastro no aplicativo FGTS ou na Caixa Econômica.\n\n*1* - Encerrar atendimento\n*2* - Continuar antecipação com atendimento humano\n*3* - Contratar para outro CPF"], servidor);
    },
    "errors_default_api": async (id, servidor) => {
        await sendMultiple(id, ["Ocorreu um erro na comunicação com a API da caixa","Vamos tentar novamente", "Caso este erro permaneça, quando disponível, um atendente entrará em contato"], servidor);
    },
    "errors_default": async (id, servidor) => {
        await sendMultiple(id, ["Ocorreu um erro na comunicação com o servidor do banco","Vamos tentar em outro banco","Caso este erro permaneça, quando disponível, um atendente entrará em contato"], servidor);
    },
    "comercial_timeoff0": async (id, servidor) => {
        await sendMultiple(id, ["Nossa equipe de atendimento trabalha das *9h às 18h de segunda à sexta-feira*. Assim que o expediente iniciar te chamamos pra dar continuidade! 😊\n\nOu digite uma das opções:\n*Reiniciar*: para voltar ao início\n*Retomar*: para voltar de onde parou"], servidor);
    },
    "comercial_timeoff1": async (id, servidor) => {
        await sendMultiple(id, ["No momento não temos um atendente online. Nossa equipe está disponível para ajudá-lo das *9h às 18h de segunda a sexta-feira*.\n\nEnvie sua dúvida para lhe respondermos assim que o expediente iniciar ou digite uma opção:\n*Reiniciar*: para voltar ao início\n*Retomar*: para voltar de onde parou"], servidor);
    },
    "comercial_timeon0": async (id, servidor) => {
        await sendMultiple(id, ["*Nos conte mais sobre sua dúvida*, logo um de nossos especialistas vai lhe atender. 😊\n\nSe quiser voltar para o autoatendimento com a robô digite *retomar*."], servidor);
    },
    "comercial_timeon1": async (id, servidor) => {
        await sendMultiple(id, ["*Envie sua dúvida*, em breve um de nossos especialistas estará disponível para lhe atender, 😊\n\nSe preferir voltar para o atendimento da robô digite *retomar*."], servidor);
    },
    "comercial_simulation_on0": async (id, servidor) => {
        await sendMultiple(id, ["O Banco está com uma instabilidade no sistema de simulações. Vou lhe encaminhar para um especialista dar continuidade manualmente. Aguarde, em breve um especialista do nosso time irá lhe atender 😊"], servidor);
    },
    "comercial_simulation_on1": async (id, servidor) => {
        await sendMultiple(id, ["Pedimos desculpas pela instabilidade no sistema de simulações do banco. Para garantir um atendimento eficiente, encaminharemos seu caso para um de nossos especialistas.\n\nEm breve, um de nossos especialistas estará disponível para ajudá-lo. 😊"], servidor);
    },
    "comercial_simulation_off0": async (id, servidor) => {
        await sendMultiple(id, ["O Banco está com uma instabilidade no sistema de simulações. Nossa equipe de atendimento trabalha das *9h às 18h de segunda à sexta-feira*. Assim que o expediente iniciar te chamamos pra dar continuidade! 😊"], servidor);
    },
    "comercial_simulation_off1": async (id, servidor) => {
        await sendMultiple(id, ["Pedimos desculpas, mas o sistema de consulta está passando por oscilações em todo Brasil. Iremos encaminhar seu atendimento para um especialista continuar tentando.\n\nNo momento não temos um atendente online. Nossa equipe está disponível para ajudá-lo das *9h às 18h de segunda a sexta-feira*. Iremos lhe chamar assim que possível!"], servidor);
    },
    "void": async (id, servidor) => {
        await sendMultiple(id, ["*Entrando em modo de atendimentø...*"], servidor);
    },
    "contract_end": async(id, servidor) => {
        await sendMultiple(id, ["Olá! O prazo para pagamento do seu contrato é de até 24 horas após a validação dos seus dados e documentos. Caso você tenha feito a validação em até uma hora, aguarde a análise do Banco.\n\n🕓 Para verificar o status da sua proposta com um atendente digite *atendimento*.\n🆕 Para contratar para outro CPF, digite *reiniciar*."], servidor);
    },
    "start_default": async (id, servidor) => {
        const random = randomNumber(2);
        await sendMultiple(id, [`Olá! ${texts[`happy${random}`]}\n${texts[`introduction${random}`]}\n\n${texts[`cpf${random}`]}`], servidor);
    },
    "start_resell": async(id, name, servidor) => {
        if(name === "undefined") name = "";
        const random = randomNumber(2);
        await sendMultiple(id, [`Olá${" "+name || ""}! ${texts[`happy${random}`]}\n${texts[`introduction${random}`]}\n\nDigite a opção desejada:\n*1* - Iniciar contratação\n*2* - Contratação para outro CPF\n*3* - Falar com atendente`], servidor);
    },
    "start_new_cpf": async (id, servidor) => {
        await sendMultiple(id, ["Por gentileza, me informe o CPF"], servidor);
    },
    "do_not_disturb": async (id, servidor) => {
        await sendMultiple(id, ["Obrigada e até mais! Para contratar para outro CPF ou mais informações, digite *reiniciar*"], servidor);
    },
    "client_name": async (id, servidor) => {
        await sendMultiple(id, ["Ótima escolha! Parabéns por ser cliente SCALA!\n\nPreciso de mais informações para continuar seu cadastro. Primeiro, qual o seu *nome completo*?"], servidor);
    },
    "client_email": async (id, servidor) => {
        await sendMultiple(id, ["Ótimo, agora preciso do seu e-mail:"], servidor);
    },
    "client_momname": async (id, servidor) => {
        await sendMultiple(id, ["Ótimo, agora preciso do nome da sua mãe:"], servidor);
    },
    "client_public_exposed": async (id, servidor) => {
        await sendMultiple(id, ["Você é uma pessoa politicamente exposta?\n1 - Sim\n2 - Não"], servidor);
    },
    "client_birth_date": async (id, servidor) => {
        await sendMultiple(id, ["Digite sua data de nascimento:"], servidor);
    },
    "client_birth_place": async (id, servidor) => {
        await sendMultiple(id, ["Ótimo 😃\nVamos continuar o seu cadastro", "Qual a cidade da sua naturalidade?"], servidor);
    },
    "client_birth_state": async (id, servidor) => {
        await sendMultiple(id, ["Qual o estado da sua naturalidade, em siglas (Exemplo: SP):"], servidor);
    },
    "client_nationality": async (id, servidor) => {
        await sendMultiple(id, ["Qual a sua nacionalidade?\n1 - Brasileiro\n2 - Estrangeiro"], servidor);
    },
    "client_document_generic": async (id, servidor) => {
        await sendMultiple(id, ["Envie o *número do seu documento*?\n\nLembrando que mais tarde você vai precisar enviar uma foto de um documento físico e em bom estado ao banco."], servidor);
    },
    "account_choose": async (id, servidor) => {
        await sendMultiple(id, [texts.understand, "Tipo de conta\n*1* -Conta Corrente\n*2* -Conta Poupança:"], servidor);
    },
    "document_choose": async (id, servidor) => {
        await sendMultiple(id, ["Qual *tipo de documento* você vai usar na formalização? (Lembrando que mais tarde você vai precisar enviar uma foto desse documento físico e em bom estado ao banco)\n\n*1* - RG\n*2* - CNH\n*3* - Carteira de trabalho"], servidor);
    },
    "document_date": async (id, servidor) => {
        await sendMultiple(id, ["Data de emissão:\n*A data deve ser no formato DD/MM/AAAA\n(Exemplo: 10/01/2008)"], servidor);
    },
    "document_number_rg": async (id, servidor) => {
        await sendMultiple(id, ["Agora, informe o número o seu documento:"], servidor);
    },
    "document_number_ctps": async (id, servidor) => {
        await sendMultiple(id, ["Digite o número de série da sua carteira de trabalho:"], servidor);
    },
    "document_agency": async (id, document, servidor) => {
        await sendMultiple(id, [`Orgão Emissor ${document} (Exemplo: SSP):`], servidor);
    },
    "document_uf_emission": async (id, servidor) => {
        await sendMultiple(id, ["UF de emissão do seu documento, em siglas (Exemplo: SP):"], servidor);
    },
    "document_serial_number": async (id, servidor) => {
        await sendMultiple(id, ["Digite o número de série da sua carteira de trabalho:"], servidor);
    },
    "accept_document": async (id, tipoDocumento, numero, servidor) => {
        await sendMultiple(id, [`Documento: ${tipoDocumento}\nNúmero ${tipoDocumento}: ${numero}\n\n${texts.datamodification}`], servidor);
    },
    "address_cep": async (id, servidor) => {
        await sendMultiple(id, ["CEP do seu endereço atual:"], servidor);
    },
    "address_residence": async (id, servidor) => {
        await sendMultiple(id, ["Número da residência:"], servidor);
    },
    "address_state": async (id, servidor) => {
        await sendMultiple(id, ["Estado\n(Em siglas. Exemplo: SP):"], servidor);
    },
    "address_city": async (id, servidor) => {
        await sendMultiple(id, ["Cidade:"], servidor);
    },
    "address_neighborhood": async (id, servidor) => {
        await sendMultiple(id, ["Bairro:"], servidor);
    },
    "address_street": async (id, servidor) => {
        await sendMultiple(id, ["Rua:"], servidor);
    },
    "address_number": async (id, servidor) => {
        await sendMultiple(id, ["Número da residência:"], servidor);
    },
    "address_reference": async (id, servidor) => {
        await sendMultiple(id, ["Complemento:"], servidor);
    },
    "mercantil": async(id, servidor) => {
        await sendMultiple(id, ["Aguarde, já estamos simulando sua proposta no Banco Mercantil..."], servidor);
    },
    "pan": async(id, servidor) => {
        await sendMultiple(id, ["Aguarde, já estamos simulando sua proposta no Banco Pan..."], servidor);
    },
    "c6": async(id, servidor) => {
        await sendMultiple(id, ["Aguarde, já estamos simulando sua proposta no Banco C6..."], servidor);
    },
    "are_you_sure": async(id, servidor) => {
        await sendMultiple(id, ["Leia novamente os dados bancários e responda:\n*você se responsabiliza pelos dados informados acima*, confirmando que estão corretos e que a conta está no nome do contratante?\n\n*1* - Sim\n*2* - Não, quero alterar algum dado"], servidor);
    },
    "accept_address": async (id, cep, uf, cidade, bairro, logradouro, numero, servidor) => {
        await sendMultiple(id, [`CEP - ${cep}\nEstado - ${uf}\nCidade - ${cidade}\nBairro - ${bairro}\nLogradouro - ${logradouro}\nNumero da residência ${numero}\n`, "Você confirma seus dados?", `${texts.yesno}, quero alterar algum dado`], servidor);
    },
    "accept_phone": async (id, servidor) => {
        await sendMultiple(id, [`Posso usar esse celular que estamos conversando para o seu cadastro?\n${texts.yesno}`], servidor);
    },
    "phone_ddd": async (id, servidor) => {
        await sendMultiple(id, ["Preciso dos dois dígitos do seu DDD:"], servidor);
    },
    "phone_number": async (id, servidor) => {
        await sendMultiple(id, ["Ok. Agora preciso do número de celular para cadastro"], servidor);
    },
    "type_bank_account": async (id, servidor) => {
        await sendMultiple(id, ["Preciso do código de três dígitos do seu banco (Ex.: Banco do Brasil - 001):"], servidor);
        await delay(2000);
        await sendMultiple(id, ["Não sabe o código do banco? Procure abaixo:\n001: Banco do Brasil\n033: Santander\n077: Inter\n104: Caixa Econômica Federal\n237: Bradesco\n260: Nubank\n237: Bradesco\n341: Itaú\nOutros: https://www.conta-corrente.com/codigo-dos-bancos/"], servidor);
    },
    "bank_agency": async (id, servidor) => {
        await sendMultiple(id, ["Agência *(sem dígito)*:"], servidor);
    },
    "bank_code": async (id, servidor) => {
        await sendMultiple(id, ["Ótimo! Agora preciso apenas dos seus dados bancários para receber o depósito. *Envie o código de três dígitos do seu banco* (digital só é permitido Nubank ou Caixa Tem):\n\nNão sabe o código do banco? Procure abaixo:\n001: Banco do Brasil\n033: Santander\n104: Caixa Econômica Federal\n237: Bradesco\n260: Nubank\n237: Bradesco\n341: Itaú\nOutros: https://www.conta-corrente.com/codigo-dos-bancos/"], servidor);
    },
    "bank_op_cef": async (id, servidor) => {
        await sendMultiple(id, [ "Agora preciso do seu código de operação de conta Caixa:\n\n001: Conta Corrente Pessoa Física\n003: Conta Corrente Pessoa Jurídica\n013: Conta Poupança Pessoa Física\n023: Conta Caixa Fácil\n032: Conta Investimento Pessoa Física"], servidor);
    },
    "bank_account": async (id, servidor) => {
        await sendMultiple(id, ["Conta *(com dígito)*:"], servidor);
    },
    "bank_account_type": async (id, servidor) => {
        await sendMultiple(id, ["Tipo de conta\n*1* - Conta Corrente\n*2* - Conta Poupança"], servidor);
    },
    "bank_account_type_pan": async (id, servidor) => {
        await sendMultiple(id, ["Tipo de conta\n*1* - Conta Corrente\n*2* - Conta Poupança\n*4* - Conta Corrente Conjunta:\n*5* - Conta Poupança Conjunta"], servidor);
    },
    "bank_account_digit": async (id, servidor) => {
        await sendMultiple(id, ["Dígito da conta(*apenas um dígito*):"], servidor);
    },
    "accept_bank_account": async (id, banco, nomeBanco, agencia, tipoContaBancaria, conta, servidor) => {
        await sendMultiple(id, [`⚠️⚠️⚠️ *ATENÇÃO*: Revise seus dados bancários com atenção para o pagamento correto. O prazo para correção é de 48 horas em caso de envio incorreto.⚠️⚠️⚠️\n\nBanco - ${addLeadingZeros(banco * 1, 3)} - ${nomeBanco}\nAgência - ${agencia}\nConta - ${tipoContaBancaria}: ${conta}\n\n${texts.datamodification}`], servidor);
    },
    "accept_bank_account_mercantil": async (id, banco, nomeBanco, agencia, tipoContaBancaria, conta, digito, servidor) => {
        await sendMultiple(id, [`⚠️⚠️⚠️ *ATENÇÃO*: Revise seus dados bancários com atenção para o pagamento correto. O prazo para correção é de 48 horas em caso de envio incorreto.⚠️⚠️⚠️\n\nBanco - ${addLeadingZeros(banco * 1, 3)} - ${nomeBanco}\nAgência: ${agencia}\nConta - ${tipoContaBancaria}: *${conta}-${digito}*\n\n${texts.datamodification}`], servidor);
    },

    "unstable_connection": async (id, servidor) => {
        await sendMultiple(id, ["Quando a conexão com o banco for reestabelecida entraremos em contato"], servidor);
    },
    "documents_one": async (id, servidor) => {
        await sendMultiple(id, ["Agora envie 3 imagens, se certificando de ter foco e uma boa iluminação:\n\n1) Foto do seu documento FRENTE:"], servidor);
    },
    "documents_two": async (id, servidor) => {
        await sendMultiple(id, ["2) Foto do seu documento VERSO:"], servidor);
    },
    "documents_three": async (id, servidor) => {
        await sendMultiple(id, ["3) Uma selfie sua segurando o documento:"], servidor);
    },
    "pre_aproved": async (id, servidor) => {
        await sendMultiple(id, ["Parabéns! Seu contrato está pré-digitado! Em breve você receberá um link para aprovação da proposta.", "O sistema do FGTS está apresentando maior lentidão por problemas técnicos e alta demanda, o tempo previsto para envio está entre *12 e 24 horas*.","Obrigada por aguardar. Estamos trabalhando para finalizar sua contratação o mais rápido possível!"], servidor);
    },
    "pre_aproved_pan": async (id, servidor) => {
        await sendMultiple(id, ["Perfeito! Estamos enviando todas as suas informações ao banco, esse processo de pré-análise pode levar até um dia útil", "Aguarde esse prazo para receber o link e fazer a validação da proposta."], servidor);
    },
    "proposal_completed": async (id, bank, servidor) => {
        await sendMultiple(id, ["Proposta concluída! 😁", `Estamos validando suas informações com o banco ${bank}. Em até 10 minutos lhe enviaremos um SMS e WhatsApp com o link para aprovação.`], servidor);
    },
    "balance0": async (id, value, quantity, installments, servidor) => {
        await sendMultiple(id, [`Valor total liberado: *${value}* antecipando ${quantity} parcelas do saque-aniversário.\n\nParcelas:\n${installments}`, `O pagamento acontece na sua conta bancária em até 24 horas após a aprovação. Vamos dar sequência?\n\n${texts.yesno}, ainda tenho dúvidas`], servidor);
    },
    "balance1": async (id, value, quantity, installments, servidor) => {
        await sendMultiple(id, [`O valor total liberado para antecipação de ${quantity} parcelas do saque-aniversário é de *${value}*.\n\nEsse valor cai em até 24hs na sua conta bancária!\n\nParcelas correspondentes:\n${installments}`, `Vamos dar sequência?\n${texts.yesno}, ainda tenho dúvidas`], servidor);
    },
    "finish_contract": async (id, servidor) => {
        await sendMultiple(id, ["Maravilha! Agora é só você aguardar a análise do banco e pagamento da proposta. O prazo é de 1 dia útil.\n\nObrigada por escolher a Scala!"], servidor);
    },
    "invalid_option12": async (id, servidor) => {
        await sendMultiple(id, [`${texts.understand}\nPreciso que voce digite *1* ou *2*`], servidor);
    },
    "invalid_option123456": async (id, servidor) => {
        await sendMultiple(id, [`${texts.understand}\nPreciso que voce digite *1*, *2*, *3*, *4*, *5* ou *6*`], servidor);
    },
    "invalid_option123": async (id, servidor) => {
        await sendMultiple(id, [`${texts.understand}\nPreciso que voce digite *1*, *2* ou *3*`], servidor);
    },
    "client_invalid_name": async (id, servidor) => {
        await sendMultiple(id, ["Inválido. Digite novamente seu nome completo: *Nome e Sobrenome*"], servidor);
    },
    "invalid_name": async (id, servidor) => {
        await sendMultiple(id, [`${texts.understand}. Digite novamente seu nome completo: *Nome e Sobrenome*`], servidor);
    },
    "invalid_name_mom": async (id, servidor) => {
        await sendMultiple(id, ["Nome da mãe inválido. Digite novamente o nome completo: *Nome e Sobrenome*"], servidor);
    },
    "invalid_email": async (id, servidor) => {
        await sendMultiple(id, ["O e-mail está em formato inválido.","Digite um e-mail válido. Ou, se preferir, digite:", "*naotem@gmail.com*"], servidor);
    },
    "invalid_date": async (id, servidor) => {
        await sendMultiple(id, ["A Data está em formato incorreto\nEla deve ser no formato DD/MM/AAAA\nExemplo: 10/01/2008"], servidor);
    },
    "invalid_addnumber": async (id, servidor) => {
        await sendMultiple(id, [texts.understand, "Preciso dos números do seu endereço","Caso não tenha número digite *SN*"], servidor);
    },
    "invalid_number": async (id, servidor) => {
        await sendMultiple(id, ["Não consegui validar o número do seu documento. Digite novamente apenas com números:"], servidor);
    },
    "invalid_uf": async (id, servidor) => {
        await sendMultiple(id, ["A UF está em formato incorreto\n( A UF deve ser envido em siglas. Exemplo: SP):"], servidor);
    },
    "invalid_cep": async (id, servidor) => {
        await sendMultiple(id, [`Não conseguimos validar seu CEP.\n${texts.typeagain}`], servidor);
    },
    "invalid_cep1": async (id, servidor) => {
        await sendMultiple(id, ["Ainda não conseguimos validar seu CEP. Caso seja um CEP genérico, envie um CEP específico próximo da sua região:"], servidor);
    },
    "invalid_cpf": async (id, servidor) => {
        await sendMultiple(id, ["Desculpe seu CPF não pôde ser validado 😕\nPor gentileza, me informe novamente um CPF válido:"], servidor);
    },
    "invalid_cpf1": async (id, servidor) => {
        await sendMultiple(id, ["Seu CPF ainda está incorreto", "Informe um CPF válido ou digite *Atendimento* para atendimento humano:"], servidor);
    },
    "invalid_ddd": async (id, servidor) => {
        await sendMultiple(id, ["Seu DDD está em um formato inválido", texts.typeagain], servidor);
    },
    "invalid_phone": async (id, servidor) => {
        await sendMultiple(id, ["Seu Telefone está em um formato inválido", texts.typeagain], servidor);
    },
    "invalid_bank": async (id, servidor) => {
        await sendMultiple(id, ["O código do banco é inválido, digite no formato *001*"], servidor);
    },
    "invalid_bank_restricted": async (id, servidor) => {
        await sendMultiple(id, ["O código do seu banco é restrito, é necessário outro banco para continuar o cadastro."], servidor);
    },
    "invalid_bank_341": async (id, servidor) => {
        await sendMultiple(id, ["Nesta agência não é realizado pagamentos, caso não tenha outra conta neste banco informe outro banco para depósito"], servidor);
    },
    "invalid_op_cef": async (id, servidor) => {
        await sendMultiple(id, ["O número da operação está incorreto ou inválido.", texts.typeagain], servidor);
        await wstext.bank_op_cef(id);
    },
    "invalid_agency": async (id, servidor) => {
        await sendMultiple(id, ["O número da agência está incorreto ou inválido.\nDigite novamente (até 4 caracteres):"], servidor);
    },
    "invalid_account": async(id, servidor) => {
        await sendMultiple(id, ["A conta informada tem quantidade de caracteres divergentes. Confira o número da conta corretamente e envie novamente sem os zeros iniciais."], servidor);
    },
    "invalid_phone_proposal": async(id, servidor) => {
        await sendMultiple(id, ["Seu número de celular é inválido"], servidor);
        await wstext.accept_phone(id);
    },
    "invalid_mom_name": async(id, servidor) => {
        await sendMultiple(id, ["Nome da mãe inválido. Digite novamente o nome completo: *Nome e Sobrenome*"], servidor);
    },
    "invalid_digit": async (id, servidor) => {
        await sendMultiple(id, ["O seu dígito deve único, e em formato numérico, caso seja X coloque 0"], servidor);
    },
    "invalid_document_proposal": async (id, servidor) => {
        await sendMultiple(id, ["Não consegui validar as informações do seu documento.\nPor favor, preencha novamente com bastante atenção\n\nQual tipo de documento você vai usar na formalização?\n*1* - RG\n*2* - CNH\n*3* - Carteira de trabalho"], servidor);
    },
    "invalid_client_nationality": async (id, servidor) => {
        await sendMultiple(id, ["A sua informação de nacionalidade é inválida, digite novamente"], servidor);
        await wstext.client_nationality(id);
    },
    "invalid_document_proposal_pan": async (id, servidor) => {
        await sendMultiple(id, ["Não consegui validar o número do seu documento. Digite novamente apenas com números"], servidor);
    },
    "invalid_bank_proposal": async (id, servidor) => {
        await sendMultiple(id, ["O Banco ou agência informado é inválido ou não é aceito para essa contratação.\n*Envie o código de três dígitos do seu banco* (digital só é permitido Nubank, ou Caixa Tem):\n\nNão sabe o código do banco? Procure abaixo:\n001: Banco do Brasil\n033: Santander\n104: Caixa Econômica Federal\n237: Bradesco\n260: Nubank\n237: Bradesco\n341: Itaú\nOutros:  https://www.conta-corrente.com/codigo-dos-bancos/ "], servidor);
    },
    "invalid_cep_proposal": async (id, servidor) => {
        await sendMultiple(id, ["Cep informado não encontrado", "Digite um CEP válido"], servidor);
    },
    "invalid_email_proposal": async (id, servidor) => {
        await sendMultiple(id, ["O e-mail está em formato inválido.","Digite um e-mail válido. Ou, se preferir, digite:", "*naotem@gmail.com*"], servidor);
    },
    "invalid_format_image": async (id, servidor) => {
        await sendMultiple(id, ["A sua mensagem deve ser uma imagem"], servidor);
    },
};

const banktext = {
    unstable_fgts: async (id, servidor) => {
        await sendMultiple(id, ["Aguarde alguns instantes! O sistema do FGTS está instável, mas continuaremos tentando e em breve você receberá sua simulação"], servidor);
    },
    proposal_input: async (id) => [
        await sendMultiple(id, ["Estamos com instabilidade no sistema do banco, aguarde alguns instantes que tentarei digitar sua proposta novamente no banco"])
    ],
    link: async (id, link, servidor) => {
        await sendMultiple(id, ["Estamos quase acabando, agora falta apenas a aprovação da sua proposta. Nesta etapa é necessário o aceite, imagens do seu documento frente e verso, e sua validação facial.", "*Acesse o link e aprove a sua proposta:*", `${link}`, "Após acessar o link confirme abaixo:\n*1* - Aprovação concluída\n*2* - Tenho dúvidas ou preciso de ajuda com a aprovação\n"], servidor);
    },
    error_link: async (id, servidor) => {
        await sendMultiple(id, ["Houve problema na digitação do proposta, um atendente entrará em contato"], servidor);
    },
    error_link_pan: async (id, servidor) => {
        await sendMultiple(id, ["Houve problema na digitação do proposta, um atendente entrará em contato"], servidor);
    }
};

const infotext = {
    message: (id, name, value, server, bank) => `Olá${" "+name || ""}! Correspondente ${bank} informa: você possui *${value}* disponível para liberação via antecipação do saque-aniversário do FGTS. Digite *OK* para iniciar a contratação ou saber mais detalhes!`,
    messagecaptacao0: (name, value, bank) => [`Olá${" "+name || ""}! Correspondente ${bank} informa: você possui *${value}* disponível para liberação via antecipação do saque-aniversário do FGTS. Digite *OK* para iniciar a contratação ou saber mais detalhes!`],
    messagecaptacao1: (name, value) => [`Olá${" "+name || ""}, tudo bem? Você sabia que já tem *${value}* liberado para antecipar do seu saque-aniversário do FGTS? Digite OK que eu te mando mais informações :)`],
    messagecaptacao2: (name, value) => [`Olá${" "+name || ""}! Aqui é a Paola, sou a robô de antecipação do FGTS. Você possui *${value}* disponível para pagamento em até 24 horas após a aprovação. Vamos iniciar seu atendimento?`],
    messagecaptacao3: (name, value) => [`Olá${" "+name || ""}, antecipe seu FGTS e receba *${value}* em até 24 horas após a aprovação. Digite OK para iniciar!`],
    messagecaptacao4: (name, value) => [`Olá${" "+name || ""}! Você já pode antecipar seu FGTS novamente! Valor disponível de *${value}*. Digite OK para iniciar a contratação ou saber mais detalhes!`],
    messagecaptacaoUra: (name, value) => [`Olá${" "+name || ""}, estou retornando seu interesse na antecipação do FGTS. Receba *${value}* em até 24 horas após a aprovação. Digite SIM para iniciar!`],
    captacao0: async(id, name, value, server, bank) => {
        if(id) return await sendMultiple(id, infotext.messagecaptacao0(name, value, bank), server);
    },
    captacao1: async(id, name, value, server) => {
        if(id) return await sendMultiple(id, infotext.messagecaptacao1(name, value), server);
    },
    captacao2: async(id, name, value, server) => {
        if(id) return await sendMultiple(id, infotext.messagecaptacao2(name, value), server);
    },
    captacao3: async(id, name, value, server) => {
        if(id) return await sendMultiple(id, infotext.messagecaptacao3(name, value), server);
    },
    captacao4: async(id, name, value, server) => {
        if(id) return await sendMultiple(id, infotext.messagecaptacao4(name, value), server);
    },
    captacaoUra: async(id, name, value, server) => {
        if(id) return await sendMultiple(id, infotext.messagecaptacaoUra(name, value), server);
    },
    pegInfo: async(id, name, value, server) => {
        id && await sendMultiple(id, [`Olá${" "+name || ""}! PEG DE VOLTA informa: você possui *${value}* disponível para liberação via antecipação do saque-aniversário do FGTS. Digite *OK* para iniciar a contratação ou saber mais detalhes!`], server);
    }
};

const cadence = {
    first0: async (id, servidor) => {
        await sendMultiple(id, ["Estamos quase acabando. Envie a informação pedida anteriormente"], servidor);
    },
    first1: async (id, servidor) => {
        await sendMultiple(id, ["Falta pouco para finalizarmos. Envie a informação pedida anteriormente."], servidor);
    },
    second0: async (id, servidor) => {
        await sendMultiple(id, ["Vou aproveitar pra deixar com você o nosso site, lá você encontrará todas as nossas informações, inclusive CNPJ: http://scalapromotora.com.br\n\nFicou com alguma dúvida? Temos uma equipe para te ajudar. Continue a contratação ou digite *atendimento* para atendimento humano  🤓"], servidor);
    },
    second1: async (id, servidor) => {
        await sendMultiple(id, ["Para conferir os dados da empresa e CNPJ, acesse nosso site:  http://scalapromotora.com.br/\n\nTambém temos uma equipe para te ajudar. Continue a contratação ou digite *atendimento* para atendimento humano  🤓"], servidor);
    },
    third0: async (id) => {
        await sendAudio(id, "./src/app/media/audios/WhatsApp Audio 2023-01-12 at 4.49.11 PM.ogg");
    },
    third1: async (id) => {
        await sendAudio(id, "./src/app/media/audios/WhatsApp Audio 2023-01-12 at 4.49.11 PM.ogg");
    },
};

const multiple_hidden = async(id, object, servidor) => {
    await sendMultiple(id, [`${word_hidden(object)}\n\nVocê confirma seus dados?\n${texts.yesno}, quero alterar algum dado`], servidor);
};

const multiple_not_hidden = async(id, object, servidor) => {
    await sendMultiple(id, [`${word_not_hidden(object)}\n\nVocê confirma seus dados?\n${texts.yesno}, quero alterar algum dado`], servidor);
};


module.exports = { wstext, infotext, banktext, cadence, multiple_hidden, multiple_not_hidden };