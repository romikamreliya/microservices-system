require("dotenv").config();
require("../../config/env").validate();
const services = require("../../config/services");
const appConfig = require("../../config/app.config");
const http = require("http");

// Routes
const apiRoutes = require("./routes/api.routes");
const { middlewares } = require("@app/shared");

class Main {
    constructor() {
        this.PORT = services.authService.port;
        this.app = appConfig.app;
        this.server = http.createServer(this.app);
    }

    Routes() {
        this.app.use(/^\/(v1|v2)/, apiRoutes.getRoutes());
        // Global Error Handler
        this.app.use(middlewares.error.globalErrorHandler.bind(middlewares.error));
    }

    Initialize() {
        this.Routes();
    }

    Start() {
        this.Initialize();
        appConfig.listen(this.server, this.PORT);
    }
}

const main = new Main();
main.Start();