require("dotenv").config();
const { createProxyMiddleware } = require("http-proxy-middleware");
const services = require("../config/services");
const http = require("http");
const appConfig = require("../config/app.config");
const shared = require("@app/shared");

class Main {
    constructor() {
        this.PORT = services.gateway.port;
        this.app = appConfig.app;
        this.server = http.createServer(this.app);
    }

    proxyMiddleware(service){
        return { 
            target: `http://localhost:${service.port}`, 
            changeOrigin: true,
            on: {
                error(err, req, res) {
                    return shared.utils.response.send({req, res, type:"GATEWAY_TIMEOUT"});
                }
            }
        }
    }

    Routes() {
        this.app.use("/auth", createProxyMiddleware(this.proxyMiddleware(services.authService)));
        this.app.use("/users", shared.middlewares.auth.userTokenCheck, createProxyMiddleware(this.proxyMiddleware(services.userService)));
        this.app.use((req, res) => {
            return shared.utils.response.send({ req, res, type: "NOT_FOUND", key:"NOT_FOUND" });
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