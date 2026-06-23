import { HttpError } from "./http-helpers.js";

export const resourceDefinitions = {
  brands: {
    stateKey: "brands",
    idPrefix: "brand",
    requiredFields: ["name"],
    allowedFields: [
      "name", "shortDescription", "positioning", "targetAudience", "brandVoice",
      "toneMood", "visualStyleNotes", "colors", "defaultCTA", "defaultHashtags",
      "doList", "dontList", "checklistTemplate", "contentPillars",
      "promptStyleNotes", "assetNotes",
    ],
    defaults: {
      shortDescription: "",
      positioning: "",
      targetAudience: "",
      brandVoice: "",
      toneMood: "",
      visualStyleNotes: "",
      colors: "",
      defaultCTA: "",
      defaultHashtags: "",
      doList: "",
      dontList: "",
      checklistTemplate: "",
      contentPillars: "",
      promptStyleNotes: "",
      assetNotes: "",
    },
  },
  channels: {
    stateKey: "channels",
    idPrefix: "channel",
    requiredFields: ["brandId", "platform", "pageName"],
    allowedFields: [
      "brandId", "platform", "pageName", "handle", "url", "connectionStatus",
      "postingRules", "defaultFormat", "defaultHashtags",
      "bestPostingTimeNotes", "ctaNotes",
    ],
    defaults: {
      handle: "",
      url: "",
      connectionStatus: "Chưa kết nối",
      postingRules: "",
      defaultFormat: "",
      defaultHashtags: "",
      bestPostingTimeNotes: "",
      ctaNotes: "",
    },
  },
  campaigns: {
    stateKey: "campaigns",
    idPrefix: "campaign",
    requiredFields: ["brandId", "name"],
    allowedFields: ["brandId", "name", "objective", "keyMessage", "status", "dates", "startDate", "endDate", "notes", "channel", "audience", "spend", "conversions", "cpa", "roi"],
    defaults: {
      objective: "",
      keyMessage: "",
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
    requiredFields: ["brandId", "title", "contentType"],
    allowedFields: [
      "brandId", "channelId", "campaignId", "title", "contentType", "type",
      "copy", "mediaUrl", "visualPromptNotes", "visualNotes", "copyPromptNotes",
      "copyNotes", "status", "scheduledAt", "scheduledFor", "publishedUrl",
      "learningNote", "reusable", "tags", "checklistItems", "date", "stage",
      "owner", "channel", "summary", "source",
    ],
    defaults: {
      brandId: null,
      channelId: null,
      campaignId: null,
      contentType: "Caption",
      copy: "",
      mediaUrl: null,
      visualPromptNotes: "",
      copyPromptNotes: "",
      status: "Brief",
      scheduledAt: null,
      publishedUrl: "",
      learningNote: "",
      reusable: false,
      tags: "",
      checklistItems: [],
      date: null,
      type: "Caption",
      stage: "Brief",
      owner: "Unassigned",
      channel: "",
      summary: "",
      visualNotes: "",
      copyNotes: "",
      scheduledFor: null,
      source: "manual",
    },
    fieldTypes: {
      reusable: ["boolean"],
      checklistItems: ["array"],
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
    requiredFields: ["status"],
    allowedFields: ["postId", "contentId", "channel", "channelId", "status", "message", "note", "externalPostId", "publishedAt", "publishedUrl"],
    defaults: {
      postId: null,
      contentId: null,
      channel: "",
      channelId: null,
      message: "",
      note: "",
      externalPostId: null,
      publishedAt: null,
      publishedUrl: "",
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
    const allowedTypes = definition.fieldTypes?.[key] ?? ["string", "null"];
    const valueType = Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
    if (!allowedTypes.includes(valueType)) {
      throw new HttpError(400, "VALIDATION_ERROR", `Field "${key}" has an invalid type.`);
    }
    if (valueType === "array" && !value.every((item) => typeof item === "string")) {
      throw new HttpError(400, "VALIDATION_ERROR", `Field "${key}" must contain strings only.`);
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
