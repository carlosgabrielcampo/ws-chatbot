const { clientAPI } = require("../api/databases/client");
const { readFile, writeFile } = require("./fileHandle");

const savingInfoByCPF = async(cpf, info, server) => {
    const serverpath = server ? `${server}` : false; 
    return await clientAPI.put(cpf, "cpf", info, serverpath);
};

const retrieveDatabasePhone = async(array, origin_list) => {
    for (let index = 0; index < array.length; index++) {
        console.log({index});
        const element = array[index];
        const cpf = `${element?.cpf}`?.match(/\d/g)?.join("")*1;
        const client = await clientAPI.get_id(cpf, "cpf");
        if(client?.cpf){
            if(client?.main_whats) element.main = client?.main_whats?.replace("@c.us", "");
            client?.client_data?.contact?.phones?.forEach(({origin, ddd, phone}) => {
                if(origin_list.includes(origin)){
                    element[origin] = `${ddd}${phone}`;
                }
            });
        }
        await writeFile("pbphone.json", JSON.stringify(array));
    }
};

const phonefilecreate = async() => {
    const file = JSON.parse(await readFile("src/app/doc/lemit/csvjson.json"));
    let array = await retrieveDatabasePhone(file, ["main", "Lemit_1", "Lemit_2", "Lemit_3", "Lemit_4", "Lemit_Fixo_1", "Lemit_Fixo_2", "Lemit_Fixo_3", "Lemit_Fixo_4"]);
    
};
phonefilecreate();
module.exports = {savingInfoByCPF, retrieveDatabasePhone};