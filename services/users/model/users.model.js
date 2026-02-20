const {database} = require("@app/shared");

class UserModel extends database.baseModel {
  constructor() {
    super({
      table: "User",
      columns: ["id", "name", "email"],
      primaryKey: "id",
      limit: 20,
    });
  }

}
module.exports = new UserModel();
