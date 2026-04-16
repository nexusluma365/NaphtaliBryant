#!/usr/bin/env bash

SECRET="your-webhook-secret-here"
ENDPOINT="https://your-site.netlify.app/.netlify/functions/marblism-bridge"

curl -s -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{
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
