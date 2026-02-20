const usersModel = require("../model/users.model");
const {utils} = require("@app/shared");

class TestController {



  async Get(req, res) {
    try {
      const data = await usersModel.get();
      return utils.response.send({req, res, type:"SUCCESS", data});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async Create(req, res) {
    try {

      const payload = {
        name: req.body?.name || "",
        email: req.body?.email || ""
      }

      const validation = utils.ajv.ajvCheck({
        name: utils.ajv.prop("string", {minLength:3}),
        email: utils.ajv.prop("string", {minLength:3,format:"customEmail"})
      }, {
        required:["name","email"]
      });

      if (!validation(payload)) {
        return utils.response.send({req, res, type:"VALIDATION_ERROR", key: utils.ajv.errorMsg({error: validation.errors[0]})});
      }
      
      return utils.response.send({req, res, type:"SUCCESS"});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async Update(req, res) {
    try {
      return utils.response.send({req, res, type:"SUCCESS"});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async Delete(req, res) {
    try {
      return utils.response.send({req, res, type:"SUCCESS"});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }
}
module.exports = new TestController();
