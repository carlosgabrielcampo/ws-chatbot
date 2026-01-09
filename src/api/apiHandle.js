const axios = require("axios");

module.exports.HTTPReq = async (method, url, header, data, auth) => {
    let test =  await axios({
        method: method,	
        url: url,	
        headers: header,
        data: data,
        mode: "cors",
        auth: auth,
    }).then(async function (info) {
        if( info.request ){
            return info.data;
        }
    }).catch(async function (error) {
        if( error.response ){
            return error.response.data;
        }
    });
    return test;
}; 
