
const services = require("./config/services");

const apps = Object.values(services).map(service => {
    return {
            name: service.name,
            script: service.path,
            instances: 1,
            exec_mode: "fork",
            env: {
                PORT: service.port,
                NODE_ENV: "production"
            }
        }
});

module.exports = {apps};
