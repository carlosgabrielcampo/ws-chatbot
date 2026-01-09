const { getRowsFunc, updateValueFunc } = require("../../../api/googleAPI");

/*
    Jogamos as respostas das apis dos bancos em um spreadsheet, (apenas apensavamos), 
    a função abaixo verifica os numeros dos cpf, se já existir o cpf na planilha, 
    altera a coluna, se não estiver, adiciona no spreadsheet;
*/
const notDuplicatedCpf = async (id, vlr, pageName)  =>{
    const {data} = await getRowsFunc(id, pageName);
    const values = data.values;
    const arr = [];
    const arrN = [];

    values.push(vlr);

    values.map(e =>{
        if(!arrN.includes(e[0])){
            arrN.push(e[0]);
            arr.push(e);
        }else{
            const newValue = arr.find(u => u[0] === e[0]);
            newValue[1] = e[1];
        }
    });
    await updateValueFunc(id, arr, pageName);
};


module.exports = {notDuplicatedCpf};