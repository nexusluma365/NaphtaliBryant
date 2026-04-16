// ─────────────────────────────────────────────────────────────────────────────
// scripts/test-bridge.js
//
// Tests the Marblism bridge with multiple payload shapes to verify the
// normaliser handles every real-world format correctly.
//
// HOW TO USE:
//   cp .env.example .env        ← fill in WEBHOOK_SECRET and GITHUB_TOKEN
//   node scripts/test-bridge.js
//
// TESTS RUN:
//   1. Standard shape      — canonical field names (what we'd ideally get)
//   2. Alias shape         — alternate field names (content, post_title, etc.)
//   3. CMS export shape    — field names a CMS might export
//   4. Status string       — "status": "draft" instead of "draft": true
//   5. Tags as string      — "tags": "ai, marketing, seo"
//   6. Unix timestamp date — "publishDate": 1744070400
//   7. Missing title       — should return 400 with clear error
//   8. Empty body          — should return 400 with clear error
//   9. Wrong secret        — should return 401
//  10. Unknown fields      — should succeed with warnings
//
// NOTE: Tests 1-6 and 10 make REAL commits to GitHub (as draft: true).
// Delete those test files from your repo when done.
// Tests 7-9 are rejected before any commit and are safe.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

// ── Load .env ─────────────────────────────────────────────────────────────────
const fs   = require("fs");
const path = require("path");

const envFile = path.join(__dirname, "..", ".env");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split("\n").forEach((line) => {
    const clean = line.trim();
    if (!clean || clean.startsWith("#")) return;
    const eqAt = clean.indexOf("=");
    if (eqAt < 1) return;
    const k = clean.slice(0, eqAt).trim();
    const v = clean.slice(eqAt + 1).trim();
    if (k && !process.env[k]) process.env[k] = v;
  });
  console.log("✓ .env loaded\n");
}

const { handler } = require("../netlify/functions/marblism-bridge");

const SECRET   = process.env.WEBHOOK_SECRET || "";
const GOOD_HDR = { "content-type": "application/json", "authorization": `Bearer ${SECRET}` };
const BAD_HDR  = { "content-type": "application/json", "authorization": "Bearer wrong-secret" };

// ── Test definitions ──────────────────────────────────────────────────────────

const TESTS = [

  // ── 1: Standard canonical shape ─────────────────────────────────────────────
  {
    name:   "Standard canonical field names",
    expect: 200,
    headers: GOOD_HDR,
    payload: {
      title:       `[TEST-1] Standard shape — ${ts()}`,
      body:        testBody("Standard shape test"),
      excerpt:     "Testing the standard canonical payload shape.",
      author:      "Naphtali Bryant",
      category:    "Technology",
      image:       "/assets/uploads/test.jpg",
      tags:        ["test", "standard", "automation"],
      draft:       true,
      publishDate: "2026-04-08",
    },
  },

  // ── 2: Alternate field names (aliases) ────────────────────────────────────
  {
    name:   "Alternate field names (content, post_title, cover_image, ...)",
    expect: 200,
    headers: GOOD_HDR,
    payload: {
      post_title:   `[TEST-2] Alias shape — ${ts()}`,   // alias for title
      content:      testBody("Alias shape test"),        // alias for body
      summary:      "Testing alias field name mapping.", // alias for excerpt
      byline:       "Naphtali Bryant",                   // alias for author
      topic:        "Marketing",                         // alias for category
      cover_image:  "/assets/uploads/cover.jpg",         // alias for image
      tag_list:     ["test", "aliases"],                 // alias for tags
      is_draft:     true,                                // alias for draft
      publish_date: "2026-04-08",                        // alias for publishDate
    },
  },

  // ── 3: CMS export shape ───────────────────────────────────────────────────
  {
    name:   "CMS export shape (heading, html, featured_image, labels, published_at)",
    expect: 200,
    headers: GOOD_HDR,
    payload: {
      heading:        `[TEST-3] CMS export shape — ${ts()}`,
      html:           testBody("CMS export test"),
      description:    "Testing CMS export field name variants.",
      author_name:    "Naphtali Bryant",
      section:        "Insights",
      featured_image: "/assets/uploads/hero.jpg",
      labels:         ["cms", "export", "test"],
      isDraft:        true,
      published_at:   "2026-04-08T09:00:00Z",
    },
  },

  // ── 4: Status string instead of boolean draft ─────────────────────────────
  {
    name:   "Draft as status string ('status': 'draft')",
    expect: 200,
    headers: GOOD_HDR,
    payload: {
      title:   `[TEST-4] Status string draft — ${ts()}`,
      body:    testBody("Status string test"),
      status:  "draft",   // ← "draft" string instead of draft: true
    },
  },

  // ── 5: Tags as comma-separated string ─────────────────────────────────────
  {
    name:   "Tags as comma-separated string",
    expect: 200,
    headers: GOOD_HDR,
    payload: {
      title:  `[TEST-5] Tags as string — ${ts()}`,
      body:   testBody("Tags string test"),
      tags:   "ai, marketing, content strategy",  // ← string, not array
      draft:  true,
    },
  },

  // ── 6: Unix timestamp as publishDate ──────────────────────────────────────
  {
    name:   "Unix timestamp as publishDate",
    expect: 200,
    headers: GOOD_HDR,
    payload: {
      title:       `[TEST-6] Unix timestamp date — ${ts()}`,
      body:        testBody("Unix timestamp date test"),
      draft:       true,
      publishDate: 1744070400,   // ← Unix seconds (2026-04-08)
    },
  },

  // ── 7: Missing title → expect 400 ─────────────────────────────────────────
  {
    name:   "Missing title (expect 400)",
    expect: 400,
    headers: GOOD_HDR,
    payload: {
      body: "This post has content but no title field.",
    },
  },

  // ── 8: Empty body → expect 400 ────────────────────────────────────────────
  {
    name:   "Empty body (expect 400)",
    expect: 400,
    headers: GOOD_HDR,
    payload: {
      title: "A Post With No Body",
      body:  "",
    },
  },

  // ── 9: Wrong webhook secret → expect 401 ─────────────────────────────────
  {
    name:   "Wrong webhook secret (expect 401)",
    expect: 401,
    headers: BAD_HDR,
    payload: {
      title: "Test post",
      body:  "Test content",
    },
  },

  // ── 10: Unknown fields in payload → expect 200 with warnings ──────────────
  {
    name:   "Unknown fields (expect 200 + warnings array)",
    expect: 200,
    headers: GOOD_HDR,
    payload: {
      title:          `[TEST-10] Unknown fields — ${ts()}`,
      body:           testBody("Unknown fields test"),
      draft:          true,
      // These fields are not in FIELD_MAP — they should be ignored with a warning
      marblism_id:    "post_abc123",
      internal_score: 94,
      generated_by:   "marblism-v2",
    },
  },

];

