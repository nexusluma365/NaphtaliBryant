<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// utils/validateRequest.js
//
// Validates that an incoming webhook request is genuinely from Marblism
// (or any authorised sender) using a shared secret token.
//
// HOW IT WORKS:
//   You set WEBHOOK_SECRET in your Netlify environment variables.
//   The sender (Marblism) must include that same secret in every request.
//   If the secret is missing or wrong, the request is rejected with 401.
//
// TWO SUPPORTED HEADER FORMATS:
//   Option A (preferred): Authorization: Bearer <your-secret>
//   Option B (fallback):  X-Webhook-Secret: <your-secret>
//
// SECURITY NOTE:
//   We use a constant-time comparison to prevent timing attacks.
//   A regular === comparison leaks information about how many characters
//   match, which lets attackers guess the secret character by character.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

/**
 * Returns true if the incoming request carries a valid webhook secret.
 *
 * @param {Object} headers - The raw headers object from the Netlify event
 * @param {string} secret  - The value of the WEBHOOK_SECRET environment variable
 * @returns {boolean}
 */
function validateWebhookSecret(headers, secret) {
  // If the environment variable isn't set, block everything and log a warning.
  if (!secret) {
    console.error(
      "[validateRequest] CRITICAL: WEBHOOK_SECRET environment variable is not set. " +
      "All webhook requests will be rejected until this is configured in Netlify."
    );
    return false;
  }

  // Normalize header keys to lowercase so we handle both
  // "Authorization" and "authorization" consistently.
  const normalized = normalizeHeaders(headers);

  // ── Option A: Authorization: Bearer <secret> ─────────────────────────────
  const authHeader = normalized["authorization"] || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim(); // strip "Bearer " prefix
    return timingSafeEqual(token, secret);
  }

  // ── Option B: X-Webhook-Secret: <secret> ─────────────────────────────────
=======
"use strict";

function validateWebhookSecret(headers, secret) {
  if (!secret) {
    console.error("[validateRequest] WEBHOOK_SECRET is not set.");
    return false;
  }

  const normalized = normalizeHeaders(headers);
  const authHeader = normalized.authorization || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim();
    return timingSafeEqual(token, secret);
  }

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  const secretHeader = normalized["x-webhook-secret"] || "";
  if (secretHeader) {
    return timingSafeEqual(secretHeader.trim(), secret);
  }

<<<<<<< HEAD
  // Neither header was found — reject the request
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compares two strings in constant time.
 * Returns true only if both strings are identical in length and content.
 *
 * Why this matters: a normal string comparison (===) returns early
 * the moment it finds a mismatch. An attacker can measure those tiny
 * time differences to guess secret values character by character.
 * A constant-time comparison always takes the same amount of time
 * regardless of where a mismatch occurs.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
=======
  return false;
}

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let mismatch = 0;
<<<<<<< HEAD
  for (let i = 0; i < a.length; i++) {
    // XOR the char codes — any difference makes mismatch non-zero
=======
  for (let i = 0; i < a.length; i += 1) {
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

<<<<<<< HEAD
/**
 * Converts all header keys to lowercase for consistent lookup.
 *
 * @param {Object} headers
 * @returns {Object}
 */
function normalizeHeaders(headers) {
  if (!headers || typeof headers !== "object") return {};
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
=======
function normalizeHeaders(headers) {
  if (!headers || typeof headers !== "object") return {};
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  );
}

module.exports = { validateWebhookSecret };
<<<<<<< HEAD

// ─────────────────────────────────────────────────────────────────────────────
// FUTURE UPGRADE: HMAC-SHA256 Signature Verification
//
// If Marblism ever adds HMAC signing (similar to how GitHub webhooks work),
// replace validateWebhookSecret with this implementation:
//
//   const crypto = require("crypto");
//
//   function validateHmacSignature(headers, rawBodyString, secret) {
//     const signature = headers["x-marblism-signature"] || "";
//     const expected = "sha256=" + crypto
//       .createHmac("sha256", secret)
//       .update(rawBodyString, "utf8")
//       .digest("hex");
//
//     if (signature.length !== expected.length) return false;
//     return crypto.timingSafeEqual(
//       Buffer.from(signature, "utf8"),
//       Buffer.from(expected, "utf8")
//     );
//   }
//
// Then call it in marblism-bridge.js:
//   if (!validateHmacSignature(event.headers, event.body, secret)) { ... }
// ─────────────────────────────────────────────────────────────────────────────
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
