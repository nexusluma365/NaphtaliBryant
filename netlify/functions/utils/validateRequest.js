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

  const secretHeader = normalized["x-webhook-secret"] || "";
  if (secretHeader) {
    return timingSafeEqual(secretHeader.trim(), secret);
  }

  return false;
}

function timingSafeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function normalizeHeaders(headers) {
  if (!headers || typeof headers !== "object") return {};
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
}

module.exports = { validateWebhookSecret };
