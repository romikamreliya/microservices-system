const services = require("../../config/services");
const appConfig = require("../../config/app.config");
const http = require("http");

class Main {
    constructor() {
        this.PORT = services.userService.port;
        this.app = appConfig.app;
        this.server = http.createServer(this.app);
    }

    Routes() {
        this.app.get("/", (req, res) => {
            res.json({
                service: services.userService.name,
                message: "User service working",
            });
        });

        this.app.get("/test", (req, res) => {
            res.json({
                service: services.userService.name,
                message: "test",
            });
        });

        this.app.post("/create", (req, res) => {
            console.log('req.body:', req.body);
            res.json({
                service: services.userService.name,
                message: "test",
            });
        });
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