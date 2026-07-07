const {utils} = require("@app/shared");

class AuthController {

  async test(req, res) {
    try {
      return utils.response.send({req, res, type:"SUCCESS"});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }

  async token(req, res) {
    try {

      // Development-only helper: mints a signed token for local testing.
      // Disabled outside development so it can never issue credentials in a
      // deployed environment. Replace with a real credential-checked login.
      if (process.env.ENV !== "development") {
        return utils.response.send({req, res, type:"NOT_FOUND"});
      }

      const token = utils.token.createJwtAccessToken({
        userId: "12345",
        email: "admin@gmail.com",
        permissions: { user: ["read", "create", "update", "delete"] }
      });
      if (!token) {
        return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
      }

      return utils.response.send({req, res, type:"SUCCESS", data:{token}});
    } catch (error) {
      return utils.response.send({req, res, type:"INTERNAL_SERVER_ERROR"});
    }
  }
}
module.exports = new AuthController();
