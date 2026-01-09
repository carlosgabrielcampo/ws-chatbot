const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./database/routes");
const { start_belt } = require("./app/factorybelt");
const { server_port } = require("./util/server_port");

class App {
    constructor() {
        if(["2000"].includes(server_port)) start_belt();
        this.app = express();
        this.middlewares();
        this.routes();
    }
    middlewares() {
        this.app.use(morgan("dev"));
        this.app.use(helmet());
        this.app.use(express.json());
        this.app.use(express.urlencoded({extended: false}));
        this.app.use((req, res, next) => {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, HEAD, OPTIONS");
            res.header("Access-Control-Allow-Headers", "Access, Content-type, Authorization, Acept, Origin, X-Requested-With");
            this.app.use(cors());
            next();
        });
    }

    routes() {
        this.app.use(routes);
    }
}

module.exports = new App().app;