module.exports = {
  gateway: {
    name: "api-gateway",
    path: "./api-gateway/index.js",
    port: 7000
  },

  userService: {
    name: "user-service",
    path: "./services/users/index.js",
    port: 7001
  },
};
