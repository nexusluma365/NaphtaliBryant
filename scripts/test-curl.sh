#!/usr/bin/env bash
<<<<<<< HEAD
# ─────────────────────────────────────────────────────────────────────────────
# scripts/test-curl.sh
#
# Ready-to-run curl commands for testing the Marblism bridge.
# Edit the variables at the top, then run:
#   bash scripts/test-curl.sh
#
# Or copy any individual curl block and run it manually in your terminal.
# ─────────────────────────────────────────────────────────────────────────────

# ── Configuration — edit these ────────────────────────────────────────────────

# Your WEBHOOK_SECRET value (from .env or Netlify env vars)
SECRET="your-webhook-secret-here"

# Your deployed Netlify URL (or localhost for local testing)
# Production:  https://your-site.netlify.app/.netlify/functions/marblism-bridge
# Local:       http://localhost:8888/.netlify/functions/marblism-bridge
ENDPOINT="https://your-site.netlify.app/.netlify/functions/marblism-bridge"

# ─────────────────────────────────────────────────────────────────────────────

divider() {
  echo ""
  echo "─────────────────────────────────────────────────────────────────"
  echo "  $1"
  echo "─────────────────────────────────────────────────────────────────"
}

# ── Test 1: Auto-publish a post ───────────────────────────────────────────────
divider "Test 1: Auto-publish (draft: false)"

=======

SECRET="your-webhook-secret-here"
ENDPOINT="https://your-site.netlify.app/.netlify/functions/marblism-bridge"

>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{
<<<<<<< HEAD
    "title":       "10 Ways AI Is Transforming Content Marketing",
    "body":        "## Introduction\n\nArtificial intelligence is changing the game for content marketers everywhere.\n\n## Section One\n\nSome detail here.",
    "excerpt":     "A deep dive into how AI tools are reshaping the content marketing landscape.",
    "author":      "Naphtali Bryant",
    "category":    "Marketing",
    "image":       "/assets/uploads/ai-marketing.jpg",
    "tags":        ["ai", "marketing", "content"],
    "draft":       false,
    "publishDate": "2026-04-08"
  }' | jq .

# ── Test 2: Save as draft ─────────────────────────────────────────────────────
divider "Test 2: Save as draft (draft: true)"

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{
    "title":       "Draft Post: Behind the Scenes of My Brand Strategy",
    "body":        "## Coming Soon\n\nThis post is still being written.",
    "excerpt":     "A look behind the curtain.",
    "author":      "Naphtali Bryant",
    "category":    "Strategy",
    "tags":        ["strategy", "brand"],
    "draft":       true
  }' | jq .

# ── Test 3: Wrong secret → should return 401 ─────────────────────────────────
divider "Test 3: Wrong secret (expect 401 Unauthorized)"

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer this-is-the-wrong-secret" \
  -d '{"title":"Test","body":"Content"}' | jq .

# ── Test 4: Missing title → should return 400 ─────────────────────────────────
divider "Test 4: Missing title (expect 400 Bad Request)"

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"body":"Content without a title"}' | jq .

# ── Test 5: Wrong method → should return 405 ─────────────────────────────────
divider "Test 5: GET request (expect 405 Method Not Allowed)"

curl -s -X GET "$ENDPOINT" \
  -H "Authorization: Bearer $SECRET" | jq .

echo ""
divider "Done"
echo ""
echo "  If Tests 1 and 2 returned HTTP 200, your bridge is working."
echo "  Check your GitHub repo to see the committed markdown files."
echo "  Check Netlify for an automatic deploy triggered by the commit."
echo ""
=======
    "title": "10 Ways AI Is Transforming Content Marketing",
    "body": "## Introduction\n\nArtificial intelligence is changing the game for content marketers everywhere.",
    "excerpt": "A deep dive into how AI tools are reshaping the content marketing landscape.",
    "author": "Naphtali Bryant",
    "category": "Marketing",
    "image": "/assets/uploads/ai-marketing.jpg",
    "tags": ["ai", "marketing", "content"],
    "draft": false,
    "publishDate": "2026-04-08"
  }'
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
