
class TestController {

  async test(req, res) {
    try {
      return res.send({ message: "Test API is working!" });
    } catch (error) {
      return res.send({ message: "Test API is working!" });
    }
  }

  async token(req, res) {
    try {
      return res.send({ message: "Token API is working!" });
    } catch (error) {
      return res.send({ message: "Token API is working!" });
    }
  }
}
module.exports = new TestController();
