const response = require("../utils/response.utils");
const token = require("../utils/token.utils");
const logger = require("../utils/logger.utils");

class ApiMiddleware {

  /**
   * Middleware to check user login and verify token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  static userLogin(req, res, next) {
    try {

      const headerToken = req.headers['authorization']?.replace('Bearer ', '');
      if (!headerToken) {
        return response.error({ req, res, key: "UNAUTHORIZED" });
      }

      // check Token
      const tokenCheck = token.verifyCustomToken(headerToken);
      if (!tokenCheck.ok) {
        return response.error({ req, res, key: tokenCheck.error });
      }

      req.tokenData = tokenCheck.data;
      next();
    } catch (error) {
      logger.createLog({ msg: error, name: "ApiMiddleware-userLogin" });
      return response.error({ req, res, key: 'ERROR' });
    }
  }

  /**
   * Middleware to check user permissions
   * @param {Object} options - Options object
   * @param {string} options.moduleName - Module name for permission check
   * @param {string} options.actionName - Action name for permission check
   * @returns {Function} Express middleware function
   */
  static checkPermission({ moduleName, actionName }) {
    // Validate required parameters
    if (!moduleName || !actionName) {
      throw new Error("checkPermission: Both moduleName and actionName are required");
    }

    return async (req, res, next) => {
      try {
        // Check if user is authenticated via token
        if (!req.tokenData) {
          return response.error({ req, res, key: "UNAUTHORIZED" });
        }

        next();
      } catch (error) {
        logger.createLog({ msg: error.message, name: "PermissionMiddleware-checkPermission" });
        return response.error({ req, res, key: "INTERNAL_ERROR" });
      }
    };
  }
}

module.exports = ApiMiddleware;
