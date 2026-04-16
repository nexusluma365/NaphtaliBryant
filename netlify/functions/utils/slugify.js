// ─────────────────────────────────────────────────────────────────────────────
// utils/slugify.js
//
// Converts a post title into a clean, URL-safe slug.
//
// Examples:
//   "Hello World! This is AI-powered." → "hello-world-this-is-ai-powered"
//   "  10 Ways AI Transforms Marketing  " → "10-ways-ai-transforms-marketing"
//   "What's the ROI? (Case Study)" → "whats-the-roi-case-study"
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

/**
 * Converts a title string into a URL-safe slug.
 *
 * @param {string} title - The post title
 * @returns {string}     - The generated slug
 * @throws {Error}       - If title is missing or not a string
 */
function slugify(title) {
  if (!title || typeof title !== "string") {
    throw new Error("slugify() requires a non-empty string");
  }

  return (
    title
      .toLowerCase()                    // Step 1: lowercase everything
      .trim()                           // Step 2: remove leading/trailing whitespace
      .replace(/[''`]/g, "")            // Step 3: strip apostrophes (what's → whats)
      .replace(/[^a-z0-9\s-]/g, " ")   // Step 4: replace all non-alphanumeric chars with a space
      .replace(/\s+/g, "-")            // Step 5: replace whitespace runs with a single hyphen
      .replace(/-+/g, "-")             // Step 6: collapse multiple hyphens into one
      .replace(/^-+|-+$/g, "")         // Step 7: strip leading and trailing hyphens
  );
}

module.exports = { slugify };
