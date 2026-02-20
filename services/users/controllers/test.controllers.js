const {utils} = require("@app/shared");

class TestController {

  async Get(req, res) {
    try {
      return utils.response.send({req, res, type:"SUCCESS"});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async Create(req, res) {
    try {
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
