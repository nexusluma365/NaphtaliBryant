// ─────────────────────────────────────────────────────────────────────────────
// utils/githubApi.js
//
// All GitHub REST API interactions live here.
//
// Hardcoded repo defaults (from your project config):
//   Owner:  nexusluma365
//   Repo:   NaphtaliBryant
//   Posts:  content/posts/
//
// These can be overridden by environment variables, but the defaults
// are set specifically for your project so you don't have to configure
// them unless you change repos.
//
// WHAT THIS FILE DOES:
//   getFileSha()         — Checks if a file exists (used for duplicate detection)
//   commitMarkdownFile() — Creates a new markdown file via the GitHub Contents API
//
// GITHUB API USED:
//   GET  /repos/{owner}/{repo}/contents/{path}  → check existence + get sha
//   PUT  /repos/{owner}/{repo}/contents/{path}  → create or update a file
//
// REQUIRED ENV VAR:
//   GITHUB_TOKEN  — Personal Access Token (classic) with "repo" scope
//
// OPTIONAL ENV VARS (overrides the hardcoded defaults):
//   GITHUB_OWNER   — defaults to "nexusluma365"
//   GITHUB_REPO    — defaults to "NaphtaliBryant"
//   GITHUB_BRANCH  — defaults to "main"
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const GITHUB_API_BASE = "https://api.github.com";

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether a file at the given path already exists in the repo.
 * Returns the file's SHA string if it exists, or null if it doesn't.
 *
 * The SHA is a unique identifier GitHub assigns to every version of a file.
 * You need it when UPDATING a file (not creating). For our duplicate-detection
 * use case, we only need to know if it's non-null (= file exists).
 *
 * @param {string} filePath - e.g. "content/posts/my-post.md"
 * @returns {Promise<string|null>} SHA string, or null if file doesn't exist
 * @throws {Error} if the GitHub API returns an unexpected error
 */
async function getFileSha(filePath) {
  const { owner, repo, branch, token } = getConfig();

  const url =
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  console.log(`[githubApi] Checking existence: ${url}`);

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  });

  // 404 is the expected response when the file doesn't exist — that's not an error.
  if (response.status === 404) {
    console.log(`[githubApi] File not found (404) — this is a new post, proceeding.`);
    return null;
  }

  // Any other non-2xx status is a real problem.
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GitHub API error during file check.\n` +
      `  Status: ${response.status}\n` +
      `  Path: ${filePath}\n` +
      `  Response: ${errorBody}`
    );
  }

  const data = await response.json();
  console.log(`[githubApi] File exists — SHA: ${data.sha}`);
  return data.sha; // e.g. "abc123def456..."
}

/**
 * Creates a new markdown file in the GitHub repo by committing it directly.
 *
 * This is a single PUT call to the GitHub Contents API.
 * GitHub requires the file content to be base64-encoded.
 * When this commit lands on your watched branch, Netlify auto-deploys.
 *
 * @param {string}      filePath       - Relative repo path, e.g. "content/posts/my-post.md"
 * @param {string}      markdownContent - Full file content (frontmatter + body)
 * @param {string}      commitMessage  - Git commit message
 * @param {string|null} existingSha    - Pass existing SHA to update; null to create new file
 *
 * @returns {Promise<Object>} GitHub API response (contains commit SHA, file URL, etc.)
 * @throws  {Error}          if the GitHub API returns a non-2xx response
 */
async function commitMarkdownFile(filePath, markdownContent, commitMessage, existingSha) {
  const { owner, repo, branch, token } = getConfig();

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`;

  // GitHub requires the content to be base64-encoded
  const contentBase64 = Buffer.from(markdownContent, "utf-8").toString("base64");

  // Build the request body
  const body = {
    message: commitMessage,
    content: contentBase64,
    branch:  branch,
  };

  // When updating an existing file, GitHub requires the current file's SHA.
  // For a brand-new file (our main use case), we omit sha entirely.
  if (existingSha) {
    body.sha = existingSha;
    console.log(`[githubApi] Updating existing file (SHA: ${existingSha})`);
  } else {
    console.log(`[githubApi] Creating new file`);
  }

  console.log(`[githubApi] Committing to: ${owner}/${repo}/${filePath} (branch: ${branch})`);
  console.log(`[githubApi] Commit message: "${commitMessage}"`);

  const response = await fetch(url, {
    method:  "PUT",  // GitHub uses PUT for both create and update
    headers: {
      ...buildHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `GitHub API error during file commit.\n` +
      `  Status: ${response.status}\n` +
      `  Path: ${filePath}\n` +
      `  Response: ${errorBody}\n` +
      `  Hint: Check that GITHUB_TOKEN has the "repo" scope and the branch "${branch}" exists.`
    );
  }

  const result = await response.json();
  console.log(`[githubApi] ✓ Committed successfully. Commit SHA: ${result.commit?.sha}`);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads and validates GitHub configuration from environment variables.
 * Uses your hardcoded project defaults if the env vars aren't set.
 *
 * @returns {{ owner: string, repo: string, branch: string, token: string }}
 * @throws {Error} if GITHUB_TOKEN is missing
 */
function getConfig() {
  const token  = process.env.GITHUB_TOKEN;
  const owner  = process.env.GITHUB_OWNER  || "nexusluma365";
  const repo   = process.env.GITHUB_REPO   || "NaphtaliBryant";
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is not set.\n" +
      "Go to Netlify → Site settings → Environment variables and add it.\n" +
      "Generate a token at: https://github.com/settings/tokens (needs 'repo' scope)"
    );
  }

  return { token, owner, repo, branch };
}

/**
 * Returns the standard headers needed for every GitHub API request.
 *
 * @param {string} token - GitHub Personal Access Token
 * @returns {Object}
 */
function buildHeaders(token) {
  return {
    "Authorization":        `Bearer ${token}`,
    "Accept":               "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent":           "marblism-bridge/1.0",
  };
}

module.exports = { getFileSha, commitMarkdownFile };
