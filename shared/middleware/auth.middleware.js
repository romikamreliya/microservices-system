const response = require("../utils/response.utils");
const logger = require("../utils/logger.utils");
const tokenUtils = require("../utils/token.utils");

class ApiMiddleware {

  static authenticateToken(req, res, next) {
    try {
      const token = req.headers['authorization']?.replace('Bearer ', '');

      if (!token) {
        return response.send({req, res, type:"UNAUTHORIZED", message:"UNAUTHORIZED" });
      }

      // check Token
      const tokenCheck = tokenUtils.verifyJwtAccessToken(token);
      if (!tokenCheck.ok) {
        return response.send({ req, res, type: tokenCheck.error, message: tokenCheck.error });
      }

      req.currentUser = tokenCheck.data;
      next();
    } catch (error) {
      logger.createLog({ msg: error, name: "ApiMiddleware-userLogin" });
      return response.send({ req, res, type: "INTERNAL_SERVER_ERROR", message: "INTERNAL_SERVER_ERROR" });
    }
  }

  static authorize(permissions = {}) {
    // Validate required parameters
    if (!permissions || Object.keys(permissions).length === 0) {
      throw new Error("authorize: Permissions object is required");
    }

    return async (req, res, next) => {
      try {
        
        // Check if user is authenticated via token
        if (!req.currentUser) {
          return response.send({ req, res, type: "UNAUTHORIZED", message: "UNAUTHORIZED" });
        }

        // IMPLEMENTED: Check permission logic
        // const userPermissions = req.currentUser?.permissions || {};
        // const allowed = Object.entries(permissions).some(
        //   ([module, actions]) => {
        //     if (!Array.isArray(userPermissions[module])) return false;
        //     return actions.some(action => userPermissions[module].includes(action));
        //   }
        // );
        
        // if (!allowed) {
        //   return response.send({ req, res, type: "FORBIDDEN", message: "INSUFFICIENT_PERMISSIONS" });
        // }

        next();
      } catch (error) {
        logger.createLog({ msg: error.message, name: "PermissionMiddleware-checkPermission" });
        return response.send({ req, res, type: "INTERNAL_SERVER_ERROR", message: "INTERNAL_SERVER_ERROR" });
      }
    };
  }

}

module.exports = ApiMiddleware;
