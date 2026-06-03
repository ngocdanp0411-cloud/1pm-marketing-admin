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
    this.state = JSON.parse(fileContents);
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
      socialQueue: clone(this.state.socialQueue),
      localListings: clone(this.state.localListings),
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
  const readyContent = state.contentItems.filter((item) => item.stage === "Ready to Publish").length;
  const queuedPosts = state.socialQueue.filter((item) => item.status === "Queued").length;
  const healthyListings = state.localListings.filter((item) => item.status === "Healthy").length;

  return [
    { key: "campaigns", label: "Active Campaigns", value: activeCampaigns, context: `${state.campaigns.length} total` },
    { key: "content", label: "Ready Content", value: readyContent, context: `${state.contentItems.length} items tracked` },
    { key: "calendar", label: "Scheduled Events", value: scheduledEvents, context: `${state.calendarEvents.length} on calendar` },
    { key: "social", label: "Queued Social Posts", value: queuedPosts, context: `${state.socialQueue.length} in social queue` },
    { key: "local", label: "Healthy Listings", value: healthyListings, context: `${state.localListings.length} locations monitored` },
  ];
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
