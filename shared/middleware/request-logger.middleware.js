class requestLoggerMiddleware {

    /**
     * Logs every incoming request with method, URL, IP, status, and response time.
     * Attach early in the middleware chain (before routes).
     */
    static handle(req, res, next) {
        const start = Date.now();
        const { method, originalUrl, ip } = req;

        console.log(`--> ${method} ${originalUrl} (ip : ${req.headers["x-forwarded-for"] || ip}) (userAgent : ${req.headers["user-agent"]})`);
        console.log(`Request Body: ${method !== "GET" ? JSON.stringify(req.body) : "N/A"}`);

        // Intercept res.end to capture status & duration
        const originalEnd = res.end.bind(res);
        res.end = function (...args) {
            const duration = Date.now() - start;
            console.log(`<-- ${method} ${originalUrl} (statusCode : ${res.statusCode}) (${duration}ms)`);
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