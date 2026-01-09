const { server_port } = require("./server_port");

require("dotenv").config();
// let host = "localhost";
let host = "192.168.20.136";
let localhostIp = "192.168.20.115";
// let localhostIp = "192.168.20.182";
const server = `http://${host}:${server_port || 11000}`;
const manager_server = `http://${host}`;
const localServer =  `http://localhost:${server_port || 11000}`;
const localhost = "http://localhost";
console.info({server, manager_server, host, localServer, localhost, localhostIp});

module.exports = { server, manager_server, host, localServer, localhost, localhostIp };
