// ─────────────────────────────────────────────────────────────────────────────
// utils/normalizePayload.js
//
// Intelligently maps any incoming payload shape into the canonical post
// structure the bridge needs, regardless of what field names Marblism uses.
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────────
//   Marblism's exact API output isn't confirmed yet. Different AI writing
//   platforms, CMS tools, and webhook senders use wildly different field names
//   for the same concepts:
//     • Body content:  "body", "content", "html", "text", "post_body", ...
//     • Cover image:   "image", "cover_image", "thumbnail", "hero", "featured_image", ...
//     • Draft status:  "draft", "is_draft", "status", "published", "visibility", ...
//
//   This file centralises ALL of that mapping logic in one place so:
//     1. The main function stays clean and readable
//     2. You can update field mappings without touching any other file
//     3. Every mapping decision is documented and explained
//
// ── HOW TO CHANGE FIELD MAPPINGS ─────────────────────────────────────────────
//   Each field has a FIELD_ALIASES entry in the FIELD_MAP below.
//   To add a new alias for any field, just add the key to its aliases array.
//
//   Example: if you discover Marblism sends "post_body" for the body, add it:
//     body: {
//       aliases: ["body", "content", "post_body", ...],  ← add here
//       ...
//     }
//
// ── OUTPUT STRUCTURE ──────────────────────────────────────────────────────────
//   {
//     title:       string  (required — at least 2 characters)
//     body:        string  (required — at least 10 characters)
//     excerpt:     string  (optional, defaults to "")
//     author:      string  (optional, defaults to DEFAULT_AUTHOR env or "Naphtali Bryant")
//     category:    string  (optional, defaults to "")
//     image:       string  (optional, defaults to "")
//     tags:        string[] (optional, defaults to [])
//     draft:       boolean (optional, defaults to DRAFT_BY_DEFAULT env or false)
//     publishDate: string  (optional, defaults to "" → today in buildMarkdown)
//   }
//
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// FIELD MAP
//
// This is the single source of truth for payload mapping.
//
// Each entry defines:
//   aliases   — all known key names for this field, in priority order
//               (first match wins; add new aliases here)
//   required  — whether the field must be present and non-empty
//   type      — the expected output type: "string" | "boolean" | "tags" | "date"
//   minLength — minimum string length (strings only, ignored for others)
//   default   — value used when the field is absent (null = use runtime default)
//   label     — human-readable name for error messages
// ─────────────────────────────────────────────────────────────────────────────

const FIELD_MAP = {

  // ── title ─────────────────────────────────────────────────────────────────
  title: {
    aliases:   ["title", "post_title", "heading", "name", "subject", "headline"],
    required:  true,
    type:      "string",
    minLength: 2,
    default:   null,
    label:     "Post title",
  },

  // ── body ──────────────────────────────────────────────────────────────────
  body: {
    aliases: [
      "body",
      "content",
      "post_content",
      "post_body",
      "html",           // if Marblism sends HTML rather than markdown
      "markdown",
      "text",
      "article",
      "copy",
    ],
    required:  true,
    type:      "string",
    minLength: 10,
    default:   null,
    label:     "Post body / content",
  },

  // ── excerpt ───────────────────────────────────────────────────────────────
  excerpt: {
    aliases: [
      "excerpt",
      "summary",
      "description",
      "meta_description",
      "short_description",
      "intro",
      "lead",
      "blurb",
      "teaser",
      "subtitle",
    ],
    required:  false,
    type:      "string",
    minLength: 0,
    default:   "",
    label:     "Excerpt / summary",
  },

  // ── author ────────────────────────────────────────────────────────────────
  author: {
    aliases: [
      "author",
      "author_name",
      "byline",
      "writer",
      "created_by",
      "posted_by",
    ],
    required:  false,
    type:      "string",
    minLength: 0,
    default:   null,   // runtime default: DEFAULT_AUTHOR env var or "Naphtali Bryant"
    label:     "Author",
  },

  // ── category ──────────────────────────────────────────────────────────────
  category: {
    aliases: [
      "category",
      "topic",
      "section",
      "vertical",
      "niche",
      "type",
      "post_category",
      "content_type",
    ],
    required:  false,
    type:      "string",
    minLength: 0,
    default:   "",
    label:     "Category",
  },

  // ── image ─────────────────────────────────────────────────────────────────
  image: {
    aliases: [
      "image",
      "cover_image",
      "featured_image",
      "hero_image",
      "hero",
      "thumbnail",
      "banner",
      "og_image",
      "social_image",
      "picture",
      "photo",
      "image_url",
      "imageUrl",
      "coverImage",
      "featuredImage",
    ],
    required:  false,
    type:      "string",
    minLength: 0,
    default:   "",
    label:     "Cover image",
  },

  // ── tags ──────────────────────────────────────────────────────────────────
  tags: {
    aliases: [
      "tags",
      "tag_list",
      "labels",
      "keywords",
      "topics",
      "categories",   // some platforms conflate tags and categories
    ],
    required:  false,
    type:      "tags",   // special handling — see coerceTags()
    default:   [],
    label:     "Tags",
  },

  // ── draft ─────────────────────────────────────────────────────────────────
  draft: {
    aliases: [
      "draft",
      "is_draft",
      "isDraft",
      // Some platforms use "status" with string values like "draft" or "published"
      // Those are handled separately in coerceDraft() below
    ],
    required:  false,
    type:      "draft",   // special handling — see coerceDraft()
    default:   null,      // runtime default: DRAFT_BY_DEFAULT env var or false
    label:     "Draft mode",
  },

  // ── publishDate ───────────────────────────────────────────────────────────
  publishDate: {
    aliases: [
      "publishDate",
      "publish_date",
      "published_at",
      "date",
      "post_date",
      "scheduled_for",
      "schedule_date",
      "go_live",
      "go_live_date",
      "publicationDate",
    ],
    required:  false,
    type:      "date",
    default:   "",
    label:     "Publish date",
  },

};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises an arbitrary incoming payload into the canonical post structure.
 *
 * @param {object} raw       - The raw parsed JSON from the request body
 * @param {object} [logger]  - Optional logger (from createLogger) for debug output
 *
 * @returns {{ post: object, warnings: string[] }}
 *   post      — The normalised post object (all canonical fields present)
 *   warnings  — Non-fatal issues (e.g. unknown fields, ignored values)
 *
 * @throws {{ type: "VALIDATION_ERROR", errors: string[], fieldErrors: object }}
 *   Thrown when required fields are missing or values are unacceptable.
 *   The errors array contains human-readable messages.
 *   fieldErrors maps field names to their specific problems.
 */
