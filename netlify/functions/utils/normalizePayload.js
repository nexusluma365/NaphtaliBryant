"use strict";

const FIELD_MAP = {
  title: {
    aliases: ["title", "post_title", "heading", "name", "subject", "headline"],
    required: true,
    type: "string",
    minLength: 2,
    default: null,
    label: "Post title",
  },
  body: {
    aliases: ["body", "content", "post_content", "post_body", "html", "markdown", "text", "article", "copy"],
    required: true,
    type: "string",
    minLength: 10,
    default: null,
    label: "Post body / content",
  },
  excerpt: {
    aliases: ["excerpt", "summary", "description", "meta_description", "short_description", "intro", "lead", "blurb", "teaser", "subtitle"],
    required: false,
    type: "string",
    minLength: 0,
    default: "",
    label: "Excerpt / summary",
  },
  author: {
    aliases: ["author", "author_name", "byline", "writer", "created_by", "posted_by"],
    required: false,
    type: "string",
    minLength: 0,
    default: null,
    label: "Author",
  },
  category: {
    aliases: ["category", "topic", "section", "vertical", "niche", "type", "post_category", "content_type"],
    required: false,
    type: "string",
    minLength: 0,
    default: "",
    label: "Category",
  },
  image: {
    aliases: ["image", "cover_image", "featured_image", "hero_image", "hero", "thumbnail", "banner", "og_image", "social_image", "picture", "photo", "image_url", "imageUrl", "coverImage", "featuredImage"],
    required: false,
    type: "string",
    minLength: 0,
    default: "",
    label: "Cover image",
  },
  tags: {
    aliases: ["tags", "tag_list", "labels", "keywords", "topics", "categories"],
    required: false,
    type: "tags",
    default: [],
    label: "Tags",
  },
  draft: {
    aliases: ["draft", "is_draft", "isDraft"],
    required: false,
    type: "draft",
    default: null,
    label: "Draft mode",
  },
  publishDate: {
    aliases: ["publishDate", "publish_date", "published_at", "date", "post_date", "scheduled_for", "schedule_date", "go_live", "go_live_date", "publicationDate"],
    required: false,
    type: "date",
    default: "",
    label: "Publish date",
  },
};

function normalizePayload(raw, logger) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throwValidationError(
      ["Payload must be a JSON object, not " + (Array.isArray(raw) ? "an array" : typeof raw)],
      {}
    );
  }

  const post = {};
  const errors = [];
  const warnings = [];
  const fieldErrors = {};

  const allKnownAliases = new Set(Object.values(FIELD_MAP).flatMap((field) => field.aliases));

  for (const key of Object.keys(raw)) {
    if (!allKnownAliases.has(key)) {
      warnings.push(`Unknown field "${key}" was ignored. If Marblism uses this key for important data, add it to FIELD_MAP in normalizePayload.js.`);
      if (logger) logger.warn(`Unknown field ignored: "${key}"`);
    }
  }

  for (const [canonicalKey, fieldDef] of Object.entries(FIELD_MAP)) {
    const { foundKey, rawValue } = findFirstAlias(raw, fieldDef.aliases);

    if (logger && foundKey) {
      logger.info(
        `Field mapping: "${canonicalKey}" <- raw["${foundKey}"]` +
        (foundKey === canonicalKey ? "" : " (alias)")
      );
    }

    let coerced;
    let coercionError = null;

    try {
      coerced = coerceValue(canonicalKey, fieldDef, rawValue);
    } catch (err) {
      coercionError = err.message;
    }

    if (coerced === undefined || coerced === null || coerced === "") {
      coerced = getRuntimeDefault(canonicalKey, fieldDef);
    }

    if (fieldDef.required) {
      const isEmpty =
        coerced === null || coerced === undefined ||
        (typeof coerced === "string" && coerced.trim().length < (fieldDef.minLength || 1));

      if (isEmpty || coercionError) {
        const tried = fieldDef.aliases.slice(0, 5).map((alias) => `"${alias}"`).join(", ");
        const errMsg = coercionError
          ? `${fieldDef.label}: ${coercionError}`
          : `${fieldDef.label} is required but was not found or is empty. Looked for: ${tried}${fieldDef.aliases.length > 5 ? ", ..." : ""}.`;

        errors.push(errMsg);
        fieldErrors[canonicalKey] = errMsg;

        if (logger) logger.error(`Validation failed - ${canonicalKey}`, { error: errMsg });
        continue;
      }
    } else if (coercionError && rawValue !== undefined) {
      const warnMsg = `${fieldDef.label} value could not be parsed (${coercionError}). Using default instead.`;
      warnings.push(warnMsg);
      if (logger) logger.warn(warnMsg);
    }

    post[canonicalKey] = coerced;
  }

  if (errors.length > 0) {
    throwValidationError(errors, fieldErrors);
  }

  if (post.body && post.body.trim().length < 10) {
    const err = `Post body is too short (${post.body.trim().length} characters). Minimum is 10 characters.`;
    throwValidationError([err], { body: err });
  }

  if (raw.status !== undefined && post.draft === false) {
    const statusResolved = resolveStatusField(raw.status);
    if (statusResolved !== null) {
      post.draft = statusResolved;
      warnings.push(`Draft mode was resolved from the status field (value: "${raw.status}"). Prefer sending an explicit draft: true/false field.`);
      if (logger) logger.warn(`Draft resolved from status field: ${raw.status} -> draft: ${statusResolved}`);
    }
  }

  return { post, warnings };
}

