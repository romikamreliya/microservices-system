class requestLoggerMiddleware {

    // Keys whose values must never be written to logs.
    static SENSITIVE = ["password", "pass", "token", "authorization", "accesstoken", "refreshtoken", "secret"];

    /**
     * Recursively mask sensitive fields in a request body before logging.
     * @param {*} body
     * @returns {*} A redacted copy (original is not mutated)
     */
    static redact(body) {
        if (!body || typeof body !== "object") {
            return body;
        }

        const clone = Array.isArray(body) ? [...body] : { ...body };
        for (const key of Object.keys(clone)) {
            if (requestLoggerMiddleware.SENSITIVE.includes(key.toLowerCase())) {
                clone[key] = "***";
            } else if (clone[key] && typeof clone[key] === "object") {
                clone[key] = requestLoggerMiddleware.redact(clone[key]);
            }
        }
        return clone;
    }

    /**
     * Logs every incoming request with method, URL, IP, status, and response time.
     * Attach early in the middleware chain (before routes, after body parser).
     */
    static handle(req, res, next) {
        const start = Date.now();
        const { method, originalUrl, ip } = req;
        const rid = req.id ? ` [${req.id}]` : "";

        console.log(`-->${rid} ${method} ${originalUrl} (ip : ${req.headers["x-forwarded-for"] || ip}) (userAgent : ${req.headers["user-agent"]})`);
        console.log(`Request Body: ${method !== "GET" ? JSON.stringify(requestLoggerMiddleware.redact(req.body)) : "N/A"}`);

        // Intercept res.end to capture status & duration
        const originalEnd = res.end.bind(res);
        res.end = function (...args) {
            const duration = Date.now() - start;
            console.log(`<--${rid} ${method} ${originalUrl} (statusCode : ${res.statusCode}) (${duration}ms)`);
            return originalEnd(...args);
        };

        next();
    }

    /**
     * Skip logging for specific paths (e.g. health check, static assets).
     * @param {string[]} paths - Array of URL prefixes to skip
     */
    static skip(paths = []) {
        return (req, res, next) => {
            if (paths.some((p) => req.originalUrl.startsWith(p))) {
                return next();
            }
            return requestLoggerMiddleware.handle(req, res, next);
        };
    }
}

module.exports = requestLoggerMiddleware;
