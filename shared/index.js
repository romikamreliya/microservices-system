module.exports = {
    constants: {
        constants: require('./constants/constants'),
    },
    database: {
        baseModel: require('./database/baseModel'),
        connection: require('./database/connection')
    },
    language: {
        en: {
            message: require('./language/en/message')
        },
    },
    middlewares: {
        auth: require('./middleware/auth.middleware'),
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
        upload: require('./utils/upload.utils')
    }

};