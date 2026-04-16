<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// utils/buildMarkdown.js
//
// Builds a complete markdown file string from a sanitised post object.
// The output includes YAML frontmatter followed by the post body.
//
// OUTPUT FORMAT:
//
//   ---
//   title: "Post Title Here"
//   date: "2026-04-08"
//   author: "Naphtali Bryant"
//   category: "Marketing"
//   image: "/assets/uploads/cover.jpg"
//   excerpt: "A short summary of the post."
//   draft: false
//   tags:
//     - marketing
//     - ai
//     - automation
//   ---
//
//   Post body content goes here. Can be full markdown.
//
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

/**
 * Builds a complete markdown string with YAML frontmatter.
 *
 * @param {Object}   post
 * @param {string}   post.title       - Post title (required)
 * @param {string}   post.body        - Post body in markdown (required)
 * @param {string}   [post.excerpt]   - Short summary / meta description
 * @param {string}   [post.author]    - Author name
 * @param {string}   [post.category]  - Content category
 * @param {string}   [post.image]     - Cover image path or URL
 * @param {string[]} [post.tags]      - Array of tag strings
 * @param {boolean}  [post.draft]     - true = draft, false = published
 * @param {string}   [post.publishDate] - ISO date string or YYYY-MM-DD
 *
 * @returns {string} Complete markdown file content ready to commit
 */
=======
"use strict";

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function buildMarkdown(post) {
  const {
    title,
    body,
<<<<<<< HEAD
    excerpt     = "",
    author      = "Naphtali Bryant",
    category    = "",
    image       = "",
    tags        = [],
    draft       = false,
    publishDate = "",
  } = post;

  // ── Date ──────────────────────────────────────────────────────────────────
  // Use the provided publishDate if valid, otherwise fall back to today.
  const date = resolveDate(publishDate);

  // ── Tags block ────────────────────────────────────────────────────────────
  // YAML list format if tags exist, empty array shorthand if none.
  const tagsBlock =
    Array.isArray(tags) && tags.length > 0
      ? "tags:\n" + tags.map((t) => `  - ${cleanTag(t)}`).join("\n")
      : "tags: []";

  // ── Frontmatter string values need internal quotes escaped ────────────────
  const q = (str) => String(str || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  // ── Assemble frontmatter ──────────────────────────────────────────────────
  const frontmatter = [
    "---",
    `title: "${q(title)}"`,
    `date: "${date}"`,
    `author: "${q(author)}"`,
    `category: "${q(category)}"`,
    `image: "${q(image)}"`,
    `excerpt: "${q(excerpt)}"`,
=======
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
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    `draft: ${draft === true ? "true" : "false"}`,
    tagsBlock,
    "---",
  ].join("\n");

<<<<<<< HEAD
  // ── Final file: frontmatter + blank line + body + trailing newline ─────────
  // The trailing newline is a POSIX convention and prevents "no newline at
  // end of file" warnings in git diffs.
  return `${frontmatter}\n\n${body.trim()}\n`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a YYYY-MM-DD date string.
 * Accepts an ISO timestamp, a YYYY-MM-DD string, or falls back to today.
 *
 * @param {string} input
 * @returns {string} e.g. "2026-04-08"
 */
=======
  return `${frontmatter}\n\n${body.trim()}\n`;
}

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function resolveDate(input) {
  if (input) {
    try {
      const parsed = new Date(input);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
      }
<<<<<<< HEAD
    } catch {
      // fall through to today
    }
  }
  return new Date().toISOString().slice(0, 10);
}

/**
 * Sanitises a single tag for safe YAML output.
 * Keeps lowercase letters, digits, and hyphens only.
 *
 * @param {string} tag
 * @returns {string}
 */
=======
    } catch {}
  }

  return new Date().toISOString().slice(0, 10);
}

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function cleanTag(tag) {
  return String(tag)
    .toLowerCase()
    .trim()
<<<<<<< HEAD
    .replace(/[^a-z0-9-]/g, "-")   // replace anything non-alphanumeric with hyphen
    .replace(/-+/g, "-")           // collapse consecutive hyphens
    .replace(/^-+|-+$/g, "");      // strip leading/trailing hyphens
=======
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
}

module.exports = { buildMarkdown };
