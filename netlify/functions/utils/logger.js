<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// utils/logger.js
//
// Structured, safe logging for the Marblism bridge.
//
// WHY THIS EXISTS:
//   Netlify Functions write to stdout, which appears in your Netlify dashboard
//   under Functions → marblism-bridge → Logs.
//
//   Raw console.log(event.body) would dump the entire payload — fine for
//   debugging, but risky if the payload ever contains anything sensitive
//   (API keys a sender mistakenly included, personal data, etc.).
//
//   This logger:
//     • Prints a safe summary of the payload (field names + value shapes)
//     • Redacts values for a configurable list of sensitive keys
//     • Prints the full payload only when LOG_LEVEL=debug is set
//     • Prefixes every line with a requestId so multi-request logs don't blur
//
// USAGE:
//   const log = createLogger("req_123");
//   log.info("Auth passed");
//   log.warn("Duplicate detected", { slug });
//   log.error("GitHub commit failed", error);
//   log.payload(rawPayload);      ← safe summary, always logged
//   log.debugPayload(rawPayload); ← full dump, only if LOG_LEVEL=debug
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

// ── Keys whose values will be replaced with "[REDACTED]" in logs ──────────────
// Add any key Marblism might send that you never want in your logs.
=======
"use strict";

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
const SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "api_key", "apikey",
  "authorization", "auth", "key", "credential", "credentials",
  "private", "private_key", "access_token", "refresh_token",
  "client_secret", "webhook_secret",
]);

<<<<<<< HEAD
// ── Maximum length of a string value shown in logs (truncated after this) ────
const MAX_VALUE_LENGTH = 120;

/**
 * Creates a logger scoped to a single request.
 *
 * @param {string} requestId - A short ID to prefix all log lines, e.g. "req_1712345678"
 * @returns {object} Logger with info / warn / error / payload / debugPayload methods
 */
