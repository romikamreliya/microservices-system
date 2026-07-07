/**
 * Fail-fast environment validation.
 *
 * Must be required at the very top of each service entry point — right after
 * `dotenv.config()` and BEFORE `@app/shared` — because some shared modules
 * (e.g. token.utils) read secrets at import time and would otherwise throw an
 * opaque error when a variable is missing.
 *
 * This module intentionally has no dependencies on @app/shared.
 */

// Variables every process needs to boot safely.
const REQUIRED = ["DATABASE_URL", "accessTokenKey"];

const isSet = (k) => process.env[k] !== undefined && String(process.env[k]).trim() !== "";

/**
 * Validate that required env vars are present and non-empty.
 * Exits the process with a clear message if any are missing.
 * @param {string[]} [extra=[]] Additional service-specific required keys.
 */
function validate(extra = []) {
  const keys = [...REQUIRED, ...extra];
  const missing = keys.filter((k) => !isSet(k));

  // The refresh-token secret may use the correct or legacy spelling.
  if (!isSet("refreshTokenKey") && !isSet("refressTokenKey")) {
    missing.push("refreshTokenKey");
  }

  if (missing.length) {
    console.error(
      `\n[ENV] Missing required environment variable(s): ${missing.join(", ")}` +
        `\n[ENV] Copy .env.example to .env and provide values before starting.\n`
    );
    process.exit(1);
  }
}

module.exports = { validate, REQUIRED };
