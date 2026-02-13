const { createProxyMiddleware } = require("http-proxy-middleware");
const services = require("../config/services");
const http = require("http");
const appConfig = require("../config/app.config");

class Main {
    constructor() {
        this.PORT = services.gateway.port;
        this.app = appConfig.app;
        this.server = http.createServer(this.app);
    }

    Routes() {
        this.app.use("/users",createProxyMiddleware({ target: `http://localhost:${services.userService.port}`, changeOrigin: true,}));
        this.app.use("/auth",createProxyMiddleware({ target: `http://localhost:${services.authService.port}`, changeOrigin: true,}));
        this.app.use((req, res) => {res.status(404).json({ error: "Not found" })});
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