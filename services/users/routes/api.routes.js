const express = require("express");

const userController = require("../controllers/user.controllers");
const {middlewares} = require("@app/shared");
/**
 * API routes handler
 */
class ApiRoutes {
  constructor() {
    this.routes = express.Router();
    this.userController = userController;
    this.registerRoutes();
  }

  registerRoutes() {
    this.publicRoutes();
  }

  publicRoutes() {
    const Router = express.Router();
    
    Router.get("/get", middlewares.auth.authorize({"user":["read"]}), this.userController.Get.bind(this.userController));
    Router.post("/create", middlewares.auth.authorize({"user":["create"]}), this.userController.Create.bind(this.userController));
    Router.put("/update", middlewares.auth.authorize({"user":["update"]}), this.userController.Update.bind(this.userController));
    Router.delete("/delete", middlewares.auth.authorize({"user":["delete"]}), this.userController.Delete.bind(this.userController));

    Router.post("/upload", this.userController.UploadImg.bind(this.userController));

    this.routes.use("/user", Router);
  }

  getRoutes() {
    return this.routes;
  }
}

module.exports = new ApiRoutes();
