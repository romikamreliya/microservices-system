require("dotenv").config();
const services = require("../../config/services");
const appConfig = require("../../config/app.config");
const http = require("http");
const {middlewares} = require("@app/shared");

// Routes
const apiRoutes = require("./routes/api.routes");

class Main {
    constructor() {
        this.PORT = services.userService.port;
        this.app = appConfig.app;
        this.server = http.createServer(this.app);
    }

    Routes() {
        this.app.use(/^\/(v1|v2)/, middlewares.auth.userLogin, apiRoutes.getRoutes());
    }

    Initialize() {
        this.Routes();
    }

    Start() {
        this.Initialize();
        this.server.listen(this.PORT, () => {
            const protocol = process.env.HTTPS_ENABLED === "true" ? "https" : "http";
            console.log(`Server listening on ${protocol}://localhost:${this.PORT}`);
        });
    }
}

const main = new Main();
main.Start();