// ─────────────────────────────────────────────────────────────────────────────
// Test runner
// ─────────────────────────────────────────────────────────────────────────────

(async () => {
  divider("Marblism Bridge — Payload Normalisation Tests");

  console.log("Environment:");
  console.log("  WEBHOOK_SECRET set?", SECRET ? "✓ yes" : "✗ NO — tests will fail auth");
  console.log("  GITHUB_TOKEN set?  ", process.env.GITHUB_TOKEN ? "✓ yes" : "✗ NO — commit tests will fail");
  console.log("  GITHUB_OWNER:      ", process.env.GITHUB_OWNER  || "nexusluma365 (default)");
  console.log("  GITHUB_REPO:       ", process.env.GITHUB_REPO   || "NaphtaliBryant (default)");
  console.log("  GITHUB_BRANCH:     ", process.env.GITHUB_BRANCH || "main (default)");
  console.log("");
  console.log(`  ${TESTS.length} tests defined.\n`);
  console.log("  Tests 1–2 and 4–6 and 10 will make real commits (as draft: true).");
  console.log("  Delete those test files from your GitHub repo when done.\n");

  const results = { passed: 0, failed: 0 };

  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i];
    divider(`Test ${i + 1}: ${test.name}`);

    const event = {
      httpMethod: "POST",
      path:       "/.netlify/functions/marblism-bridge",
      headers:    test.headers,
      body:       JSON.stringify(test.payload),
    };

    let result;
    try {
      result = await handler(event);
    } catch (unexpectedErr) {
      console.error(`  ✗ HANDLER THREW (unexpected):`, unexpectedErr.message);
      results.failed++;
      continue;
    }

    const status = result.statusCode;
    const body   = safeParseJson(result.body);

    const passed = status === test.expect;
    const icon   = passed ? "✓" : "✗";

    console.log(`  ${icon} HTTP ${status} (expected ${test.expect})`);

    if (!passed) {
      console.log(`    error:  ${body?.error || "(none)"}`);
      console.log(`    detail: ${body?.detail || "(none)"}`);
      results.failed++;
    } else {
      results.passed++;

      if (status === 200) {
        console.log(`    slug:     ${body.slug}`);
        console.log(`    file:     ${body.filePath}`);
        console.log(`    mode:     ${body.mode}`);
        console.log(`    commit:   ${body.commitSha || "(n/a)"}`);
        if (body.warnings?.length) {
          body.warnings.forEach((w) => console.log(`    ⚠ ${w}`));
        }
      } else {
        // Error case — log what the error response says
        if (body.errors?.length) {
          body.errors.forEach((e) => console.log(`    • ${e}`));
        }
        if (body.hint) console.log(`    hint: ${body.hint}`);
      }
    }
  }

  divider("Results");
  console.log(`  Passed: ${results.passed} / ${TESTS.length}`);
  console.log(`  Failed: ${results.failed} / ${TESTS.length}`);
  if (results.failed === 0) {
    console.log("\n  ✓ All tests passed — your bridge handles every payload shape correctly.");
  } else {
    console.log("\n  Some tests failed — see the output above for details.");
  }
  console.log("");
})();

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}

function testBody(label) {
  return `## ${label}\n\nThis is an automated test post generated by test-bridge.js.\n\nIt was committed as draft: true and will not appear on the live site.\nDelete this file from your GitHub repo when testing is complete.`;
}

function divider(label) {
  const line = "─".repeat(60);
  console.log(`\n${line}`);
  if (label) console.log(`  ${label}`);
  console.log(`${line}`);
}

function safeParseJson(str) {
  try { return JSON.parse(str); } catch { return {}; }
}
