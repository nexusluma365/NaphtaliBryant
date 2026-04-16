<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// netlify/functions/marblism-bridge.js
//
// Marblism → GitHub → Netlify automation bridge.
// Accepts any reasonable Marblism payload shape and normalises it automatically.
//
// ENDPOINT:
//   POST https://your-site.netlify.app/.netlify/functions/marblism-bridge
//   or   https://your-site.netlify.app/api/publish  (alias via netlify.toml)
//
// FLOW:
//   1.  Reject non-POST requests
//   2.  Validate the webhook secret
//   3.  Parse the raw JSON body
//   4.  Log the incoming payload safely (field names + type summary, no data dump)
//   5.  Normalise the payload — maps any field names → canonical structure
//   6.  Generate a slug from the normalised title
//   7.  Check for a duplicate post on GitHub
//   8.  Build the markdown file with frontmatter
//   9.  Commit to GitHub (triggers Netlify redeploy automatically)
//  10.  Return a structured JSON success or error response
//
// PAYLOAD NORMALISATION:
//   The normaliser in utils/normalizePayload.js accepts many field name
//   variations. If Marblism sends unknown field names, update the FIELD_MAP
//   in that file — no changes needed here.
//
// REQUIRED ENV VARS:
//   WEBHOOK_SECRET  — Marblism must send this in every request
//   GITHUB_TOKEN    — Personal Access Token with "repo" scope
//
// OPTIONAL ENV VARS:
//   GITHUB_OWNER        defaults to "nexusluma365"
//   GITHUB_REPO         defaults to "NaphtaliBryant"
//   GITHUB_BRANCH       defaults to "main"
//   DEFAULT_AUTHOR      defaults to "Naphtali Bryant"
//   DRAFT_BY_DEFAULT    defaults to "false"
//   LOG_LEVEL           set to "debug" to log full raw payloads (dev only)
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const { validateWebhookSecret }          = require("./utils/validateRequest");
const { normalizePayload }               = require("./utils/normalizePayload");
const { slugify }                        = require("./utils/slugify");
const { buildMarkdown }                  = require("./utils/buildMarkdown");
const { getFileSha, commitMarkdownFile } = require("./utils/githubApi");
const { createLogger }                   = require("./utils/logger");

const POSTS_FOLDER = "content/posts";

// ─────────────────────────────────────────────────────────────────────────────
// Handler — Netlify calls this on every incoming request
// ─────────────────────────────────────────────────────────────────────────────

