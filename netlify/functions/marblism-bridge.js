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

  let raw;
  try {
    if (!event.body || !event.body.trim()) {
      throw new Error("Request body is empty");
    }
    raw = JSON.parse(event.body);
  } catch (parseErr) {
    log.error("JSON parse failed", parseErr);
    return errorResponse(400, "Invalid JSON body", {
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
        publishDate: "2026-04-08",
      },
    });
  }

  log.step(2, "Body parsed ok");
  log.info(`Raw payload received - ${Object.keys(raw).length} field(s)`);
  log.payload(raw);
  log.debugPayload(raw);

  let post;
  let warnings;

  try {
    ({ post, warnings } = normalizePayload(raw, log));
  } catch (normErr) {
    if (normErr.type === "VALIDATION_ERROR") {
      log.error("Payload validation failed", { errors: normErr.errors });
      return errorResponse(400, "Payload validation failed", {
        errors: normErr.errors,
        fieldErrors: normErr.fieldErrors,
        hint: buildValidationHint(normErr.fieldErrors),
        receivedFields: Object.keys(raw),
        expectedFields: {
          required: ["title", "body"],
          optional: ["excerpt", "author", "category", "image", "tags", "draft", "publishDate"],
        },
        documentation: "Add Marblism field names to FIELD_MAP in utils/normalizePayload.js",
      });
    }

    log.error("Unexpected normalisation error", normErr);
    return errorResponse(500, "Internal error during payload processing", {
      detail: normErr.message,
    });
  }

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

  let slug;
  try {
    slug = slugify(post.title);
  } catch (slugErr) {
    log.error("Slug generation failed", slugErr);
    return errorResponse(400, "Could not generate slug", {
      detail: slugErr.message,
      title: post.title,
      hint: "The title must contain at least some letters or digits.",
    });
  }

  const filePath = `${POSTS_FOLDER}/${slug}.md`;
  log.step(4, `Slug ok - "${slug}"`);
  log.info(`Target file: ${filePath}`);

  let existingSha;
  try {
    existingSha = await getFileSha(filePath);
  } catch (shaErr) {
    log.error("GitHub file-check failed", shaErr);
    return errorResponse(502, "Could not check for duplicate post", {
      detail: shaErr.message,
      hint: "Verify GITHUB_TOKEN has repo scope and GITHUB_OWNER / GITHUB_REPO are correct.",
    });
  }

  if (existingSha !== null) {
    log.warn(`Duplicate detected - ${filePath} already exists (sha: ${existingSha})`);
    return errorResponse(409, "Duplicate post", {
      detail: `A post with slug "${slug}" already exists at ${filePath}.`,
      slug,
      filePath,
      hint: "Change the post title slightly to generate a different slug, or delete the existing file in GitHub first.",
    });
  }

  log.step(5, "Duplicate check ok");

  let markdownContent;
  try {
    markdownContent = buildMarkdown(post);
  } catch (buildErr) {
    log.error("Markdown build failed", buildErr);
    return errorResponse(500, "Failed to build markdown file", {
      detail: buildErr.message,
    });
  }

  log.step(6, `Markdown built ok - ${markdownContent.length} bytes`);

  const mode = post.draft ? "draft" : "published";
  const commitMessage = `[marblism-bridge] add ${mode} post: ${post.title}`;

  let githubResult;
  try {
    githubResult = await commitMarkdownFile(filePath, markdownContent, commitMessage, null);
  } catch (commitErr) {
    log.error("GitHub commit failed", commitErr);
    return errorResponse(502, "Failed to commit to GitHub", {
      detail: commitErr.message,
      hint: [
        "Common causes:",
        "  - GITHUB_TOKEN is expired or was never set",
        "  - Token does not have the repo scope",
        "  - GITHUB_BRANCH does not exist",
        "  - GITHUB_OWNER or GITHUB_REPO is misspelled",
      ].join("\n"),
    });
  }

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
    "Content-Type": "application/json",
    "Cache-Control": "no-store, no-cache",
    "Access-Control-Allow-Origin": "*",
  };
}

function buildValidationHint(fieldErrors) {
  const failed = Object.keys(fieldErrors);
  if (failed.length === 0) return "Check the errors array above for details.";

  if (failed.includes("title") && failed.includes("body")) {
    return "Both title and body are required. Check the exact field names Marblism sends, then add them to FIELD_MAP in utils/normalizePayload.js if they differ from the defaults.";
  }
  if (failed.includes("title")) {
    return "title is required. Known aliases: title, post_title, heading, name, subject, headline.";
  }
  if (failed.includes("body")) {
    return "body is required. Known aliases: body, content, post_content, html, markdown, text.";
  }
  return `Failed field(s): ${failed.join(", ")}. Check normalizePayload.js -> FIELD_MAP.`;
}
