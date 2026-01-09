const { HTTPReq } = require("../../api/apiHandle");
const { clientAPI } = require("../../api/databases/client");
const { writeFile, readFile } = require("../../util/fileHandle");
require("dotenv").config();
function contains_some_key(object, ...keys) { return keys.some((key) => key in object); }

const fgtsFileCreate = async() => {
    try {
        let fgtsTable = await HTTPReq("GET", "http://192.168.20.136:3004/fgts", {
            username: process.env.userx,
            password: process.env.password
        }, {
            "projection": { "cpf": 1, "_id": 0, "banks": 1, "category": 1 }
        });
        
        const file = JSON.parse(await readFile("src/app/doc/lists/test.fgts.json")).filter((e) => e.category === "Base Clientes" );

        if(fgtsTable?.find((e) => e.cpf)){
            fgtsTable = fgtsTable.map((e) => {
                if(e.category === "Base Clientes"){
                    const file_element = file.find((ele) => e.cpf === ele.cpf);
                    if(file_element){
                        e = { ...file_element, ...e };
                    }
                }
                return e;
            });
            console.info("Escrevendo o arquivo");
            await writeFile( "src/app/doc/lists/test.fgts.json", JSON.stringify(fgtsTable));
            for (let index = 0; index < fgtsTable.length; index++) {
                const e = fgtsTable[index];
                if(e.category === "Base Clientes" && !contains_some_key(e, "main", "Lemit_1", "Lemit_2", "Lemit_3", "Lemit_4")){
                    const client = await clientAPI.get_id(e.cpf, "cpf");
                    if(client?.cpf){
                        if(client?.main_whats) e.main = client?.main_whats?.replace("@c.us", "");
                        client?.client_data?.contact?.phones?.forEach(({origin, ddd, phone}) => {
                            if(["main", "Lemit_1", "Lemit_2", "Lemit_3", "Lemit_4"].includes(origin)){
                                e[origin] = `${ddd}${phone}`;
                            }
                        });
                    }
                }
                console.log({index});
                if(index % 10000 === 1){
                    await writeFile("src/app/doc/lists/test.fgts.json", JSON.stringify(fgtsTable));
                }
            }
        }
    
    } catch (err){
        console.error({err});
    }
};
fgtsFileCreate();

module.exports = { fgtsFileCreate };