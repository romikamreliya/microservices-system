const I18nUtils = require("../../shared/utils/i18n.utils");

/**
 * Response utility class for API responses
 */
class ResponseUtils {

    static i18n = I18nUtils;

    static ERROR_CODES = {
        // ✅ Success
        SUCCESS: { status: 200, success: true },
        CREATED: { status: 201, success: true },
        UPDATE: { status: 204, success: true },
        DELETE: { status: 204, success: true },
        ACCEPTED: { status: 202, success: true },
        NO_CONTENT: { status: 204, success: true },

        // ❌ Client Errors
        BAD_REQUEST: { status: 400, success: false },
        UNAUTHORIZED: { status: 401, success: false },
        PAYMENT_REQUIRED: { status: 402, success: false },
        FORBIDDEN: { status: 403, success: false },
        NOT_FOUND: { status: 404, success: false },
        METHOD_NOT_ALLOWED: { status: 405, success: false },
        NOT_ACCEPTABLE: { status: 406, success: false },
        REQUEST_TIMEOUT: { status: 408, success: false },
        CONFLICT: { status: 409, success: false },
        UNPROCESSABLE_ENTITY: { status: 422, success: false },
        TOO_MANY_REQUESTS: { status: 429, success: false },

        // 💥 Server Errors
        INTERNAL_SERVER_ERROR: { status: 500, success: false },
        NOT_IMPLEMENTED: { status: 501, success: false },
        BAD_GATEWAY: { status: 502, success: false },
        SERVICE_UNAVAILABLE: { status: 503, success: false },
        GATEWAY_TIMEOUT: { status: 504, success: false },

        // 🔒 Auth / token related
        TOKEN_EXPIRED: { status: 401, success: false},
        TOKEN_INVALID: { status: 401, success: false },
        ACCESS_DENIED: { status: 403, success: false },
    };

    /**
     * Unified Response Sender
     *
     * @param {Object} options
     * @param {Object} options.req - Express request
     * @param {Object} options.res - Express response
     * @param {String} options.type - Response type (SUCCESS, CREATED, BAD_REQUEST...)
     * @param {String} options.key - Translation key
     * @param {Object} [options.data] - Response data
     * @returns {Object}
    */
    static send({ req, res, type = "SUCCESS", key, data = null } = {}) {
        if (!req || !res) throw new Error("Request and Response objects are required");
        
        const error = this.ERROR_CODES[type];
        if (!error) {
            throw new Error(`Invalid response type: ${type}`);
        }
        if (error.success) {
            return this.success({ req, res, key, data, status: error.status });
        } else {
            return this.error({ req, res, key, status: error.status });
        }
    }

    /**
     * Send success response
     * @param {Object} options - Response options
     * @param {Object} options.req - Express request object
     * @param {Object} options.res - Express response object
     * @param {string} options.key - Translation key for message
     * @param {string} [options.code=null] - Response code
     * @param {Object} [options.data={}] - Response data
     * @param {number} [options.status=200] - HTTP status code
     * @returns {Object} JSON response
     */
    static success({ req, res, key, code = null, data = {}, status = 200 }) {
        return res.status(status).json({
            success: true,
            code,
            message: this.i18n.t({ key, len: req.lang }),
            data
        });
    }

    /**
     * Send error response
     * @param {Object} options - Response options
     * @param {Object} options.req - Express request object
     * @param {Object} options.res - Express response object
     * @param {string} options.key - Translation key for message
     * @param {string} [options.code=null] - Error code
     * @param {number} [options.status=400] - HTTP status code
     * @returns {Object} JSON error response
     */
    static error({ req, res, key, code = null, status = 400 } = {}) {
        return res.status(status).json({
            success: false,
            code,
            message: this.i18n.t({ key, len: req?.lang || 'en' })
        });
    }
}

module.exports = ResponseUtils;
