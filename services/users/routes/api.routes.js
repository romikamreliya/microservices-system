const express = require("express");

const testController = require("../controllers/test.controllers");
const {middlewares} = require("@app/shared");
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
    
    Router.get("/get", middlewares.auth.authorize({"user":["read"]}), this.testController.Get.bind(this.testController));
    Router.post("/create", middlewares.auth.authorize({"user":["create"]}), this.testController.Create.bind(this.testController));
    Router.put("/update", middlewares.auth.authorize({"user":["update"]}), this.testController.Update.bind(this.testController));
    Router.delete("/delete", middlewares.auth.authorize({"user":["delete"]}), this.testController.Delete.bind(this.testController));

    Router.post("/upload", this.testController.UploadImg.bind(this.testController));

    this.routes.use("/user", Router);
  }

  getRoutes() {
    return this.routes;
  }
}

module.exports = new ApiRoutes();
