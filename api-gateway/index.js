const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const services = require("../config/services");

const app = express();

// Route traffic to services
app.use(
    "/users",
    createProxyMiddleware({
        target: `http://localhost:${services.userService.port}`,
        changeOrigin: true,
    }),
);

app.use((req, res, next) => {
    res.status(404).json({ error: "Not found" });
});

app.listen(services.gateway.port, () => {
    console.log(`API Gateway running on port ${services.gateway.port}`);
});
