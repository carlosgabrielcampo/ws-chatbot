const { google } = require("googleapis");
const { delay } = require("../util/util");

const getAuthSheets = async () => {
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: "./src/util/credential.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets",
        });

        const client = await auth.getClient();
        const googleSheets = google.sheets({
            version: "v4",
            auth: client,
        });

        return {
            auth,
            client,
            googleSheets,
        };
    } catch(err) {
        await delay(60000);
        console.error("getAuthSheets", err);
        return await getAuthSheets();
    }
};

const metadataFunc = async (id) => {
    try {
        const { googleSheets, auth } = await getAuthSheets(id);
        return await googleSheets.spreadsheets.get({
            auth,
            spreadsheetId: id,
        });
    } catch (err) {
        await delay(60000);
        console.error("metadataFunc", err);
        return await metadataFunc(id);
    }

};

const getRowsFunc = async (id, range) => {
    try{
        const { googleSheets, auth } = await getAuthSheets(id);
        return await googleSheets.spreadsheets.values.get({
            auth,
            spreadsheetId: id,
            range,
            valueRenderOption: "FORMATTED_VALUE",
            dateTimeRenderOption: "FORMATTED_STRING",
        });
    } catch (err) {
        await delay(60000);
        console.error("getRowsFunc", err);
        return await metadataFunc(id, range);
    }
};

const addRowFunc = async (id, data, range) => {
    try{
        const { googleSheets, auth } = await getAuthSheets(id);
        return await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId: id,
            range,
            valueInputOption: "USER_ENTERED",
            resource: {
                values: data,
            },
        });
    } catch (err) {
        await delay(60000);
        console.error("addRowFunc", err);
        return await addRowFunc(id, data, range);
    }
};

const updateValueFunc = async (id, data, range) => {
    try{
        const { googleSheets } = await getAuthSheets();
        return await googleSheets.spreadsheets.values.update({
            spreadsheetId: id,
            range,
            valueInputOption: "USER_ENTERED",
            resource: {
                "values": data,
            },
        });
    } catch (err) {
        await delay(60000);
        console.error("updateValueFunc", err);
        return await updateValueFunc(id, data, range);
    }

};


module.exports = { metadataFunc, getRowsFunc, addRowFunc, updateValueFunc };