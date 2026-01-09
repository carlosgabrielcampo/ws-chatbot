require("dotenv").config();
module.exports.Clientes_SaquesAniversario_Saldo = (req, res) => {
    let responses = {
        "10119753944": {
            date: "2023-04-13T20:48:02.168Z",
            message: "Cliente não autorizou a instituição a realizar a operação fiduciária."

        },
        "1681419307939": { 
            date: "2023-04-13T20:49:19.322Z", 
            message: ""  
        },
        "24640478801": {
            cpf: 24640478801,
            valorTotal: 950.66,
            quantidadeParcelas: 10,
            dataReferenciaSaldo: "2023-04-13T00:00:00",
            parcelas: [
                { dataRepasse: "2023-06-01T00:00:00", valor: 192.34 },
                { dataRepasse: "2024-06-01T00:00:00", valor: 153.88 },
                { dataRepasse: "2025-06-01T00:00:00", valor: 184.66 },
                { dataRepasse: "2026-06-01T00:00:00", valor: 129.26 },
                { dataRepasse: "2027-06-01T00:00:00", valor: 90.48 },
                { dataRepasse: "2028-06-01T00:00:00", valor: 63.33 },
                { dataRepasse: "2029-06-01T00:00:00", valor: 59.12 },
                { dataRepasse: "2030-06-01T00:00:00", valor: 44.34 },
                { dataRepasse: "2031-06-01T00:00:00", valor: 22.17 },
                { dataRepasse: "2032-06-01T00:00:00", valor: 11.08 }
            ],
            createdAt: 1681419164718
        }
    };
    res.status(200).json(responses[req.body.cpf]);
};

module.exports.Simulacoes_Fgts = (req, res) => {
    let responses = {
        "1681479133137": {
            key: "SimulacoesMbCoreException",
            errors: [ [Object] ],
            message: "Ocorreu um erro de negócio, verifique a propriedade 'errors' para obter detalhes.",
            createdAt: 1681479133137
        },
        "0000000000": {
            key: "SimulacoesMbCoreException",
            errors: [
                {
                    key: "ErroNegocioSimulaParcelaInformadaSic",
                    message: "134-QUANTIDADE DE PARCELAS NAO INFORMADA                                                                                                                                                               "
                }
            ],
            message: "Ocorreu um erro de negócio, verifique a propriedade 'errors' para obter detalhes.",
            createdAt: 1681479813853
        },
        "24640478801": {
            simulacao: {
                id: "bf3af01d-872e-48ba-b860-4ce48c59165d",
                valorEmprestimo: 116.43,
                valorFinanciado: 120.39,
                valorIof: 3.96,
                valorTac: 0,
                taxaJurosMes: 2.05,
                taxaJurosAno: 27.57,
                dataPrimeiroVencimento: "2024-03-01T00:00:00",
                dataUltimoVencimento: "2031-03-01T00:00:00",
                diaVencimentoParcela: 1,
                dataMovimento: "2023-04-14T00:00:00",
                valorTarifa: 0,
                taxaEfetivaMes: 2.17,
                taxaEfetivaAno: 29.38,
                calculoParcelas: [
                    {
                        numeroParcela: 1,
                        dataParcela: "2024-03-01T00:00:00",
                        valorParcela: 32.75,
                        valorJurosParcela: 29.3,
                        valorTotalParcela: 62.05,
                        valorIof: 0.99,
                        percentualJurosParcela: 47.21
                    },
                    {
                        numeroParcela: 2,
                        dataParcela: "2025-03-01T00:00:00",
                        valorParcela: 18.9,
                        valorJurosParcela: 24.54,
                        valorTotalParcela: 43.44,
                        valorIof: 0.64,
                        percentualJurosParcela: 56.49
                    },
                    {
                        numeroParcela: 3,
                        dataParcela: "2026-03-01T00:00:00",
                        valorParcela: 21.29,
                        valorJurosParcela: 19.25,
                        valorTotalParcela: 40.54,
                        valorIof: 0.72,
                        percentualJurosParcela: 47.48
                    },
                    {
                        numeroParcela: 4,
                        dataParcela: "2027-03-01T00:00:00",
                        valorParcela: 17.12,
                        valorJurosParcela: 13.29,
                        valorTotalParcela: 30.41,
                        valorIof: 0.58,
                        percentualJurosParcela: 43.7
                    },
                    {
                        numeroParcela: 5,
                        dataParcela: "2028-03-01T00:00:00",
                        valorParcela: 6.68,
                        valorJurosParcela: 8.52,
                        valorTotalParcela: 15.2,
                        valorIof: 0.23,
                        percentualJurosParcela: 56.05
                    },
                    {
                        numeroParcela: 6,
                        dataParcela: "2030-03-01T00:00:00",
                        valorParcela: 12.74,
                        valorJurosParcela: 15.1,
                        valorTotalParcela: 27.84,
                        valorIof: 0.43,
                        percentualJurosParcela: 54.23
                    },
                    {
                        numeroParcela: 7,
                        dataParcela: "2031-03-01T00:00:00",
                        valorParcela: 10.91,
                        valorJurosParcela: 3.01,
                        valorTotalParcela: 13.92,
                        valorIof: 0.37,
                        percentualJurosParcela: 21.62
                    }
                ],
                valorSomatorioParcelas: 233.4,
                createdAt: 1681480092629,
                id_code: "bf3af01d-872e-48ba-b860-4ce48c59165d"
            }
        }
    };
    res.status(200).json(responses[req.body.cpf]);
};

module.exports.Propostas_FGTS = (req, res) => {
    res.status(200).json(req.body);
};

module.exports.Propostas = (req, res) => {
    res.status(200).json(req.body);
};

module.exports.AutorizacoesDigitais_Proposta = (req, res) => {
    // {
    //       id: 'f0f6947e-70f8-4550-a289-52a5926615ad',
    //       linkEncurtado: 'https://mbpcb.page.link/1LkrWbFBAMFeMcaj6'
    //   }
      
    res.status(200).json(req.body);
};