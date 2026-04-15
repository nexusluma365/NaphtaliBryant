"use strict";

function slugify(title) {
  if (!title || typeof title !== "string") {
    throw new Error("slugify() requires a non-empty string");
  }

  return title
    .toLowerCase()
    .trim()
    .replace(/['`]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = { slugify };
