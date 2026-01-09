const fs = require("fs").promises;
let writedFile = 0;
const readFile = async(path) => await fs.readFile(path, "utf-8").then().catch((e) => console.error(e.message));
const writeFile = async(path, data) => await fs.writeFile(path, data).then().catch((e) => console.error(e.message));
const appendFile = async(path, data,) => await fs.appendFile(path, data, {flag: "a+"}).then().catch(async(e) => {
    console.error(e.message);
    return await writeFile(path, data);
});
const removeFile = async(path) => await fs.rm(path).then().catch(async(e) => console.error(e.message));
const obj_file_writer = async(path, obj, splitter) => {
    if(writedFile === 0){
        writedFile = 1;
        const file = await readFile(path);
        if(!file){
            await writeFile(path, `${Object?.keys(obj).join(splitter || ";")}\n`);
        }
    }
    appendFile(path,`${ Object?.values(obj).join(splitter || ";") }\n`);
};

const new_obj_file = async(path, arr, splitter, obj_validation) => {
    let header = `${Object?.keys(arr[0]).join(splitter || ";")}`;
    let body = arr.map(e => {
        return `${Object?.values(e).join(splitter || ";")}`;
    }).join("\n");

    if (obj_validation) {
        header = `${Object?.keys(obj_validation).join(splitter || ";")}`;
        body = arr.map(e => {
            const merged = {...obj_validation, ...e};
            return `${Object?.values(merged).join(splitter || ";")}`;
        }).join("\n");
    }

    writeFile(path, `${header}\n${body}`);
};

module.exports = {
    readFile, writeFile, appendFile, new_obj_file, obj_file_writer, removeFile
};
