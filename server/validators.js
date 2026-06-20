import { HttpError } from "./http-helpers.js";

export const resourceDefinitions = {
  campaigns: {
    stateKey: "campaigns",
    idPrefix: "campaign",
    requiredFields: ["name", "channel"],
    allowedFields: ["name", "channel", "status", "dates", "startDate", "endDate", "audience", "spend", "conversions", "cpa", "roi", "notes"],
    defaults: {
      status: "Draft",
      dates: "",
      startDate: null,
      endDate: null,
      audience: "General",
      spend: "$0.00",
      conversions: "0",
      cpa: "-",
      roi: "-",
      notes: "",
    },
  },
  content: {
    stateKey: "contentItems",
    idPrefix: "content",
    requiredFields: ["title", "type"],
    allowedFields: [
      "title",
      "type",
      "date",
      "status",
      "stage",
      "owner",
      "channel",
      "campaignId",
      "summary",
      "copy",
      "mediaUrl",
      "visualNotes",
      "copyNotes",
      "scheduledFor",
      "tags",
      "source",
    ],
    defaults: {
      date: null,
      status: "Draft",
      stage: "Ideas",
      owner: "Unassigned",
      channel: "Content Studio",
      campaignId: null,
      summary: "",
      copy: "",
      mediaUrl: null,
      visualNotes: "",
      copyNotes: "",
      scheduledFor: null,
      tags: "",
      source: "manual",
    },
  },
  calendar: {
    stateKey: "calendarEvents",
    idPrefix: "event",
    requiredFields: ["title", "date"],
    allowedFields: ["title", "date", "startTime", "endTime", "status", "channel", "owner", "campaignId", "notes"],
    defaults: {
      startTime: "09:00",
      endTime: "10:00",
      status: "Scheduled",
      channel: "Marketing",
      owner: "Unassigned",
      campaignId: null,
      notes: "",
    },
  },
  "social-posts": {
    stateKey: "socialQueue",
    idPrefix: "social",
    requiredFields: ["title", "channel"],
    allowedFields: ["title", "channel", "status", "publishStatus", "scheduledFor", "owner", "copy", "mediaUrl", "campaignId", "lastPublishError", "publishedAt", "externalPostId"],
    defaults: {
      status: "Queued",
      publishStatus: "Scheduled",
      scheduledFor: null,
      owner: "Unassigned",
      copy: "",
      mediaUrl: null,
      campaignId: null,
      lastPublishError: "",
      publishedAt: null,
      externalPostId: null,
    },
  },
  integrations: {
    stateKey: "integrations",
    idPrefix: "integration",
    requiredFields: ["provider", "name"],
    allowedFields: ["provider", "name", "accountName", "status", "pageId", "permissions", "tokenHealth", "setupMode", "lastSync", "connectedAt"],
    defaults: {
      accountName: "",
      status: "needs_setup",
      pageId: null,
      permissions: "",
      tokenHealth: "missing",
      setupMode: "demo",
      lastSync: null,
      connectedAt: null,
    },
  },
  "publish-logs": {
    stateKey: "publishLogs",
    idPrefix: "publish-log",
    requiredFields: ["postId", "channel", "status"],
    allowedFields: ["postId", "channel", "status", "message", "externalPostId"],
    defaults: {
      message: "",
      externalPostId: null,
    },
  },
  notifications: {
    stateKey: "notifications",
    idPrefix: "notification",
    requiredFields: ["title", "message"],
    allowedFields: ["type", "title", "message", "severity", "status", "relatedId"],
    defaults: {
      type: "system",
      severity: "info",
      status: "unread",
      relatedId: null,
    },
  },
};

export function validateMutation(resourceName, payload, options = {}) {
  const { partial = false } = options;
  const definition = resourceDefinitions[resourceName];

  if (!definition) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Unknown resource.");
  }

  if (!isPlainObject(payload)) {
    throw new HttpError(400, "INVALID_BODY", "Request body must be a JSON object.");
  }

  const forbiddenFields = ["id", "createdAt", "updatedAt"].filter((field) => field in payload);
  if (forbiddenFields.length > 0) {
    throw new HttpError(400, "INVALID_BODY", "Reserved fields cannot be set directly.", { fields: forbiddenFields });
  }

  const unknownFields = Object.keys(payload).filter((field) => !definition.allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new HttpError(400, "INVALID_BODY", "Request body contains unsupported fields.", { fields: unknownFields });
  }

  const sanitized = partial ? {} : { ...definition.defaults };
  for (const [key, value] of Object.entries(payload)) {
    sanitized[key] = typeof value === "string" ? value.trim() : value;
  }

  if (partial && Object.keys(sanitized).length === 0) {
    throw new HttpError(400, "INVALID_BODY", "PATCH requests must include at least one mutable field.");
  }

  for (const field of definition.requiredFields) {
    const value = sanitized[field];
    if (!partial && !hasValue(value)) {
      throw new HttpError(400, "VALIDATION_ERROR", `Field "${field}" is required.`);
    }
  }

  for (const [key, value] of Object.entries(sanitized)) {
    if (value !== null && typeof value !== "string") {
      throw new HttpError(400, "VALIDATION_ERROR", `Field "${key}" must be a string or null.`);
    }
  }

  return sanitized;
}

function hasValue(value) {
  return !(value === undefined || value === null || value === "");
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