function coerceValue(key, fieldDef, rawValue) {
  if (rawValue === undefined) return undefined;

  switch (fieldDef.type) {
    case "string":
      return coerceString(rawValue, fieldDef.minLength);
    case "tags":
      return coerceTags(rawValue);
    case "draft":
      return coerceDraft(rawValue);
    case "date":
      return coerceDate(rawValue);
    default:
      return coerceString(rawValue, 0);
  }
}

function coerceString(value, minLength = 0) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    throw new Error(`Expected a string but got ${Array.isArray(value) ? "an array" : "an object"}.`);
  }

  const str = String(value).trim();

  if (minLength > 0 && str.length > 0 && str.length < minLength) {
    throw new Error(`Value is too short (${str.length} characters, minimum ${minLength}).`);
  }

  return str;
}

function coerceTags(value) {
  if (!value) return [];

  let items = [];

  if (typeof value === "string") {
    if (value.includes(",")) items = value.split(",");
    else if (value.includes("|")) items = value.split("|");
    else if (value.includes(";")) items = value.split(";");
    else items = value.split(/\s+/);
  } else if (Array.isArray(value)) {
    items = value.map((item) => {
      if (item && typeof item === "object") {
        return item.name || item.label || item.title || item.value || String(item);
      }
      return String(item);
    });
  } else {
    return [];
  }

  return items
    .map((tag) =>
      String(tag)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-\s]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
    )
    .filter((tag) => tag.length > 0 && tag.length <= 80);
}

function coerceDraft(value) {
  if (value === null || value === undefined) return undefined;

  const truthy = new Set(["true", "1", "yes", "on", "draft", "unpublished", "pending"]);
  const falsy = new Set(["false", "0", "no", "off", "published", "live", "public"]);

  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (truthy.has(normalized)) return true;
    if (falsy.has(normalized)) return false;

    throw new Error(`Cannot determine draft status from value "${value}".`);
  }

  return undefined;
}

function coerceDate(value) {
  if (value === null || value === undefined || value === "") return "";

  try {
    let date;
    if (typeof value === "number") {
      date = new Date(value < 1e10 ? value * 1000 : value);
    } else {
      date = new Date(String(value).trim());
    }

    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function findFirstAlias(raw, aliases) {
  for (const alias of aliases) {
    if (Object.prototype.hasOwnProperty.call(raw, alias)) {
      return { foundKey: alias, rawValue: raw[alias] };
    }
  }
  return { foundKey: null, rawValue: undefined };
}

function getRuntimeDefault(canonicalKey, fieldDef) {
  if (canonicalKey === "author") {
    return process.env.DEFAULT_AUTHOR || "Naphtali Bryant";
  }
  if (canonicalKey === "draft") {
    return process.env.DRAFT_BY_DEFAULT === "true";
  }
  return fieldDef.default;
}

function resolveStatusField(status) {
  const draftStatuses = new Set(["draft", "pending", "unpublished", "private", "review"]);
  const publishedStatuses = new Set(["published", "live", "public", "active"]);
  const normalized = String(status).toLowerCase().trim();

  if (draftStatuses.has(normalized)) return true;
  if (publishedStatuses.has(normalized)) return false;
  return null;
}

function throwValidationError(errors, fieldErrors) {
  const err = new Error("Payload validation failed");
  err.type = "VALIDATION_ERROR";
  err.errors = errors;
  err.fieldErrors = fieldErrors;
  throw err;
}

function describeExpectedFields() {
  return Object.entries(FIELD_MAP).map(([key, def]) => ({
    field: key,
    required: def.required,
    type: def.type,
    aliases: def.aliases,
    label: def.label,
    default: def.default,
  }));
}

module.exports = { normalizePayload, describeExpectedFields };
