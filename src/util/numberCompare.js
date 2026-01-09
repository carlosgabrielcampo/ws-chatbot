const number_compare = (obj) => {
    const lemit1 = obj?.Lemit_1 * 1;
    const lemit2 = obj?.Lemit_2 * 1;
    const lemit3 = obj?.Lemit_3 * 1;
    const lemit4 = obj?.Lemit_4 * 1;
    const pan = obj?.pan * 1;
    const main = obj?.main;
    const coluna0 = obj?.coluna0 || obj?.["0"] * 1;
    const compare = {
        "1": { test: main , value: 1},
        "2": { test: lemit1 === pan, value: 1, phone: lemit1},
        "3": { test: lemit2 === pan, value: 1, phone: lemit2},
        "4": { test: lemit3 === pan, value: 1, phone: lemit3},
        "5": { test: lemit4 === pan, value: 1, phone: lemit4},
        "6": { test: lemit1 === coluna0 , value: 2, phone: lemit1},
        "7": { test: lemit2 === coluna0 , value: 2, phone: lemit2},
        "8": { test: lemit3 === coluna0 , value: 2, phone: lemit3},
        "9": { test: lemit4 === coluna0 , value: 2, phone: lemit4},
        "10": { test: pan === coluna0 , value: 3, phone: pan},
        "11": { test: lemit1 > 0 , value: 4, phone: lemit1},
        "12": { test: lemit2 > 0 , value: 4, phone: lemit2},
        "13": { test: lemit3 > 0 , value: 4, phone: lemit3},
        "14": { test: lemit4 > 0 , value: 4, phone: lemit4},
        "15": { test: pan > 0 , value: 5, phone: pan},
        "16": { test: coluna0 > 0 , value: 6, phone: coluna0},
        "17": { test: true , value: 7, phone: ""},
    };
    const priority = Object.values(compare).filter((e) => e.test === true);
    return priority;
};

module.exports = { number_compare };