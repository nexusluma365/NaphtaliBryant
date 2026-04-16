# Marblism Bridge Integration

This project now includes the fixed Netlify function structure for the Marblism publishing bridge.

## Added structure

```text
netlify/
  functions/
    marblism-bridge.js
    utils/
      buildMarkdown.js
      githubApi.js
      logger.js
      normalizePayload.js
      slugify.js
      validateRequest.js
scripts/
  test-bridge.js
  test-curl.sh
```

## Netlify environment variables

Required:

- `WEBHOOK_SECRET`
- `GITHUB_TOKEN`

Optional:

- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- `DEFAULT_AUTHOR`
- `DRAFT_BY_DEFAULT`
- `LOG_LEVEL`

## Function endpoints

- `/.netlify/functions/marblism-bridge`
- `/api/publish`
