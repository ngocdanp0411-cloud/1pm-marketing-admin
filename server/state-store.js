import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { dataFilePath } from "./config.js";
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
    const canPublish = integration?.status === "connected" && integration?.tokenHealth === "healthy";
    const externalPostId = canPublish ? `demo-${normalizeProvider(existing.channel)}-${randomUUID().slice(0, 8)}` : null;
    const errorMessage = canPublish ? "" : buildPublishError(existing.channel, integration);
    const nextStatus = canPublish ? "Published" : "Failed";

    const updatedPost = {
      ...existing,
      status: nextStatus,
      publishStatus: nextStatus,
      lastPublishError: errorMessage,
      publishedAt: canPublish ? now : existing.publishedAt ?? null,
      externalPostId,
      updatedAt: now,
    };

    const log = {
      id: `publish-log-${randomUUID()}`,
      postId: existing.id,
      channel: existing.channel,
      status: canPublish ? "published" : "failed",
      message: canPublish ? `Demo publish succeeded for ${existing.channel}.` : errorMessage,
      externalPostId,
      createdAt: now,
    };

    const notification = {
      id: `notification-${randomUUID()}`,
      type: canPublish ? "publish" : "integration",
      title: canPublish ? "Post published" : `${existing.channel} publish failed`,
      message: canPublish ? `${existing.title} is now marked as published in the operations layer.` : errorMessage,
      severity: canPublish ? "success" : "warning",
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

function buildOverviewMetrics(state) {
  const activeCampaigns = state.campaigns.filter((item) => item.status === "Active").length;
  const scheduledEvents = state.calendarEvents.filter((item) => item.status === "Scheduled").length;
  const connectedChannels = state.integrations.filter((item) => item.status === "connected").length;
  const queuedPosts = state.socialQueue.filter((item) => ["Queued", "Scheduled", "Approved"].includes(item.status)).length;
  const failedPublishes = state.socialQueue.filter((item) => item.status === "Failed" || item.publishStatus === "Failed").length;

  return [
    { key: "campaigns", label: "Active Campaigns", value: activeCampaigns, context: `${state.campaigns.length} total` },
    { key: "content", label: "Connected Channels", value: connectedChannels, context: `${state.integrations.length} configured` },
    { key: "calendar", label: "Scheduled Events", value: scheduledEvents, context: `${state.calendarEvents.length} on calendar` },
    { key: "social", label: "Queued Social Posts", value: queuedPosts, context: `${state.socialQueue.length} in social queue` },
    { key: "local", label: "Failed Publishes", value: failedPublishes, context: `${state.publishLogs.length} publish logs` },
  ];
}

function normalizeState(state) {
  const seedState = createSeedState();
  const nextState = { ...seedState, ...state };

  nextState.integrations = normalizeIntegrations(state.integrations, seedState.integrations);
  nextState.publishLogs = Array.isArray(state.publishLogs) ? state.publishLogs : seedState.publishLogs;
  nextState.notifications = Array.isArray(state.notifications) ? state.notifications : seedState.notifications;
  nextState.socialQueue = (Array.isArray(state.socialQueue) ? state.socialQueue : seedState.socialQueue).map((post) => ({
    publishStatus: normalizePublishStatus(post.status),
    lastPublishError: "",
    publishedAt: null,
    externalPostId: null,
    ...post,
  }));
  nextState.socialQueue = alignPostsWithPublishLogs(nextState.socialQueue, nextState.publishLogs);

  return nextState;
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
