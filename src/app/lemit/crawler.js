const puppeteer = require("puppeteer");
require("dotenv").config();
const path = require("path");
const { clientAPI } = require("../../api/databases/client");
const { delay } = require("../../util/util");
const { writeFile, readFile, obj_file_writer } = require("../../util/fileHandle");
const contains_every_key = (object, ...keys) => keys.every((key) => key in object);
function contains_some_key(object, ...keys) { return keys.some((key) => key in object); }

const crawlerLemit = async(csv_path, csv_name) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const MAX_TRIES = 5;
    let tries = 1;
    await page._client().send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: path.join(__dirname, "../doc/lemit")
    });
    page.on("dialog",(event) => event.accept());
    await page.goto("https://lemitti.com/auth/login");
    await page.waitForSelector("input[id=\"email\"]");
    await page.click(".cc-dismiss");
    await page.click("input[id=\"email\"]");
    await page.type(
        "input[id=\"email\"]",
        `${process.env.LOGIN_LEMITTI}`
    );
    await page.click("input[id=\"password\"]");
    await page.type(
        "input[id=\"password\"]",
        `${process.env.SENHA_LEMITTI}`
    );
    await page.keyboard.press("Enter");
    await page.waitForNavigation();
    await page.goto("https://lemitti.com/jobs/create/completo-padrao");
    const [fileChooser] = await Promise.all([
        page.waitForFileChooser(),
        page.click("#file")
    ]);
    await fileChooser.accept([`${csv_path}/${csv_name}`]);
    await page.waitForSelector(".btn-success");
    await page.click(".btn-success");
    await page.waitForSelector(".table-id-td");

    let numeroArquivo = await page.evaluate(() => {
        // eslint-disable-next-line no-undef
        let n = document.querySelector(".table-id-td").textContent;
        let nArquivo = n.replace(/\D/g, "");
        return nArquivo;
    });
    while (tries <= MAX_TRIES) {
        try {
            await page.waitForSelector(".fa.fa-check.fa-stack-1x.fa-inverse", {
                timeout: 60000,
            });
            await page.goto(`https://lemitti.com/jobs/${numeroArquivo}/approve`);
            await page.waitForSelector(".btn-success");
            await page.click(".btn-success");
            await page.waitForTimeout(2000);
            await page.keyboard.press("Enter");
            await page.waitForSelector("div > a > small > i");
            await page.click("div > a > small > i");
            await page.click("a[title=\"Enriquecidos\"]");
            break;
        } catch (error) {
            if (tries === MAX_TRIES) throw error;
            tries += 1;
            void page.reload();
            await page.waitForNavigation({ waitUntil: "networkidle0" });
        }
    }
    await delay(10000);
    await browser.close();
    return numeroArquivo;
};

const cpfOnBdd = async (csv_name, csv_path, jsonpath) => {
    await writeFile(`${csv_path}/${csv_name}`, "cpf\n");
    let json = JSON.parse(await readFile(jsonpath));
    for (let i = 0; i < json.length; i++) {
        let client_json = json[i];
        if(contains_every_key(client_json, "cpf", "Simulacao") && !contains_some_key(client_json, "main", "Lemit_1", "Lemit_2", "Lemit_3", "Lemit_4")){
            const { cpf } = client_json;
            const client = await clientAPI.get_id(cpf, "cpf");
            const arrvalidator = [];
            if(client?.cpf){
                client_json._id = client?._id;
                client_json.nome = client?.client_data?.name;
                if(client?.main_whats) client_json.main = client?.main_whats?.replace("@c.us", "");
                client?.client_data?.contact?.phones?.forEach(({origin, ddd, phone}) => {
                    origin?.split("_")?.includes("Lemit") && arrvalidator.push(cpf);
                    if(["pan"].includes(origin)){
                        client_json[origin] = `${ddd}${phone}`;
                    }
                    if(["main", "Lemit_1", "Lemit_2", "Lemit_3", "Lemit_4"].includes(origin)){
                        client_json[origin] = `${ddd}${phone}`;
                        arrvalidator.push(cpf);
                    }
                });
            }
            console.log({arrvalidator});
            if(arrvalidator.length < 1){
                await obj_file_writer(`${csv_path}/${csv_name}`, {cpf});
            }
        }
        await writeFile(`${jsonpath}`, JSON.stringify(json));
    }
};

module.exports = { crawlerLemit, cpfOnBdd };