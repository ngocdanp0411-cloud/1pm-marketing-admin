import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { dataFilePath } from "./config.js";
import { publishFacebookPagePost } from "./facebook-publisher.js";
import { HttpError } from "./http-helpers.js";
import { createSeedState } from "./seed-state.js";
import { resourceDefinitions } from "./validators.js";

export class AppStateStore {
  constructor(filePath = dataFilePath) {
    this.filePath = filePath;
    this.state = null;
    this.writeChain = Promise.resolve();
  }

  async init() {
    if (this.state) {
      return;
    }

    await this.ensureStateFile();
    const fileContents = await readFile(this.filePath, "utf8");
    this.state = normalizeState(JSON.parse(fileContents));
  }

  async list(resourceName) {
    const definition = getDefinition(resourceName);
    await this.init();
    return clone(this.state[definition.stateKey]);
  }

  async getById(resourceName, id) {
    const definition = getDefinition(resourceName);
    await this.init();
    const record = this.state[definition.stateKey].find((item) => item.id === id);
    return record ? clone(record) : null;
  }

  async create(resourceName, payload) {
    const definition = getDefinition(resourceName);
    await this.init();

    const now = new Date().toISOString();
    const record = {
      id: `${definition.idPrefix}-${randomUUID()}`,
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    this.state[definition.stateKey].unshift(record);
    await this.persist();
    return clone(record);
  }

  async update(resourceName, id, payload) {
    const definition = getDefinition(resourceName);
    await this.init();

    const index = this.state[definition.stateKey].findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const existing = this.state[definition.stateKey][index];
    const updated = {
      ...existing,
      ...payload,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };

    this.state[definition.stateKey][index] = updated;
    await this.persist();
    return clone(updated);
  }

  async delete(resourceName, id) {
    const definition = getDefinition(resourceName);
    await this.init();
    assertCanDelete(this.state, resourceName, id);

    const index = this.state[definition.stateKey].findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const [deleted] = this.state[definition.stateKey].splice(index, 1);
    await this.persist();
    return clone(deleted);
  }

  async getBootstrap(port) {
    await this.init();

    return {
      workspace: {
        ...clone(this.state.workspace),
        rootPath: process.cwd(),
        apiPort: port,
      },
      currentUser: {
        ...clone(this.state.currentUser),
        username: safeUsername(),
      },
      brands: clone(this.state.brands),
      channels: clone(this.state.channels),
      overviewMetrics: buildOverviewMetrics(this.state),
      campaigns: clone(this.state.campaigns),
      contentItems: clone(this.state.contentItems),
      calendarEvents: clone(this.state.calendarEvents),
      brandAssets: clone(this.state.brandAssets),
      teamMembers: clone(this.state.teamMembers),
      integrations: clone(this.state.integrations),
      publishLogs: clone(this.state.publishLogs),
      notifications: clone(this.state.notifications),
      socialQueue: clone(this.state.socialQueue),
      localListings: clone(this.state.localListings),
    };
  }

  async completeManualPublish(id, payload) {
    await this.init();
    const index = this.state.contentItems.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const status = payload?.status;
    const publishedUrl = typeof payload?.publishedUrl === "string" ? payload.publishedUrl.trim() : "";
    const note = typeof payload?.note === "string" ? payload.note.trim() : "";
    if (!["Published", "Failed"].includes(status)) {
      throw new HttpError(400, "VALIDATION_ERROR", 'Field "status" must be Published or Failed.');
    }
    if (status === "Published" && !publishedUrl) {
      throw new HttpError(400, "VALIDATION_ERROR", "Published URL is required.");
    }

    const now = new Date().toISOString();
    const existing = this.state.contentItems[index];
    const channel = this.state.channels.find((item) => item.id === existing.channelId);
    const updated = {
      ...existing,
      status,
      stage: status,
      publishedUrl: status === "Published" ? publishedUrl : existing.publishedUrl ?? "",
      learningNote: note || existing.learningNote || "",
      updatedAt: now,
    };
    const log = {
      id: `publish-log-${randomUUID()}`,
      postId: null,
      contentId: id,
      channel: channel?.platform ?? existing.channel ?? "",
      channelId: existing.channelId ?? null,
      status: status.toLowerCase(),
      message: note,
      note,
      externalPostId: null,
      publishedAt: now,
      publishedUrl: status === "Published" ? publishedUrl : "",
      createdAt: now,
    };

    this.state.contentItems[index] = updated;
    this.state.publishLogs.unshift(log);
    await this.persist();
    return { content: clone(updated), log: clone(log) };
  }

  async publishSocialPost(id) {
    await this.init();

    const index = this.state.socialQueue.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

    const now = new Date().toISOString();
    const existing = this.state.socialQueue[index];
    if (existing.status === "Published" || existing.publishStatus === "Published") {
      throw new HttpError(409, "INVALID_PUBLISH_TRANSITION", "This social post is already published.");
    }

    const integration = findIntegrationForChannel(this.state.integrations, existing.channel);
    const publishResult = await resolvePublishResult(existing, integration);
    const errorMessage = publishResult.ok ? "" : publishResult.message;
    const nextStatus = publishResult.ok ? "Published" : "Failed";

    const updatedPost = {
      ...existing,
      status: nextStatus,
      publishStatus: nextStatus,
      lastPublishError: errorMessage,
      publishedAt: publishResult.ok ? now : existing.publishedAt ?? null,
      externalPostId: publishResult.externalPostId,
      updatedAt: now,
    };

    const log = {
      id: `publish-log-${randomUUID()}`,
      postId: existing.id,
      channel: existing.channel,
      status: publishResult.ok ? "published" : "failed",
      message: publishResult.message,
      externalPostId: publishResult.externalPostId,
      createdAt: now,
    };

    const notification = {
      id: `notification-${randomUUID()}`,
      type: publishResult.ok ? "publish" : "integration",
      title: publishResult.ok ? "Post published" : `${existing.channel} publish failed`,
      message: publishResult.ok ? `${existing.title} published to ${existing.channel}.` : errorMessage,
      severity: publishResult.ok ? "success" : "warning",
      status: "unread",
      relatedId: existing.id,
      createdAt: now,
    };

    this.state.socialQueue[index] = updatedPost;
    this.state.publishLogs.unshift(log);
    this.state.notifications.unshift(notification);
    await this.persist();

    return {
      post: clone(updatedPost),
      log: clone(log),
      notification: clone(notification),
      integration: integration ? clone(integration) : null,
    };
  }

  async ensureStateFile() {
    const directoryPath = path.dirname(this.filePath);
    await mkdir(directoryPath, { recursive: true });

    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      if (error && error.code === "ENOENT") {
        const seedState = JSON.stringify(createSeedState(), null, 2);
        await writeFile(this.filePath, seedState, "utf8");
        return;
      }

      throw error;
    }
  }

