const converter = {
    string: (value) => `${value}`,
    integer: (value) => converter?.string(value)?.match(/\d/g)?.join("")*1 || 0,
    boolean: (value) => typeof(value) === "boolean" ? value : false,
    date: (value) => typeof(new Date(value)?.getMonth) === "function" ? new Date(value) : new Date(0),
    number: (value) => value ? parseFloat(`${value}`?.replace(",", ".")?.replace(/[^\d.-]/g, ""))  : 0,
    two_digits: (value) => value ? converter?.number(value)?.toFixed(2)*1 || 0: 0
};
const client_obj = {
    cpf: (e) => converter.integer(e),
    main_whats: (e) => converter.string(e),
    client_data: {
        name: (e) => converter.string(e),
        sex: (e) => converter.string(e),
        birth_date: (e) => converter.date(e),
        mother_name: (e) => converter.string(e),
        father_name: (e) => converter.string(e),
        birth_place: {
            city: (e) => converter.string(e),
            state: (e) => converter.string(e),
        },
        nationality: "brasileiro",
        death_status: (e) => converter.boolean(e),
        address: {
            street: (e) => converter.string(e),
            neighborhood: (e) => converter.string(e),
            number: (e) => converter.string(e),
            complement: (e) => converter.string(e),
            cep: (e) => converter.integer(e),
            city: (e) => converter.string(e),
            state: (e) => converter.string(e),
            main_address: (e) => converter.boolean(e),
            createdAt: Date.now()
        },
        bank_data: {
            account_type: (e) => converter.string(e),
            bank_code: (e) => converter.integer(e),
            account: (e) => converter.integer(e),
            account_digit: (e) => converter.string(e),
            bank_branch: (e) => converter.integer(e),
            bank_branch_digit: (e) => converter.integer(e),
            identifier: {},
            createdAt: Date.now()
        },
        documents: {
            type: (e) => converter.string(e),
            number: (e) => converter.string(e),
            emission_date: (e) => converter.date(e),
            issuing_agency: (e) => converter.string(e),
            serial_number: (e) => converter.string(e),
            uf: (e) => converter.string(e),
        },
        contact: {
            phones: {
                phone: (e) => converter.integer(e), 
                ddd: (e) => converter.integer(e),
                ddi: 55,
                origin: (e) => converter.string(e),
                is_whatsapp: (e) => converter.boolean(e),
                do_not_disturb: (e) => converter.boolean(e),
                owner: (e) => converter.boolean(e),
                useful: true,
                createdAt: Date.now()
            },
            emails: {
                email: (e) => converter.string(e),
                useful: (e) => converter.boolean(e),
                main_email: (e) => converter.boolean(e),
                createdAt: Date.now()
            },
        },
    },
    messages: {
        timestamp: (e) => converter.date(e),
        body: (e) => converter.string(e),
        type: (e) => converter.string(e),
        step: (e) => converter.string(e),
    },
    politic_status_blocked: false,
    obs: (e) => converter.string(e),
    log: [],
};
module.exports = { client_obj };

