const {utils} = require("@app/shared");

class TestController {

  async test(req, res) {
    try {
      return utils.response.send({req, res, type:"SUCCESS"});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async token(req, res) {
    try {

      const token = utils.token.createJwtAccessToken({userId:"12345", email:"admin@gmail.com"});
      if (!token) {
        return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
      }

      return utils.response.send({req, res, type:"SUCCESS", data:{token}});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }
}
module.exports = new TestController();