  async persist() {
    const nextSnapshot = JSON.stringify(this.state, null, 2);
    const tempFilePath = `${this.filePath}.tmp`;

    this.writeChain = this.writeChain.then(async () => {
      await writeFile(tempFilePath, nextSnapshot, "utf8");
      await rename(tempFilePath, this.filePath);
    });

    await this.writeChain;
  }
}

async function resolvePublishResult(post, integration) {
  const provider = normalizeProvider(post.channel);
  const canPublish = integration?.status === "connected" && integration?.tokenHealth === "healthy";

  if (!canPublish) {
    return {
      ok: false,
      message: buildPublishError(post.channel, integration),
      externalPostId: null,
    };
  }

  if (provider === "facebook") {
    return publishFacebookPagePost(post, integration);
  }

  return {
    ok: true,
    message: `Demo publish succeeded for ${post.channel}.`,
    externalPostId: `demo-${provider}-${randomUUID().slice(0, 8)}`,
  };
}

function buildOverviewMetrics(state) {
  const today = new Date().toISOString().slice(0, 10);
  const drafts = state.contentItems.filter((item) => ["Brief", "Draft", "Review"].includes(item.status)).length;
  const ready = state.contentItems.filter((item) => item.status === "Ready").length;
  const scheduledToday = state.contentItems.filter((item) => item.status === "Scheduled" && scheduleDate(item) === today).length;
  const overdue = state.contentItems.filter((item) => item.status === "Scheduled" && scheduleDate(item) && scheduleDate(item) < today).length;
  const failed = state.contentItems.filter((item) => item.status === "Failed").length;

  return [
    { key: "drafts", label: "Cần hoàn thiện", value: drafts, context: "Brief, Draft và Review" },
    { key: "ready", label: "Sẵn sàng", value: ready, context: "Có thể lên lịch" },
    { key: "calendar", label: "Đăng hôm nay", value: scheduledToday, context: "Theo lịch nội dung" },
    { key: "overdue", label: "Đã trễ", value: overdue, context: "Cần xử lý ngay" },
    { key: "failed", label: "Đăng lỗi", value: failed, context: "Cần xử lý lại" },
  ];
}

