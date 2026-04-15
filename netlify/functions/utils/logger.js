"use strict";

const SENSITIVE_KEYS = new Set([
  "password", "passwd", "secret", "token", "api_key", "apikey",
  "authorization", "auth", "key", "credential", "credentials",
  "private", "private_key", "access_token", "refresh_token",
  "client_secret", "webhook_secret",
]);

const MAX_VALUE_LENGTH = 120;

function createLogger(requestId) {
  const prefix = `[${requestId}]`;
  const isDebug = (process.env.LOG_LEVEL || "").toLowerCase() === "debug";

  return {
    info(message, data) {
      console.log(formatLine(prefix, "INFO ", message, data));
    },

    warn(message, data) {
      console.warn(formatLine(prefix, "WARN ", message, data));
    },

    error(message, errorOrData) {
      let data;
      if (errorOrData instanceof Error) {
        data = { message: errorOrData.message, stack: errorOrData.stack };
      } else {
        data = errorOrData;
      }
      console.error(formatLine(prefix, "ERROR", message, data));
    },

    payload(raw) {
      if (!raw || typeof raw !== "object") {
        console.log(`${prefix} [INFO ] Payload: (not an object - type: ${typeof raw})`);
        return;
      }

      console.log(`${prefix} [INFO ] Payload summary (${Object.keys(raw).length} fields):`);
      for (const [key, value] of Object.entries(raw)) {
        const safeValue = redactAndSummarise(key, value);
        console.log(`${prefix} [INFO ]   ${key.padEnd(20)} ${safeValue}`);
      }
    },

    debugPayload(raw) {
      if (!isDebug) return;
      console.log(`${prefix} [DEBUG] Full raw payload:`);
      try {
        console.log(
          JSON.stringify(sanitiseForLog(raw), null, 2)
            .split("\n")
            .map((line) => `${prefix} [DEBUG]   ${line}`)
            .join("\n")
        );
      } catch {
        console.log(`${prefix} [DEBUG] (payload could not be serialised)`);
      }
    },

    step(n, name) {
      console.log(`${prefix} [INFO ] Step ${n}: ${name}`);
    },
  };
}

function formatLine(prefix, level, message, data) {
  let line = `${prefix} [${level}] ${message}`;
  if (data !== undefined && data !== null) {
    try {
      const dataStr = typeof data === "object" ? JSON.stringify(data) : String(data);
      line += ` - ${dataStr}`;
    } catch {
      line += " - (data could not be serialised)";
    }
  }
  return line;
}

function redactAndSummarise(key, value) {
  if (SENSITIVE_KEYS.has(key.toLowerCase())) {
    return "[REDACTED]";
  }

  if (value === null) return "null";
  if (value === undefined) return "undefined";

  const type = typeof value;

  if (type === "boolean") return `(boolean) ${value}`;
  if (type === "number") return `(number) ${value}`;

  if (type === "string") {
    const preview = value.length > MAX_VALUE_LENGTH
      ? value.slice(0, MAX_VALUE_LENGTH) + `... (+${value.length - MAX_VALUE_LENGTH} chars)`
      : value;
    return `(string[${value.length}]) "${preview}"`;
  }

  if (Array.isArray(value)) {
    const preview = value.slice(0, 5).map(String).join(", ");
    const suffix = value.length > 5 ? `, ...+${value.length - 5} more` : "";
    return `(array[${value.length}]) [${preview}${suffix}]`;
  }

  if (type === "object") {
    return `(object) {${Object.keys(value).join(", ")}}`;
  }

  return `(${type}) ${String(value).slice(0, 60)}`;
}

function sanitiseForLog(value) {
  if (value === null || typeof value !== "object") return value;

  if (Array.isArray(value)) {
    return value.map(sanitiseForLog);
  }

  const result = {};
  for (const [key, child] of Object.entries(value)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? "[REDACTED]" : sanitiseForLog(child);
  }
  return result;
}

module.exports = { createLogger };