function normalizePayload(raw, logger) {

  // ── Guard: raw must be a plain object ─────────────────────────────────────
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throwValidationError(
      ["Payload must be a JSON object, not " + (Array.isArray(raw) ? "an array" : typeof raw)],
      {}
    );
  }

  const post        = {};
  const errors      = [];   // fatal — will throw
  const warnings    = [];   // non-fatal — returned alongside the post
  const fieldErrors = {};   // maps field name → error message

  // ── Detect unknown fields ─────────────────────────────────────────────────
  // Build a set of every alias we know about so we can flag unknown keys.
  const allKnownAliases = new Set(
    Object.values(FIELD_MAP).flatMap((f) => f.aliases)
  );

  for (const key of Object.keys(raw)) {
    if (!allKnownAliases.has(key)) {
      warnings.push(
        `Unknown field "${key}" was ignored. ` +
        `If Marblism uses this key for important data, add it to the aliases ` +
        `in normalizePayload.js → FIELD_MAP.`
      );
      if (logger) logger.warn(`Unknown field ignored: "${key}"`);
    }
  }

  // ── Map and validate each canonical field ─────────────────────────────────
  for (const [canonicalKey, fieldDef] of Object.entries(FIELD_MAP)) {

    // Find the first alias key that exists in the raw payload
    const { foundKey, rawValue } = findFirstAlias(raw, fieldDef.aliases);

    if (logger && foundKey) {
      logger.info(
        `Field mapping: "${canonicalKey}" ← raw["${foundKey}"]` +
        (foundKey === canonicalKey ? "" : ` (alias)`)
      );
    }

    // ── Coerce the value to the correct type ──────────────────────────────
    let coerced;
    let coercionError = null;

    try {
      coerced = coerceValue(canonicalKey, fieldDef, rawValue);
    } catch (err) {
      coercionError = err.message;
    }

    // ── Apply runtime defaults for fields with null default ───────────────
    if (coerced === undefined || coerced === null || coerced === "") {
      const runtimeDefault = getRuntimeDefault(canonicalKey, fieldDef);
      coerced = runtimeDefault;
    }

    // ── Validate required fields ──────────────────────────────────────────
    if (fieldDef.required) {
      const isEmpty =
        coerced === null || coerced === undefined ||
        (typeof coerced === "string" && coerced.trim().length < (fieldDef.minLength || 1));

      if (isEmpty || coercionError) {
        const tried = fieldDef.aliases.slice(0, 5).map((a) => `"${a}"`).join(", ");
        const errMsg = coercionError
          ? `${fieldDef.label}: ${coercionError}`
          : `${fieldDef.label} is required but was not found or is empty. ` +
            `Looked for: ${tried}${fieldDef.aliases.length > 5 ? ", ..." : ""}.`;

        errors.push(errMsg);
        fieldErrors[canonicalKey] = errMsg;

        if (logger) logger.error(`Validation failed — ${canonicalKey}`, { error: errMsg });
        continue; // skip assigning — leave undefined
      }
    } else if (coercionError && rawValue !== undefined) {
      // Non-required field had a value that couldn't be coerced — warn and use default
      const warnMsg = `${fieldDef.label} value could not be parsed (${coercionError}). ` +
                      `Using default instead.`;
      warnings.push(warnMsg);
      if (logger) logger.warn(warnMsg);
    }

    post[canonicalKey] = coerced;
  }

  // ── Throw if any required fields failed ───────────────────────────────────
  if (errors.length > 0) {
    throwValidationError(errors, fieldErrors);
  }

  // ── Secondary validation: minimum body quality ────────────────────────────
  if (post.body && post.body.trim().length < 10) {
    const err = `Post body is too short (${post.body.trim().length} characters). ` +
                `Minimum is 10 characters.`;
    throwValidationError([err], { body: err });
  }

  // ── Detect "status" field as a fallback for draft ─────────────────────────
  // Some platforms send { "status": "draft" } or { "status": "published" }
  // instead of a boolean draft field. Handle it here if draft wasn't already resolved.
  if (raw.status !== undefined && post.draft === false) {
    const statusResolved = resolveStatusField(raw.status);
    if (statusResolved !== null) {
      post.draft = statusResolved;
      warnings.push(
        `Draft mode was resolved from the "status" field (value: "${raw.status}"). ` +
        `Prefer sending an explicit "draft": true/false field.`
      );
      if (logger) logger.warn(`Draft resolved from "status" field: ${raw.status} → draft: ${statusResolved}`);
    }
  }

  return { post, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Coercion functions — convert raw values to clean typed values
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Routes a raw value through the appropriate coercion function based on field type.
 * Returns undefined when the raw value is absent (not in the payload at all).
 *
 * @param {string} key         - Canonical field name
 * @param {object} fieldDef    - The FIELD_MAP entry
 * @param {*}      rawValue    - The raw value found (undefined if not in payload)
 * @returns {*}
 */
function coerceValue(key, fieldDef, rawValue) {
  if (rawValue === undefined) return undefined;

  switch (fieldDef.type) {
    case "string": return coerceString(rawValue, fieldDef.minLength);
    case "tags":   return coerceTags(rawValue);
    case "draft":  return coerceDraft(rawValue);
    case "date":   return coerceDate(rawValue);
    default:       return coerceString(rawValue, 0);
  }
}

/**
 * Coerces a value to a trimmed string.
 * Accepts strings, numbers, and booleans. Rejects objects and arrays.
 *
 * @param {*}      value
 * @param {number} minLength
 * @returns {string}
 */
function coerceString(value, minLength = 0) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    throw new Error(
      `Expected a string but got ${Array.isArray(value) ? "an array" : "an object"}. ` +
      `This field should be a plain text value.`
    );
  }

  const str = String(value).trim();

  if (minLength > 0 && str.length > 0 && str.length < minLength) {
    throw new Error(
      `Value is too short (${str.length} characters, minimum ${minLength}).`
    );
  }

  return str;
}