function normalizeState(state) {
  const seedState = createSeedState();
  const nextState = { ...seedState, ...state };

  nextState.brands = normalizeCollection(state.brands, seedState.brands);
  nextState.channels = normalizeCollection(state.channels, seedState.channels);
  nextState.campaigns = normalizeCampaigns(state.campaigns, seedState.campaigns, nextState.brands);
  nextState.contentItems = normalizeContentItems(
    state.contentItems,
    state.socialQueue,
    seedState.contentItems,
    nextState.brands,
    nextState.channels,
  );
  nextState.integrations = normalizeIntegrations(state.integrations, seedState.integrations);
  nextState.publishLogs = Array.isArray(state.publishLogs) ? state.publishLogs : seedState.publishLogs;
  nextState.notifications = normalizeNotifications(state.notifications, seedState.notifications);
  nextState.teamMembers = normalizeTeamMembers(state.teamMembers, seedState.teamMembers);
  nextState.socialQueue = (Array.isArray(state.socialQueue) ? state.socialQueue : seedState.socialQueue).map((post) => ({
    publishStatus: normalizePublishStatus(post.status),
    lastPublishError: "",
    mediaUrl: null,
    publishedAt: null,
    externalPostId: null,
    ...post,
  })).filter((post) => !isDemoSocialPost(post));
  nextState.socialQueue = alignPostsWithPublishLogs(nextState.socialQueue, nextState.publishLogs);

  return nextState;
}

function normalizeTeamMembers(teamMembers, fallback) {
  const demoNames = new Set(["Olivia Morgan", "Liam Carter", "Sophia Bennett", "Noah Williams", "Ava Martinez"]);
  const source = Array.isArray(teamMembers) ? teamMembers : fallback;
  return source.filter((member) => !demoNames.has(member?.name));
}

function normalizeNotifications(notifications, fallback) {
  const demoTitles = new Set(["Reconnect X", "Social approval needed"]);
  const source = Array.isArray(notifications) ? notifications : fallback;
  return source.filter((notification) => !demoTitles.has(notification?.title));
}

function normalizeCollection(collection, fallback) {
  return Array.isArray(collection) && collection.length ? collection : fallback;
}

function normalizeCampaigns(campaigns, fallback, brands) {
  const brandId = brands[0]?.id ?? null;
  return normalizeCollection(campaigns, fallback).map((campaign) => ({
    brandId,
    objective: campaign.notes ?? "",
    keyMessage: "",
    ...campaign,
  }));
}

function normalizeContentItems(contentItems, socialQueue, fallback, brands, channels) {
  const brandId = brands[0]?.id ?? null;
  const source = normalizeCollection(contentItems, fallback);
  const normalized = source
    .filter((item) => !isDemoContentItem(item))
    .map((item) => normalizeContentItem(item, brandId, channels));
  const existingIds = new Set(normalized.map((item) => item.id));
  const legacySocial = Array.isArray(socialQueue)
    ? socialQueue.filter((item) => !existingIds.has(item.id) && !isDemoSocialPost(item)).map((item) => normalizeContentItem({
      ...item,
      contentType: "Caption",
      type: "Caption",
      source: "legacy-social",
    }, brandId, channels))
    : [];
  return [...normalized, ...legacySocial];
}

function isDemoContentItem(item) {
  const demoIds = new Set([
    "content-video-summer",
    "content-email-launch",
    "content-report-trends",
    "content-case-study-acme",
    "content-demo-video",
  ]);
  return demoIds.has(item?.id);
}

function isDemoSocialPost(item) {
  const demoIds = new Set([
    "social-linkedin-report",
    "social-instagram-demo",
    "social-x-launch",
  ]);
  return demoIds.has(item?.id);
}

function normalizeContentItem(item, brandId, channels) {
  const status = normalizeContentStatus(item.status, item.stage);
  const channelId = item.channelId ?? findChannelId(channels, item.channel);
  const scheduledAt = item.scheduledAt ?? item.scheduledFor ?? null;
  return {
    brandId,
    channelId,
    campaignId: null,
    contentType: item.type || "Caption",
    type: item.type || "Caption",
    copy: item.summary ?? "",
    mediaUrl: null,
    visualPromptNotes: item.visualNotes ?? "",
    visualNotes: item.visualNotes ?? "",
    copyPromptNotes: item.copyNotes ?? "",
    copyNotes: item.copyNotes ?? "",
    status,
    stage: status,
    scheduledAt,
    scheduledFor: scheduledAt,
    publishedUrl: "",
    learningNote: "",
    reusable: false,
    tags: "",
    checklistItems: [],
    source: "manual",
    ...item,
    brandId: item.brandId ?? brandId,
    channelId,
    contentType: item.contentType ?? item.type ?? "Caption",
    status,
    stage: status,
    scheduledAt,
    scheduledFor: scheduledAt,
  };
}

