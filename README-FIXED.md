<<<<<<< HEAD
# Marblism Bridge — Fixed Netlify Structure

This package has been restructured so Netlify can resolve the bridge function and its utility imports correctly.

## Correct structure

```
=======
# Marblism Bridge Integration

This project now includes the fixed Netlify function structure for the Marblism publishing bridge.

## Added structure

```text
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
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
<<<<<<< HEAD
netlify.toml
package.json
.env.example
```

## Main fix applied

Your original `marblism-bridge.js` uses imports like:

```js
require("./utils/normalizePayload")
```

Those files were originally at the project root, which causes module resolution failures in Netlify Functions. They are now placed under:

`netlify/functions/utils/`

## Before deploying

Set these Netlify environment variables:
=======
```

## Netlify environment variables

Required:
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15

- `WEBHOOK_SECRET`
- `GITHUB_TOKEN`

Optional:

- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`
- `DEFAULT_AUTHOR`
- `DRAFT_BY_DEFAULT`
- `LOG_LEVEL`

<<<<<<< HEAD
## Function endpoint

- `/.netlify/functions/marblism-bridge`
- `/api/publish` (via redirect in `netlify.toml`)
=======
## Function endpoints

- `/.netlify/functions/marblism-bridge`
- `/api/publish`
>>>>>>> 6a4f02f89accc29c73e426a28dee055734008c15