exports.handler = async function handler(event) {
  const requestId = `req_${Date.now()}`;
  const log       = createLogger(requestId);

  log.info(`Incoming ${event.httpMethod} ${event.path}`);

  // ── Step 1: Only accept POST ─────────────────────────────────────────────
  if (event.httpMethod !== "POST") {
    log.warn(`Rejected — wrong method: ${event.httpMethod}`);
    return errorResponse(405, "Method not allowed", {
      detail: `Expected POST, received ${event.httpMethod}.`,
      hint:   "Configure your webhook sender to use method: POST.",
    });
  }

  // ── Step 2: Validate webhook secret ─────────────────────────────────────
  if (!validateWebhookSecret(event.headers, process.env.WEBHOOK_SECRET)) {
    log.warn("Rejected — invalid or missing webhook secret");
    return errorResponse(401, "Unauthorized", {
      detail: "The webhook secret is missing or does not match WEBHOOK_SECRET.",
      hint:   "Set Authorization: Bearer <your-WEBHOOK_SECRET> on every request.",
    });
  }

  log.step(1, "Auth ✓");

  // ── Step 3: Parse the JSON body ──────────────────────────────────────────
=======
"use strict";

const { validateWebhookSecret } = require("./utils/validateRequest");
const { normalizePayload } = require("./utils/normalizePayload");
const { slugify } = require("./utils/slugify");
const { buildMarkdown } = require("./utils/buildMarkdown");
const { getFileSha, commitMarkdownFile } = require("./utils/githubApi");
const { createLogger } = require("./utils/logger");

const POSTS_FOLDER = "content/posts";

exports.handler = async function handler(event) {
  const requestId = `req_${Date.now()}`;
  const log = createLogger(requestId);

  log.info(`Incoming ${event.httpMethod} ${event.path}`);

  if (event.httpMethod !== "POST") {
    log.warn(`Rejected - wrong method: ${event.httpMethod}`);
    return errorResponse(405, "Method not allowed", {
      detail: `Expected POST, received ${event.httpMethod}.`,
      hint: "Configure your webhook sender to use method: POST.",
    });
  }

  if (!validateWebhookSecret(event.headers, process.env.WEBHOOK_SECRET)) {
    log.warn("Rejected - invalid or missing webhook secret");
    return errorResponse(401, "Unauthorized", {
      detail: "The webhook secret is missing or does not match WEBHOOK_SECRET.",
      hint: "Set Authorization: Bearer <your-WEBHOOK_SECRET> on every request.",
    });
  }

  log.step(1, "Auth ok");

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  let raw;
  try {
    if (!event.body || !event.body.trim()) {
      throw new Error("Request body is empty");
    }
    raw = JSON.parse(event.body);
  } catch (parseErr) {
    log.error("JSON parse failed", parseErr);
    return errorResponse(400, "Invalid JSON body", {
<<<<<<< HEAD
      detail:  parseErr.message,
      hint:    "Make sure the request body is valid JSON and Content-Type is application/json.",
      example: {
        title:       "My Post Title",
        body:        "Post content here...",
        excerpt:     "Short summary",
        author:      "Naphtali Bryant",
        category:    "Marketing",
        tags:        ["ai", "marketing"],
        draft:       false,
=======
      detail: parseErr.message,
      hint: "Make sure the request body is valid JSON and Content-Type is application/json.",
      example: {
        title: "My Post Title",
        body: "Post content here...",
        excerpt: "Short summary",
        author: "Naphtali Bryant",
        category: "Marketing",
        tags: ["ai", "marketing"],
        draft: false,
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
        publishDate: "2026-04-08",
      },
    });
  }

<<<<<<< HEAD
  log.step(2, "Body parsed ✓");

  // ── Step 4: Log the incoming payload safely ──────────────────────────────
  // Always logs a field-name + shape summary. Never logs raw content values.
  // Set LOG_LEVEL=debug in Netlify env vars to log the full sanitised payload.
  log.info(`Raw payload received — ${Object.keys(raw).length} field(s)`);
  log.payload(raw);       // safe summary: key names + value shapes
  log.debugPayload(raw);  // full dump (only if LOG_LEVEL=debug)

  // ── Step 5: Normalise the payload ────────────────────────────────────────
  // This maps any combination of field names → canonical structure.
  // If Marblism uses unexpected field names, update FIELD_MAP in normalizePayload.js.
  let post, warnings;
=======
  log.step(2, "Body parsed ok");
  log.info(`Raw payload received - ${Object.keys(raw).length} field(s)`);
  log.payload(raw);
  log.debugPayload(raw);

  let post;
  let warnings;
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15

  try {
    ({ post, warnings } = normalizePayload(raw, log));
  } catch (normErr) {
<<<<<<< HEAD

    // A VALIDATION_ERROR means required fields were missing or unparseable.
    // Return a rich 400 response that tells the caller exactly what's wrong.
    if (normErr.type === "VALIDATION_ERROR") {
      log.error("Payload validation failed", { errors: normErr.errors });
      return errorResponse(400, "Payload validation failed", {
        errors:         normErr.errors,
        fieldErrors:    normErr.fieldErrors,
        hint:           buildValidationHint(normErr.fieldErrors),
=======
    if (normErr.type === "VALIDATION_ERROR") {
      log.error("Payload validation failed", { errors: normErr.errors });
      return errorResponse(400, "Payload validation failed", {
        errors: normErr.errors,
        fieldErrors: normErr.fieldErrors,
        hint: buildValidationHint(normErr.fieldErrors),
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
        receivedFields: Object.keys(raw),
        expectedFields: {
          required: ["title", "body"],
          optional: ["excerpt", "author", "category", "image", "tags", "draft", "publishDate"],
        },
<<<<<<< HEAD
        documentation:  "Add Marblism's actual field names to FIELD_MAP in utils/normalizePayload.js",
      });
    }

    // Anything else is an unexpected internal error.
=======
        documentation: "Add Marblism field names to FIELD_MAP in utils/normalizePayload.js",
      });
    }

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    log.error("Unexpected normalisation error", normErr);
    return errorResponse(500, "Internal error during payload processing", {
      detail: normErr.message,
    });
  }

<<<<<<< HEAD
  log.step(3, "Payload normalised ✓");

  // Surface non-fatal warnings — e.g. unknown fields that were ignored,
  // or ambiguous values that fell back to defaults.
  if (warnings.length > 0) {
    warnings.forEach((w) => log.warn(w));
  }

  log.info("Normalised post", {
    title:       post.title,
    author:      post.author,
    category:    post.category,
    tags:        post.tags,
    draft:       post.draft,
    publishDate: post.publishDate || "(today)",
    bodyLength:  post.body.length,
    hasExcerpt:  post.excerpt.length > 0,
    hasImage:    post.image.length > 0,
  });

  // ── Step 6: Generate slug ────────────────────────────────────────────────
=======
  log.step(3, "Payload normalised ok");

  if (warnings.length > 0) {
    warnings.forEach((warning) => log.warn(warning));
  }

  log.info("Normalised post", {
    title: post.title,
    author: post.author,
    category: post.category,
    tags: post.tags,
    draft: post.draft,
    publishDate: post.publishDate || "(today)",
    bodyLength: post.body.length,
    hasExcerpt: post.excerpt.length > 0,
    hasImage: post.image.length > 0,
  });

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  let slug;
  try {
    slug = slugify(post.title);
  } catch (slugErr) {
    log.error("Slug generation failed", slugErr);
    return errorResponse(400, "Could not generate slug", {
<<<<<<< HEAD
      detail:  slugErr.message,
      title:   post.title,
      hint:    "The title must contain at least some letters or digits.",
=======
      detail: slugErr.message,
      title: post.title,
      hint: "The title must contain at least some letters or digits.",
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    });
  }

  const filePath = `${POSTS_FOLDER}/${slug}.md`;
<<<<<<< HEAD
  log.step(4, `Slug ✓ — "${slug}"`);
  log.info(`Target file: ${filePath}`);

  // ── Step 7: Duplicate detection ──────────────────────────────────────────
=======
  log.step(4, `Slug ok - "${slug}"`);
  log.info(`Target file: ${filePath}`);

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  let existingSha;
  try {
    existingSha = await getFileSha(filePath);
  } catch (shaErr) {
    log.error("GitHub file-check failed", shaErr);
    return errorResponse(502, "Could not check for duplicate post", {
      detail: shaErr.message,
<<<<<<< HEAD
      hint:   "Verify GITHUB_TOKEN has 'repo' scope and GITHUB_OWNER / GITHUB_REPO are correct.",
=======
      hint: "Verify GITHUB_TOKEN has repo scope and GITHUB_OWNER / GITHUB_REPO are correct.",
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    });
  }

  if (existingSha !== null) {
<<<<<<< HEAD
    log.warn(`Duplicate detected — ${filePath} already exists (sha: ${existingSha})`);
    return errorResponse(409, "Duplicate post", {
      detail:   `A post with slug "${slug}" already exists at ${filePath}.`,
      slug,
      filePath,
      hint:     "Change the post title slightly to generate a different slug, " +
                "or delete the existing file in GitHub first.",
    });
  }

  log.step(5, "Duplicate check ✓ — no existing file found");

  // ── Step 8: Build markdown ───────────────────────────────────────────────
=======
    log.warn(`Duplicate detected - ${filePath} already exists (sha: ${existingSha})`);
    return errorResponse(409, "Duplicate post", {
      detail: `A post with slug "${slug}" already exists at ${filePath}.`,
      slug,
      filePath,
      hint: "Change the post title slightly to generate a different slug, or delete the existing file in GitHub first.",
    });
  }

  log.step(5, "Duplicate check ok");

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  let markdownContent;
  try {
    markdownContent = buildMarkdown(post);
  } catch (buildErr) {
    log.error("Markdown build failed", buildErr);
    return errorResponse(500, "Failed to build markdown file", {
      detail: buildErr.message,
    });
  }

<<<<<<< HEAD
  log.step(6, `Markdown built ✓ — ${markdownContent.length} bytes`);

  // ── Step 9: Commit to GitHub ─────────────────────────────────────────────
  // This commit on your watched branch automatically triggers Netlify to rebuild.
  const mode          = post.draft ? "draft" : "published";
=======
  log.step(6, `Markdown built ok - ${markdownContent.length} bytes`);

  const mode = post.draft ? "draft" : "published";
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
  const commitMessage = `[marblism-bridge] add ${mode} post: ${post.title}`;

  let githubResult;
  try {
    githubResult = await commitMarkdownFile(filePath, markdownContent, commitMessage, null);
  } catch (commitErr) {
    log.error("GitHub commit failed", commitErr);
    return errorResponse(502, "Failed to commit to GitHub", {
      detail: commitErr.message,
<<<<<<< HEAD
      hint:   [
        "Common causes:",
        "  • GITHUB_TOKEN is expired or was never set",
        "  • Token does not have the 'repo' scope",
        "  • GITHUB_BRANCH doesn't exist (check it's 'main' not 'master')",
        "  • GITHUB_OWNER or GITHUB_REPO is misspelled",
=======
      hint: [
        "Common causes:",
        "  - GITHUB_TOKEN is expired or was never set",
        "  - Token does not have the repo scope",
        "  - GITHUB_BRANCH does not exist",
        "  - GITHUB_OWNER or GITHUB_REPO is misspelled",
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
      ].join("\n"),
    });
  }

<<<<<<< HEAD
  const commitSha = githubResult?.commit?.sha      || null;
  const fileUrl   = githubResult?.content?.html_url || null;

  log.step(7, `GitHub commit ✓`);
  log.info("Commit details", { commitSha, fileUrl });
  log.info("Netlify auto-deploy triggered by commit");

  // ── Step 10: Return success ──────────────────────────────────────────────
  return successResponse({
    message:    `Post "${post.title}" committed as ${mode}.`,
    slug,
    filePath,
    mode,
    draft:      post.draft,
    commitSha,
    fileUrl,
    repo:       `${process.env.GITHUB_OWNER || "nexusluma365"}/${process.env.GITHUB_REPO || "NaphtaliBryant"}`,
    branch:     process.env.GITHUB_BRANCH || "main",
    warnings:   warnings.length > 0 ? warnings : undefined,
    note: post.draft
      ? "Saved as draft — won't appear publicly until draft: false is set."
      : "Netlify is rebuilding your site now. The post will be live within ~1 minute.",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Response builders
// ─────────────────────────────────────────────────────────────────────────────

=======
  const commitSha = githubResult?.commit?.sha || null;
  const fileUrl = githubResult?.content?.html_url || null;

  log.step(7, "GitHub commit ok");
  log.info("Commit details", { commitSha, fileUrl });

  return successResponse({
    message: `Post "${post.title}" committed as ${mode}.`,
    slug,
    filePath,
    mode,
    draft: post.draft,
    commitSha,
    fileUrl,
    repo: `${process.env.GITHUB_OWNER || "nexusluma365"}/${process.env.GITHUB_REPO || "NaphtaliBryant"}`,
    branch: process.env.GITHUB_BRANCH || "main",
    warnings: warnings.length > 0 ? warnings : undefined,
    note: post.draft
      ? "Saved as draft - won't appear publicly until draft: false is set."
      : "Netlify is rebuilding your site now. The post will be live within about a minute.",
  });
};

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function successResponse(data) {
  return {
    statusCode: 200,
    headers: responseHeaders(),
    body: JSON.stringify({ success: true, ...data }, null, 2),
  };
}

function errorResponse(statusCode, error, extra = {}) {
  return {
    statusCode,
    headers: responseHeaders(),
    body: JSON.stringify({ success: false, error, ...extra }, null, 2),
  };
}

function responseHeaders() {
  return {
<<<<<<< HEAD
    "Content-Type":                "application/json",
    "Cache-Control":               "no-store, no-cache",
=======
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache",
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
    "Access-Control-Allow-Origin": "*",
  };
}

<<<<<<< HEAD
/**
 * Builds a targeted, human-readable hint for validation errors.
 * Points specifically at the field(s) that failed and how to fix them.
 *
 * @param {object} fieldErrors
 * @returns {string}
 */
=======
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
function buildValidationHint(fieldErrors) {
  const failed = Object.keys(fieldErrors);
  if (failed.length === 0) return "Check the errors array above for details.";

  if (failed.includes("title") && failed.includes("body")) {
<<<<<<< HEAD
    return "Both 'title' and 'body' are required. " +
           "Check the exact field names Marblism sends, then add them to " +
           "FIELD_MAP in utils/normalizePayload.js if they differ from the defaults.";
  }
  if (failed.includes("title")) {
    return "'title' is required. Known aliases: title, post_title, heading, name, subject, headline. " +
           "If Marblism uses a different key, add it to FIELD_MAP.title.aliases in normalizePayload.js.";
  }
  if (failed.includes("body")) {
    return "'body' (post content) is required. Known aliases: body, content, post_content, html, markdown, text. " +
           "If Marblism uses a different key, add it to FIELD_MAP.body.aliases in normalizePayload.js.";
  }
  return `Failed field(s): ${failed.join(", ")}. Check normalizePayload.js → FIELD_MAP.`;
=======
    return "Both title and body are required. Check the exact field names Marblism sends, then add them to FIELD_MAP in utils/normalizePayload.js if they differ from the defaults.";
  }
  if (failed.includes("title")) {
    return "title is required. Known aliases: title, post_title, heading, name, subject, headline.";
  }
  if (failed.includes("body")) {
    return "body is required. Known aliases: body, content, post_content, html, markdown, text.";
  }
  return `Failed field(s): ${failed.join(", ")}. Check normalizePayload.js -> FIELD_MAP.`;
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
}