function normalizeContentStatus(status, stage) {
  const value = String(status ?? stage ?? "Brief").toLowerCase();
  if (value.includes("fail")) return "Failed";
  if (value.includes("publish")) return "Published";
  if (value.includes("schedule") || value.includes("queue")) return "Scheduled";
  if (value.includes("ready") || value.includes("approve")) return "Ready";
  if (value.includes("review")) return "Review";
  if (value.includes("draft")) return "Draft";
  return "Brief";
}

function findChannelId(channels, legacyChannel) {
  const value = String(legacyChannel ?? "").toLowerCase();
  return channels.find((channel) => value.includes(channel.platform.toLowerCase()))?.id ?? null;
}

function scheduleDate(item) {
  return String(item.scheduledAt ?? item.scheduledFor ?? "").slice(0, 10);
}

function assertCanDelete(state, resourceName, id) {
  if (resourceName === "brands") {
    const referenced = state.channels.some((item) => item.brandId === id)
      || state.campaigns.some((item) => item.brandId === id)
      || state.contentItems.some((item) => item.brandId === id);
    if (referenced) {
      throw new HttpError(409, "RESOURCE_IN_USE", "Brand is still used by channels, campaigns, or content.");
    }
  }
  if (resourceName === "channels" && state.contentItems.some((item) => item.channelId === id)) {
    throw new HttpError(409, "RESOURCE_IN_USE", "Channel is still used by content.");
  }
  if (resourceName === "campaigns" && state.contentItems.some((item) => item.campaignId === id)) {
    throw new HttpError(409, "RESOURCE_IN_USE", "Campaign is still used by content.");
  }
}

function normalizeIntegrations(integrations, seedIntegrations) {
  if (!Array.isArray(integrations)) {
    return seedIntegrations;
  }

  const hasSocialProviders = integrations.some((item) => typeof item.provider === "string");
  if (!hasSocialProviders) {
    return seedIntegrations;
  }

  const existingByProvider = new Map(integrations.map((item) => [item.provider, item]));
  return seedIntegrations.map((seedIntegration) => ({
    ...seedIntegration,
    ...(existingByProvider.get(seedIntegration.provider) ?? {}),
  }));
}

function normalizePublishStatus(status) {
  if (status === "Published" || status === "Failed" || status === "Cancelled" || status === "Publishing") {
    return status;
  }

  if (status === "Draft") {
    return "Draft";
  }

  return "Scheduled";
}

function alignPostsWithPublishLogs(posts, logs) {
  const latestLogByPost = new Map();
  for (const log of logs) {
    if (!latestLogByPost.has(log.postId)) {
      latestLogByPost.set(log.postId, log);
    }
  }

  return posts.map((post) => {
    const log = latestLogByPost.get(post.id);
    if (!log) {
      return post;
    }

    if (log.status === "published") {
      return {
        ...post,
        status: "Published",
        publishStatus: "Published",
        lastPublishError: "",
        publishedAt: post.publishedAt ?? log.createdAt,
        externalPostId: post.externalPostId ?? log.externalPostId ?? null,
      };
    }

    if (log.status === "failed") {
      return {
        ...post,
        status: "Failed",
        publishStatus: "Failed",
        lastPublishError: post.lastPublishError || log.message,
      };
    }

    return post;
  });
}

function findIntegrationForChannel(integrations, channel) {
  const provider = normalizeProvider(channel);
  return integrations.find((integration) => integration.provider === provider);
}

function normalizeProvider(channel) {
  const value = String(channel ?? "").toLowerCase();
  if (value.includes("facebook")) return "facebook";
  if (value.includes("instagram")) return "instagram";
  if (value.includes("thread")) return "threads";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("linkedin")) return "linkedin";
  if (value === "x" || value.includes("twitter")) return "x";
  return value.replace(/[^a-z0-9]+/g, "-");
}

function buildPublishError(channel, integration) {
  if (!integration) {
    return `${channel} is not configured. Connect this channel before publishing.`;
  }

  if (integration.status !== "connected") {
    return `${integration.name} is ${integration.status.replace("_", " ")}. Connect it before publishing.`;
  }

  return `${integration.name} token is ${integration.tokenHealth}. Reconnect before publishing.`;
}

function safeUsername() {
  try {
    return os.userInfo().username;
  } catch {
    return "unknown";
  }
}

function getDefinition(resourceName) {
  const definition = resourceDefinitions[resourceName];
  if (!definition) {
    throw new HttpError(404, "RESOURCE_NOT_FOUND", "Unknown resource.");
  }

  return definition;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
