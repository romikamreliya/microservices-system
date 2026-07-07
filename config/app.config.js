const express = require("express");
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const helmet = require("helmet");
const fs = require("fs");
const { middlewares, utils } = require("@app/shared");

/**
 * Express application configuration
 */
class AppConfig {
    constructor() {
        this.app = express();
        this.allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(",") : [];
        this.middlewares();
    }

    // Loaded lazily (only when HTTPS is actually used) so a missing/untracked
    // private key never breaks HTTP boot.
    get crt() {
        return {
            key: fs.readFileSync("./crt/localhost.key", 'utf8'),
            cert: fs.readFileSync("./crt/localhost.crt", 'utf8')
        };
    }

    helmetConfig = {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"]
            }
        },
        hsts: {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true
        },
        frameguard: { action: 'deny' },
        referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
        xssFilter: true,
        noSniff: true
    };

    corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin || this.allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Request-ID'],
        maxAge: 86400, // 24 hours
        optionsSuccessStatus: 200
    };

    middlewares() {
        this.app.use(middlewares.requestId.handle);
        this.app.use(helmet(this.helmetConfig));
        this.app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
        this.app.use(bodyParser.json({ limit: '10mb' }));
        this.app.use(middlewares.requestLogger.skip(['/health', '/public']));

        // Health probe — unauthenticated, cheap, and mounted before routes so
        // orchestrators (PM2, load balancers, k8s) can check liveness.
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                success: true,
                status: 'ok',
                service: process.env.NAME || 'service',
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });

        this.app.use('/public', express.static('public'));
        this.app.use(cors(this.corsOptions));

        utils.logger.info('App config initialized');
    }

    /**
     * Attach SIGTERM/SIGINT handlers that drain the HTTP server before exit,
     * so in-flight requests finish and PM2/orchestrator restarts stay clean.
     * @param {import('http').Server} server
     */
    gracefulShutdown(server) {
        const shutdown = (signal) => {
            utils.logger.info(`${signal} received — shutting down gracefully`);
            server.close(() => {
                utils.logger.info('HTTP server closed');
                process.exit(0);
            });
            // Force exit if connections do not drain within the grace period.
            setTimeout(() => process.exit(1), 10000).unref();
        };
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    /**
     * Start listening and wire graceful shutdown. Centralizes the boot log so
     * the gateway and every service behave identically.
     * @param {import('http').Server} server
     * @param {number} port
     */
    listen(server, port) {
        server.listen(port, () => {
            const protocol = process.env.HTTPS_ENABLED === "true" ? "https" : "http";
            utils.logger.info(`${process.env.NAME || 'service'} listening on ${protocol}://localhost:${port}`);
        });
        this.gracefulShutdown(server);
    }
}

module.exports = new AppConfig();