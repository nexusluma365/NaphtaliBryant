"use strict";

function buildMarkdown(post) {
  const {
    title,
    body,
    excerpt = "",
    author = "Naphtali Bryant",
    category = "",
    image = "",
    tags = [],
    draft = false,
    publishDate = "",
  } = post;

  const date = resolveDate(publishDate);
  const tagsBlock =
    Array.isArray(tags) && tags.length > 0
      ? "tags:\n" + tags.map((tag) => `  - ${cleanTag(tag)}`).join("\n")
      : "tags: []";

  const quote = (str) => String(str || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  const frontmatter = [
    "---",
    `title: "${quote(title)}"`,
    `date: "${date}"`,
    `author: "${quote(author)}"`,
    `category: "${quote(category)}"`,
    `image: "${quote(image)}"`,
    `excerpt: "${quote(excerpt)}"`,
    `draft: ${draft === true ? "true" : "false"}`,
    tagsBlock,
    "---",
  ].join("\n");

  return `${frontmatter}\n\n${body.trim()}\n`;
}

function resolveDate(input) {
  if (input) {
    try {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
    } catch {}
  }

  return new Date().toISOString().slice(0, 10);
}

function cleanTag(tag) {
  return String(tag)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

module.exports = { buildMarkdown };
