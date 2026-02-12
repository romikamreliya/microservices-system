const express = require("express");
const services = require("../../config/services");

const app = express();

app.get("/", (req, res) => {
    res.json({
        service: services.userService.name,
        message: "User service working",
    });
});

app.get("/test", (req, res) => {
    res.json({
        service: services.userService.name,
        message: "test",
    });
});

app.listen(services.userService.port, () => {
    console.log(`User Service running on port ${services.userService.port}`);
});
