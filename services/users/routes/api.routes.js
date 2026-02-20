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
    
    Router.post("/get", this.testController.Get.bind(this.testController));
    Router.post("/create", this.testController.Create.bind(this.testController));
    Router.put("/update", this.testController.Update.bind(this.testController));
    Router.delete("/delete", this.testController.Delete.bind(this.testController));

    this.routes.use("/user", Router);
  }

  getRoutes() {
    return this.routes;
  }
}

module.exports = new ApiRoutes();
