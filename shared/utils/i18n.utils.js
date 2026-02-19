class I18nUtils {
    
    static dl = process.env.default_language;

    static t({key, len = this.dl}) {
        const msgLen = require(`../../shared/language/${len}/message.js`);
        if (msgLen[key]) {
            return msgLen[key];
        } else {
            const defLen = require(`../../shared/language/${this.dl}/message.js`);
            return defLen[key] || key;
        }
    }
}
module.exports = I18nUtils;
