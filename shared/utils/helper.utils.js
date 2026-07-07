/**
 * Helper utilities for common operations
 */
class HelperUtils {

  /**
   * Extract API version from a request URL.
   * Matches the version segment used by the services' route mount
   * (e.g. "/v1/user/get" -> "v1").
   * @param {Object} options - Options object
   * @param {string} options.url - Request URL
   * @returns {string|null} API version (v1, v2) or null
   */
  static getVersion({ url }) {
    const match = url.match(/^\/(v1|v2)(?:\/|$)/);
    return match ? match[1] : null;
  }
}

module.exports = HelperUtils;
