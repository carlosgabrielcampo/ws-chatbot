module.exports.c6SuccessMock = {
    "date": "2023-02-28T12:37:30.383Z",
    "base_date": "2023-02-28",
    "financed_amount": 370.14,
    "installment_quantity": 10,
    "principal_amount": 360.3,
    "gross_amount": 628.31,
    "net_amount": 360.3,
    "iof_amount": 9.84,
    "monthly_customer_rate": 2.04,
    "annual_customer_rate": 27.4223,
    "monthly_effective_total_cost_rate": 2.1698,
    "annual_effective_total_cost_rate": 29.8445,
    "first_due_date": "2023-06-01",
    "last_due_date": "2032-06-01",
    "installments": [
        {
            "number": 1,
            "amount": 126.5,
            "due_date": "2023-06-01"
        },
        {
            "number": 2,
            "amount": 151.81,
            "due_date": "2024-06-01"
        },
        {
            "number": 3,
            "amount": 106.27,
            "due_date": "2025-06-01"
        },
        {
            "number": 4,
            "amount": 74.38,
            "due_date": "2026-06-01"
        },
        {
            "number": 5,
            "amount": 60.82,
            "due_date": "2027-06-01"
        },
        {
            "number": 6,
            "amount": 45.35,
            "due_date": "2028-06-01"
        },
        {
            "number": 7,
            "amount": 33.7,
            "due_date": "2029-06-01"
        },
        {
            "number": 8,
            "amount": 16.84,
            "due_date": "2030-06-01"
        },
        {
            "number": 9,
            "amount": 8.43,
            "due_date": "2031-06-01"
        },
        {
            "number": 10,
            "amount": 4.21,
            "due_date": "2032-06-01"
        }
    ],
    "expenses": [],
    "anniversary_withdraw_available": 628.31,
    "createdAt": 1677587850383,
    "correspondent": {
        "name": "NOVA",
        "promoter_code": "002055",
        "username": "05543719957_002055",
        "password": "Banco@2020",
        "typist_code": "245336",
        "tax_identifier_of_certified_agent": "05543719957"
    }
};
module.exports.panSuccessMock = {
    "createdAt": new Date(),
    "condicoes_credito": [
        {
            "sucesso": true,
            "mensagem_erro": "",
            "prazo": 10,
            "codigo_tabela_financiamento": "900001",
            "descricao_tabela_financiamento": "FGTS_CORBAN",
            "codigo_produto": "000025",
            "descricao_produto": "FGTS",
            "despesas": [
                {
                    "codigo": 78,
                    "grupo": "SEGURO",
                    "financiada": false,
                    "tipo": 7,
                    "inclusa": false,
                    "numero_item": 3,
                    "valor_calculado": 27
                }
            ],
            "parcelas": [
                {
                    "num_parcela": "1",
                    "valor_parcela": 123.65,
                    "data_vencimento": "01/04/2023"
                },
                {
                    "num_parcela": "2",
                    "valor_parcela": 86.55,
                    "data_vencimento": "01/04/2024"
                },
                {
                    "num_parcela": "3",
                    "valor_parcela": 60.58,
                    "data_vencimento": "01/04/2025"
                },
                {
                    "num_parcela": "4",
                    "valor_parcela": 42.41,
                    "data_vencimento": "01/04/2026"
                },
                {
                    "num_parcela": "5",
                    "valor_parcela": 39.58,
                    "data_vencimento": "01/04/2027"
                },
                {
                    "num_parcela": "6",
                    "valor_parcela": 29.69,
                    "data_vencimento": "01/04/2028"
                },
                {
                    "num_parcela": "7",
                    "valor_parcela": 23.36,
                    "data_vencimento": "01/04/2029"
                },
                {
                    "num_parcela": "8",
                    "valor_parcela": 11.67,
                    "data_vencimento": "01/04/2030"
                },
                {
                    "num_parcela": "9",
                    "valor_parcela": 5.84,
                    "data_vencimento": "01/04/2031"
                },
                {
                    "num_parcela": "10",
                    "valor_parcela": 2.92,
                    "data_vencimento": "01/04/2032"
                }
            ],
            "taxa_apropriacao_anual": 27.42285968516873,
            "taxa_apropriacao_mensal": 2.040038146022849,
            "taxa_cet_anual": 29.8971,
            "taxa_cet_mensal": 2.1732,
            "taxa_referencia_anual": 27.4223,
            "taxa_referencia_mensal": 2.04,
            "valor_bruto": 426.25,
            "valor_cliente": 255.5,
            "valor_financiado": 261.86,
            "valor_solicitado": 255.5,
            "valor_iof": 6.36,
            "valor_liquido": 255.5,
            "tipo_simulacao": "ValorTotalSaque"
        }
    ],
    correspondent: {
        name: "SCALA", 
        username: "09392278942_007478",
        password: "Lari@2023!",
        grant_type: "client_credentials+password",
        ApiKey: "l77df2f00ffa9f44c4b5405b0398db6f6a",
        Authorization: "Basic bDc3ZGYyZjAwZmZhOWY0NGM0YjU0MDViMDM5OGRiNmY2YTo0MGVmNTAyMzk3YTg0NGRjODExNDBjNjNjZmUyYTliYg=="
    }
};
module.exports.mercantilSuccessMock = {
    createdAt: "2023-05-25T05:04:37.705Z",
    _id: "63f996e5b818ead5139db3a9",
    valorEmprestimo: 147.46,
    valorFinanciado: 152.47,
    valorIof: 5.01,
    valorTac: 0,
    taxaJurosMes: 2.05,
    taxaJurosAno: 27.57,
    dataPrimeiroVencimento: "2024-01-01T00:00:00",
    dataUltimoVencimento: "2031-01-01T00:00:00",
    diaVencimentoParcela: 1,
    dataMovimento: "2023-02-27T00:00:00",
    valorTarifa: 0,
    taxaEfetivaMes: 2.17,
    taxaEfetivaAno: 29.38,
    calculoParcelas: [
        {
            numeroParcela: 1,
            dataParcela: "2024-01-01T00:00:00",
            valorParcela: 29.18,
            valorJurosParcela: 35.32,
            valorTotalParcela: 64.5,
            valorIof: 0.85,
            percentualJurosParcela: 54.75
        },
        {
            numeroParcela: 2,
            dataParcela: "2025-01-01T00:00:00",
            valorParcela: 16.96,
            valorJurosParcela: 34.63,
            valorTotalParcela: 51.59,
            valorIof: 0.57,
            percentualJurosParcela: 67.12
        },
        {
            numeroParcela: 3,
            dataParcela: "2026-01-01T00:00:00",
            valorParcela: 32.13,
            valorJurosParcela: 29.78,
            valorTotalParcela: 61.91,
            valorIof: 1.08,
            percentualJurosParcela: 48.1
        },
        {
            numeroParcela: 4,
            dataParcela: "2027-01-01T00:00:00",
            valorParcela: 22.56,
            valorJurosParcela: 20.78,
            valorTotalParcela: 43.34,
            valorIof: 0.76,
            percentualJurosParcela: 47.94
        },
        {
            numeroParcela: 5,
            dataParcela: "2028-01-01T00:00:00",
            valorParcela: 15.88,
            valorJurosParcela: 14.46,
            valorTotalParcela: 30.34,
            valorIof: 0.54,
            percentualJurosParcela: 47.65
        },
        {
            numeroParcela: 6,
            dataParcela: "2029-01-01T00:00:00",
            valorParcela: 11.19,
            valorJurosParcela: 10.05,
            valorTotalParcela: 21.24,
            valorIof: 0.38,
            percentualJurosParcela: 47.31
        },
        {
            numeroParcela: 7,
            dataParcela: "2030-01-01T00:00:00",
            valorParcela: 12.94,
            valorJurosParcela: 6.88,
            valorTotalParcela: 19.82,
            valorIof: 0.44,
            percentualJurosParcela: 34.71
        },
        {
            numeroParcela: 8,
            dataParcela: "2031-01-01T00:00:00",
            valorParcela: 11.63,
            valorJurosParcela: 3.24,
            valorTotalParcela: 14.87,
            valorIof: 0.39,
            percentualJurosParcela: 21.78
        }
    ],
    valorSomatorioParcelas: 307.61,
    id_code: "fe01c7b3-f2ea-4e23-b729-4dec1802a2ee",
    correspondent: {
        name: "NOVA", 
        "UsuarioDigitador": "X377080",
        "CpfAgenteCertificado": 5543719957,
        "UfAtuacao": "SC",
        MercAPIID: "l7697e55a1cf274904a8ae2cce19ebd48e",
        MercAPISecret: "9931ecc2efe4478cb6253548da2c6883"
    },
};

module.exports.mercantilQuotaMock = { "result": { "error.message": "Quota has exceeded" } };