const response = require("../utils/response.utils");
const logger = require("../utils/logger.utils");

class errorMiddleware {
    
    static globalErrorHandler(error, req, res, next) {
        // Prevent double responses
        if (res.headersSent) {
            return next(error);
        }

        // Handle custom AppError
        if (error?.name === "AppError") {
            return response.send({req, res, type: error.type || "INTERNAL_SERVER_ERROR", message: error.message});
        }

        // Log unexpected errors
        logger.createLog({ msg: error, name: `UnhandledError-${req.method}-${req.path}` });

        // Return generic error response
        return response.send({req, res,type: "INTERNAL_SERVER_ERROR",  message: "An unexpected error occurred"});
    }

}

module.exports = errorMiddleware;
