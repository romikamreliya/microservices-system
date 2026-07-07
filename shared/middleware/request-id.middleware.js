const { randomUUID } = require("crypto");

/**
 * Request correlation ID middleware.
 * Reuses an incoming `X-Request-ID` (e.g. forwarded by the API gateway) or
 * generates one, exposes it as `req.id`, and echoes it back on the response.
 * Attach early — before the request logger and routes.
 */
class requestIdMiddleware {

    static handle(req, res, next) {
        const id = req.headers["x-request-id"] || randomUUID();
        req.id = id;
        res.setHeader("X-Request-ID", id);
        next();
    }
}

module.exports = requestIdMiddleware;
