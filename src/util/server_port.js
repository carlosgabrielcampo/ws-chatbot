require("dotenv").config();
if(process.env.PORT === "RANDOM") process.env.PORT = Math.ceil(40000 * Math.random() + 10000);
console.info(process.env.PORT);
module.exports.server_port = process.env.PORT || "9999";