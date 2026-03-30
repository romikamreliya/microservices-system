const baseMiddleware = require("../common/baseMiddleware");

class errorMiddleware extends baseMiddleware {
    
    static globalErrorHandler(error, req, res, next) {
        // Prevent double responses
        if (res.headersSent) {
            return next(error);
        }

        // Handle custom AppError
        if (error?.name === "AppError") {
            return this.response.send({req, res, type: error.type || "INTERNAL_SERVER_ERROR", message: error.message});
        }

        // Log unexpected errors
        this.logger.createLog({ msg: error, name: `UnhandledError-${req.method}-${req.path}` });

        // Return generic error response
        return this.response.send({req, res,type: "INTERNAL_SERVER_ERROR",  message: "An unexpected error occurred"});
    }

}

module.exports = errorMiddleware;
