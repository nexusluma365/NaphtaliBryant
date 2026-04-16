"use strict";

const GITHUB_API_BASE = "https://api.github.com";

async function getFileSha(filePath) {
  const { owner, repo, branch, token } = getConfig();
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

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
  return data.sha;
}

async function commitMarkdownFile(filePath, markdownContent, commitMessage, existingSha) {
  const { owner, repo, branch, token } = getConfig();
  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${filePath}`;
  const contentBase64 = Buffer.from(markdownContent, "utf-8").toString("base64");

  const body = {
    message: commitMessage,
    content: contentBase64,
    branch,
  };

  if (existingSha) {
    body.sha = existingSha;
  }

  const response = await fetch(url, {
    method: "PUT",
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
      `  Hint: Check that GITHUB_TOKEN has the repo scope and the branch "${branch}" exists.`
    );
  }

  return response.json();
}

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "nexusluma365";
  const repo = process.env.GITHUB_REPO || "NaphtaliBryant";
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token) {
    throw new Error(
      "GITHUB_TOKEN environment variable is not set.\n" +
      "Add it in Netlify site settings or a local .env file."
    );
  }

  return { token, owner, repo, branch };
}

function buildHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "marblism-bridge/1.0",
  };
}

module.exports = { getFileSha, commitMarkdownFile };
