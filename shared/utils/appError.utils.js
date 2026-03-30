
class AppError extends Error {
  constructor({message = "ERROR", type = "INTERNAL_SERVER_ERROR"}) {
    super(message);
    this.name = "AppError";
    this.type = type;
  }
}

module.exports = AppError;