=======
const MAX_VALUE_LENGTH = 120;

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function createLogger(requestId) {
  const prefix = `[${requestId}]`;
  const isDebug = (process.env.LOG_LEVEL || "").toLowerCase() === "debug";

  return {
<<<<<<< HEAD
    /**
     * Logs an informational message and optional data.
     * @param {string} message
     * @param {object} [data]
     */
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    info(message, data) {
      console.log(formatLine(prefix, "INFO ", message, data));
    },

<<<<<<< HEAD
    /**
     * Logs a warning message and optional data.
     * @param {string} message
     * @param {object} [data]
     */
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    warn(message, data) {
      console.warn(formatLine(prefix, "WARN ", message, data));
    },

<<<<<<< HEAD
    /**
     * Logs an error message. Accepts a plain string, an Error object, or extra data.
     * @param {string} message
     * @param {Error|object} [errorOrData]
     */
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    error(message, errorOrData) {
      let data;
      if (errorOrData instanceof Error) {
        data = { message: errorOrData.message, stack: errorOrData.stack };
      } else {
        data = errorOrData;
      }
      console.error(formatLine(prefix, "ERROR", message, data));
    },

<<<<<<< HEAD
    /**
     * Logs a safe summary of an incoming payload.
     * Shows field names, value types, and truncated string previews.
     * Redacts any keys that appear in SENSITIVE_KEYS.
     * Never logs the full body content.
     *
     * @param {object} raw - The raw parsed payload object
     */
    payload(raw) {
      if (!raw || typeof raw !== "object") {
        console.log(`${prefix} [INFO ] Payload: (not an object — type: ${typeof raw})`);
=======
    payload(raw) {
      if (!raw || typeof raw !== "object") {
        console.log(`${prefix} [INFO ] Payload: (not an object - type: ${typeof raw})`);
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
        return;
      }

      console.log(`${prefix} [INFO ] Payload summary (${Object.keys(raw).length} fields):`);
<<<<<<< HEAD

=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
      for (const [key, value] of Object.entries(raw)) {
        const safeValue = redactAndSummarise(key, value);
        console.log(`${prefix} [INFO ]   ${key.padEnd(20)} ${safeValue}`);
      }
    },

<<<<<<< HEAD
    /**
     * Logs the full raw payload — only when LOG_LEVEL=debug.
     * Set LOG_LEVEL=debug in Netlify env vars when actively debugging.
     * Remove or set to "info" in production.
     *
     * @param {object} raw
     */
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    debugPayload(raw) {
      if (!isDebug) return;
      console.log(`${prefix} [DEBUG] Full raw payload:`);
      try {
<<<<<<< HEAD
        console.log(JSON.stringify(sanitiseForLog(raw), null, 2)
          .split("\n")
          .map((line) => `${prefix} [DEBUG]   ${line}`)
          .join("\n"));
=======
        console.log(
          JSON.stringify(sanitiseForLog(raw), null, 2)
            .split("\n")
            .map((line) => `${prefix} [DEBUG]   ${line}`)
            .join("\n")
        );
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
      } catch {
        console.log(`${prefix} [DEBUG] (payload could not be serialised)`);
      }
    },

<<<<<<< HEAD
    /** Convenience: logs the step number and name clearly */
    step(n, name) {
      console.log(`${prefix} [INFO ] ── Step ${n}: ${name}`);
=======
    step(n, name) {
      console.log(`${prefix} [INFO ] Step ${n}: ${name}`);
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    },
  };
}

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function formatLine(prefix, level, message, data) {
  let line = `${prefix} [${level}] ${message}`;
  if (data !== undefined && data !== null) {
    try {
<<<<<<< HEAD
      const dataStr = typeof data === "object"
        ? JSON.stringify(data)
        : String(data);
      line += ` — ${dataStr}`;
    } catch {
      line += " — (data could not be serialised)";
=======
      const dataStr = typeof data === "object" ? JSON.stringify(data) : String(data);
      line += ` - ${dataStr}`;
    } catch {
      line += " - (data could not be serialised)";
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    }
  }
  return line;
}

<<<<<<< HEAD
/**
 * Returns a human-readable, safe summary of a single field value.
 * Redacts sensitive key values. Truncates long strings.
 *
 * @param {string} key
 * @param {*} value
 * @returns {string}
 */
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function redactAndSummarise(key, value) {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return "[REDACTED]";
  }

<<<<<<< HEAD
  if (value === null)      return "null";
=======
  if (value === null) return "null";
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  if (value === undefined) return "undefined";

  const type = typeof value;

  if (type === "boolean") return `(boolean) ${value}`;
<<<<<<< HEAD
  if (type === "number")  return `(number) ${value}`;

  if (type === "string") {
    const preview = value.length > MAX_VALUE_LENGTH
      ? value.slice(0, MAX_VALUE_LENGTH) + `… (+${value.length - MAX_VALUE_LENGTH} chars)`
=======
  if (type === "number") return `(number) ${value}`;

  if (type === "string") {
    const preview = value.length > MAX_VALUE_LENGTH
      ? value.slice(0, MAX_VALUE_LENGTH) + `... (+${value.length - MAX_VALUE_LENGTH} chars)`
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
      : value;
    return `(string[${value.length}]) "${preview}"`;
  }

  if (Array.isArray(value)) {
    const preview = value.slice(0, 5).map(String).join(", ");
<<<<<<< HEAD
    const suffix  = value.length > 5 ? `, …+${value.length - 5} more` : "";
=======
    const suffix = value.length > 5 ? `, ...+${value.length - 5} more` : "";
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    return `(array[${value.length}]) [${preview}${suffix}]`;
  }

  if (type === "object") {
    return `(object) {${Object.keys(value).join(", ")}}`;
  }

  return `(${type}) ${String(value).slice(0, 60)}`;
}

<<<<<<< HEAD
/**
 * Deep-clones an object and redacts sensitive keys at all levels.
 * Used for the full debug dump.
 *
 * @param {*} value
 * @returns {*}
 */
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function sanitiseForLog(value) {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sanitiseForLog);
  }

  const result = {};
<<<<<<< HEAD
  for (const [k, v] of Object.entries(value)) {
    result[k] = SENSITIVE_KEYS.has(k.toLowerCase())
      ? "[REDACTED]"
      : sanitiseForLog(v);
=======
  for (const [key, child] of Object.entries(value)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : sanitiseForLog(child);
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  }
  return result;
}

module.exports = { createLogger };
