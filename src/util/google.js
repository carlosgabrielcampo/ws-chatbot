const { google } = require("googleapis");


const getAuthSheets = async (file) => {
    const auth = new google.auth.GoogleAuth({
        keyFile: "./src/util/credential.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets",
    });

    const client = await auth.getClient();
    const googleSheets = google.sheets({
        version: "v4",
        auth: client,
    });

    const spreadsheetId = file;
    return {
        auth,
        client,
        googleSheets,
        spreadsheetId,
    };
};

const metadataFunc = async () => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    return await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId,
    });
};

const getRowsFunc = async (id, pag) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets(id);
    return await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: pag,
        valueRenderOption: "FORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
    });
};

const addRowFunc = async (data) => {
    const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
    // const { values } = req.body;

    return await googleSheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "PROPOSTAS",
        valueInputOption: "RAW",
        resource: {
            values: data,
        },
    });
};

const updateValueFunc = async (id, data) => {
    const { googleSheets, spreadsheetId } = await getAuthSheets(id);

    return await googleSheets.spreadsheets.values.update({
        spreadsheetId,
        range: "PROPOSTAS",
        valueInputOption: "USER_ENTERED",
        resource: {
            values: data,
        },
    });
};

module.exports = { metadataFunc, getRowsFunc, addRowFunc, updateValueFunc };