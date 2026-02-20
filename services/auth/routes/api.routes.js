const express = require("express");

const testController = require("../controllers/test.controllers");

/**
 * API routes handler
 */
class ApiRoutes {
  constructor() {
    this.routes = express.Router();
    this.testController = testController;
    this.registerRoutes();
  }

  registerRoutes() {
    this.publicRoutes();
  }

  publicRoutes() {
    const Router = express.Router();

    Router.get("/test", this.testController.test.bind(this.testController));
    Router.get("/token", this.testController.token.bind(this.testController));

    this.routes.use("/user", Router);
  }

  getRoutes() {
    return this.routes;
  }
}

module.exports = new ApiRoutes();
