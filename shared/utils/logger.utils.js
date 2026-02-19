const winston = require("winston");
const path = require("path");

/**
 * Logger utility using Winston for file and console logging
 */
class LoggerUtils {
    static logger = null;

    /**
     * Initialize Winston logger with file and console transports
     */
    static initialize() {
        if (this.logger) {
            return this.logger;
        }

        const logDir = "./logs";

        // Create logs directory if it doesn't exist
        const fs = require("fs");
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const date = new Date().toLocaleDateString().replaceAll("/", "_");

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || "info",
            format: winston.format.combine(
                winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json()
            ),
            defaultMeta: { service: "app-service" },
            transports: [
                // File transport for errors
                new winston.transports.File({
                    filename: path.join(logDir, `${date}-error.log`),
                    level: "error",
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
                // File transport for all logs
                new winston.transports.File({
                    filename: path.join(logDir, `${date}.log`),
                    maxsize: 5242880, // 5MB
                    maxFiles: 5,
                }),
            ],
        });

        // Add console transport in development or debug mode
        if (process.env.NODE_ENV !== "production" || process.env.DEBUG === "true") {
            this.logger.add(
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(({ level, message, timestamp, ...meta }) => {
                            return `${timestamp} [${level}]: ${message} ${
                                Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
                            }`;
                        })
                    ),
                })
            );
        }

        return this.logger;
    }

    /**
     * Get or create logger instance
     */
    static getLogger() {
        return this.initialize();
    }

    /**
     * Log info level message
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    static info(message, meta = {}) {
        this.getLogger().info(message, meta);
    }

    /**
     * Log error level message
     * @param {Error|string} msg - Error message or object
     * @param {string} name - Log name/label
     */
    static error(msg, name = "") {
        const logger = this.getLogger();
        
        if (msg instanceof Error) {
            logger.error(`${name}`, {
                error: msg.message,
                stack: msg.stack,
                fileName: msg.fileName,
            });
        } else {
            logger.error(`${name}`, { message: msg });
        }
    }

    /**
     * Log warning level message
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    static warn(message, meta = {}) {
        this.getLogger().warn(message, meta);
    }

    /**
     * Log debug level message
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     */
    static debug(message, meta = {}) {
        this.getLogger().debug(message, meta);
    }

    /**
     * Legacy method for backward compatibility
     * @param {Object} options - Log options
     * @param {Error|string} options.msg - Error message or object
     * @param {string} [options.name=""] - Log name/label
     */
    static createLog({ msg, name = "" }) {
        this.error(msg, name);
    }
}

// Initialize logger on module load
LoggerUtils.initialize();

module.exports = LoggerUtils;