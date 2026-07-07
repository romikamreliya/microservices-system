const express = require("express");

const authController = require("../controllers/auth.controllers");

/**
 * API routes handler
 */
class ApiRoutes {
  constructor() {
    this.routes = express.Router();
    this.authController = authController;
    this.registerRoutes();
  }

  registerRoutes() {
    this.publicRoutes();
  }

  publicRoutes() {
    const Router = express.Router();

    Router.get("/test", this.authController.test.bind(this.authController));
    Router.get("/token", this.authController.token.bind(this.authController));

    this.routes.use("/user", Router);
  }

  getRoutes() {
    return this.routes;
  }
}

module.exports = new ApiRoutes();
