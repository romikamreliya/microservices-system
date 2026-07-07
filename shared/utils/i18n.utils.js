const path = require("path");
const fs = require("fs");

class I18nUtils {

    static dl = process.env.default_language || "en";

    // Whitelist of supported languages, derived from the folders that actually
    // exist under shared/language. Prevents a caller-supplied `len` (e.g. from
    // req.lang / an Accept-Language header) from being used to build an
    // arbitrary require() path (path traversal).
    static supported = fs
        .readdirSync(path.join(__dirname, "..", "language"), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);

    /**
     * Resolve a requested language to a supported one, falling back to the
     * default language.
     * @param {string} len
     * @returns {string}
     */
    static resolveLang(len) {
        return this.supported.includes(len) ? len : this.dl;
    }

    static t({ key, len = this.dl }) {
        const lang = this.resolveLang(len);
        const msgLen = require(`../language/${lang}/message.js`);
        if (msgLen[key]) {
            return msgLen[key];
        } else {
            const defLen = require(`../language/${this.dl}/message.js`);
            return defLen[key] || key;
        }
    }
}
module.exports = I18nUtils;
