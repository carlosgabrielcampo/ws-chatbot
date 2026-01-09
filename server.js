require("dotenv").config();
const app = require("./src/app");
const { server_port } = require("./src/util/server_port");

module.exports.server = app.listen(server_port, () => console.info(`Listening on Port ${server_port}`));
