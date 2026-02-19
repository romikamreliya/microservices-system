/**
 * Helper utilities for common operations
 */
class HelperUtils {

  /**
   * Extract API version from URL
   * @param {Object} options - Options object
   * @param {string} options.url - Request URL
   * @returns {string|null} API version (v1, v2) or null
   */
  static getVersion({ url }) {
    const match = url.match(/\/api\/(v1|v2)/);
    return match ? match[1] : null;
  }
}

module.exports = HelperUtils;
