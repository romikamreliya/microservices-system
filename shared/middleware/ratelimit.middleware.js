const BaseMiddleware = require("../common/baseMiddleware");
const { rateLimit } = require("express-rate-limit");

class rateLimitMiddleware extends BaseMiddleware {

    static defaultLimiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        limit: 10,
        message: async (req, res) => {
            return this.response.send({ req, res, type: "TOO_MANY_REQUESTS", message: "TOO_MANY_REQUESTS" });
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true
    });

}

module.exports = rateLimitMiddleware;