/**
 * Coerces tags from any format to a clean string[].
 *
 * Accepts:
 *   ["marketing", "ai"]             → array (standard)
 *   "marketing, ai, seo"            → comma-separated string
 *   "marketing|ai|seo"              → pipe-separated string
 *   "marketing ai seo"              → space-separated (if no commas/pipes)
 *   [{ name: "ai" }, { name: "ml" }] → array of objects with a name key
 *
 * @param {*} value
 * @returns {string[]}
 */
function coerceTags(value) {
  if (!value) return [];

  let items = [];

  if (typeof value === "string") {
    // Split on comma, pipe, or semicolon
    if (value.includes(","))      items = value.split(",");
    else if (value.includes("|")) items = value.split("|");
    else if (value.includes(";")) items = value.split(";");
    else                          items = value.split(/\s+/);   // space-separated fallback

  } else if (Array.isArray(value)) {
    items = value.map((item) => {
      // Support array of objects like [{ name: "ai" }, { id: 1, label: "ml" }]
      if (item && typeof item === "object") {
        return item.name || item.label || item.title || item.value || String(item);
      }
      return String(item);
    });

  } else {
    return []; // unknown type — return empty rather than throwing
  }

  return items
    .map((t) =>
      String(t)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-\s]/g, "")   // keep letters, digits, hyphens, spaces
        .replace(/\s+/g, "-")            // spaces → hyphens
        .replace(/-+/g, "-")             // collapse hyphens
        .replace(/^-+|-+$/g, "")        // strip leading/trailing hyphens
    )
    .filter((t) => t.length > 0 && t.length <= 80);
}

