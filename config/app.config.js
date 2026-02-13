const express = require("express");
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const helmet = require("helmet");
const fs = require("fs");

/**
 * Express application configuration
 */
class AppConfig {
    constructor() {
        this.app = express();
        this.middlewares();
    }

    crt = {
        key: fs.readFileSync("./crt/localhost.key", 'utf8'),
        cert: fs.readFileSync("./crt/localhost.crt", 'utf8')
    };

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
        this.app.use(helmet(this.helmetConfig));
        this.app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));
        this.app.use(bodyParser.json({ limit: '10mb' }));
        this.app.use('/public', express.static('public'));
        this.app.use(cors(this.corsOptions));

        console.log('✓ App Config Initialized Successfully');
    }
}

module.exports = new AppConfig();