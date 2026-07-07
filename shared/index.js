module.exports = {
    constants: {
        constants: require('./constants/constants'),
    },
    database: {
        baseModel: require('./database/baseModel'),
        mysql: require('./database/mysql'),
    },
    language: {
        en: {
            message: require('./language/en/message')
        },
    },
    middlewares: {
        auth: require('./middleware/auth.middleware'),
        error: require('./middleware/error.middleware'),
        rateLimit: require('./middleware/ratelimit.middleware'),
        requestId: require('./middleware/request-id.middleware'),
        requestLogger: require('./middleware/request-logger.middleware'),
    },
    utils: {
        ajv: require('./utils/ajv.utils'),
        date: require('./utils/date.utils'),
        helper: require('./utils/helper.utils'),
        i18n: require('./utils/i18n.utils'),
        logger: require('./utils/logger.utils'),
        memory: require('./utils/memory.utils'),
        response: require('./utils/response.utils'),
        token: require('./utils/token.utils'),
        upload: require('./utils/upload.utils'),
        appError: require('./utils/appError.utils'),
    }

};