/**
 * Coerces a value to a boolean draft flag.
 *
 * Accepts:
 *   true / false                   → exact boolean
 *   "true" / "false"               → string booleans
 *   1 / 0                          → numeric booleans
 *   "yes" / "no"                   → natural language
 *   "draft" / "published"          → platform-specific status strings
 *   "unpublished" / "live"         → more status strings
 *
 * @param {*} value
 * @returns {boolean}
 */
function coerceDraft(value) {
  if (value === null || value === undefined) return undefined;

  const TRUTHY  = new Set(["true", "1", "yes", "on", "draft", "unpublished", "pending"]);
  const FALSY   = new Set(["false", "0", "no", "off", "published", "live", "public"]);

  if (typeof value === "boolean") return value;
  if (typeof value === "number")  return value !== 0;

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (TRUTHY.has(normalized)) return true;
    if (FALSY.has(normalized))  return false;

    throw new Error(
      `Cannot determine draft status from value "${value}". ` +
      `Use true/false, "draft"/"published", or "yes"/"no".`
    );
  }

  return undefined;
}

/**
 * Coerces a value to a YYYY-MM-DD date string.
 * Returns "" if the value is empty or unparseable (buildMarkdown will use today).
 *
 * Accepts:
 *   "2026-04-08"               → ISO date string
 *   "2026-04-08T12:00:00Z"     → ISO timestamp
 *   "April 8, 2026"            → human-readable date (best-effort)
 *   1744070400                 → Unix timestamp (seconds)
 *   1744070400000              → Unix timestamp (milliseconds)
 *
 * @param {*} value
 * @returns {string}  YYYY-MM-DD or ""
 */
function coerceDate(value) {
  if (value === null || value === undefined || value === "") return "";

  try {
    let date;

    if (typeof value === "number") {
      // Distinguish seconds from milliseconds (Unix timestamps < 1e10 are in seconds)
      date = new Date(value < 1e10 ? value * 1000 : value);
    } else {
      date = new Date(String(value).trim());
    }

    if (isNaN(date.getTime())) return ""; // unparseable — fall back to today
    return date.toISOString().slice(0, 10); // "2026-04-08"
  } catch {
    return "";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scans a raw payload object for the first alias that exists in the payload.
 * Returns both the key that was found and its value.
 *
 * @param {object}   raw
 * @param {string[]} aliases - Priority-ordered list of key names to try
 * @returns {{ foundKey: string|null, rawValue: * }}
 */
function findFirstAlias(raw, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(raw, alias)) {
      return { foundKey: alias, rawValue: raw[alias] };
    }
  }
  return { foundKey: null, rawValue: undefined };
}

/**
 * Returns the runtime default value for a field.
 * For some fields, the default depends on environment variables.
 *
 * @param {string} canonicalKey
 * @param {object} fieldDef
 * @returns {*}
 */
function getRuntimeDefault(canonicalKey, fieldDef) {
  if (canonicalKey === "author") {
    return process.env.DEFAULT_AUTHOR || "Naphtali Bryant";
  }
  if (canonicalKey === "draft") {
    return process.env.DRAFT_BY_DEFAULT === "true";
  }
  return fieldDef.default;
}

/**
 * Resolves a "status" field string value into a draft boolean.
 * Returns null if the status value is unrecognised (so the caller can ignore it).
 *
 * @param {*} status
 * @returns {boolean|null}
 */
function resolveStatusField(status) {
  const DRAFT_STATUSES     = new Set(["draft", "pending", "unpublished", "private", "review"]);
  const PUBLISHED_STATUSES = new Set(["published", "live", "public", "active"]);

  const normalized = String(status).toLowerCase().trim();
  if (DRAFT_STATUSES.has(normalized))     return true;
  if (PUBLISHED_STATUSES.has(normalized)) return false;
  return null;
}

/**
 * Throws a structured validation error object.
 * The main function catches this and returns a 400 response.
 *
 * @param {string[]} errors
 * @param {object}   fieldErrors
 */
function throwValidationError(errors, fieldErrors) {
  const err = new Error("Payload validation failed");
  err.type        = "VALIDATION_ERROR";
  err.errors      = errors;
  err.fieldErrors = fieldErrors;
  throw err;
}

// ─────────────────────────────────────────────────────────────────────────────
// Diagnostics: describe what the normalizer is looking for
// Useful for generating documentation or debugging unknown payloads.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a plain-English description of every field and its accepted aliases.
 * Call this to understand what the normalizer expects.
 *
 * @returns {object[]}
 */
function describeExpectedFields() {
  return Object.entries(FIELD_MAP).map(([key, def]) => ({
    field:     key,
    required:  def.required,
    type:      def.type,
    aliases:   def.aliases,
    label:     def.label,
    default:   def.default,
  }));
}

module.exports = { normalizePayload, describeExpectedFields };
