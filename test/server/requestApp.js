const express = require("express");
const cors = require("cors");
const routes = require("./routes/index");


class App {
    constructor() {
        this.app = express();
        this.middlewares();
        this.routes();
    }
    middlewares() {
        this.app.use(express.json());
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


module.exports.RequestTestServer = new App().app;
