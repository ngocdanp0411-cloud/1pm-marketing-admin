import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";

const token = "test-1pm-token";

test("backend API supports health, auth, bootstrap, and campaign CRUD", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "1pm-api-test-"));
  const port = 19087 + Math.floor(Math.random() * 1000);
  const dataFilePath = path.join(tempDir, "app-state.json");
  const server = spawn(process.execPath, ["server/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      DEV_API_TOKEN: token,
      DATA_FILE_PATH: dataFilePath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServer(server, port);

    const health = await getJson(port, "/api/health");
    assert.equal(health.ok, true);
    assert.equal(health.data.status, "ok");

    const unauthorized = await fetch(`http://127.0.0.1:${port}/api/campaigns`);
    assert.equal(unauthorized.status, 401);

    const bootstrap = await getJson(port, "/api/bootstrap", { auth: true });
    assert.equal(bootstrap.ok, true);
    assert.equal(bootstrap.data.workspace.apiPort, port);
    assert.ok(Array.isArray(bootstrap.data.campaigns));
    assert.ok(Array.isArray(bootstrap.data.integrations));
    assert.ok(Array.isArray(bootstrap.data.publishLogs));
    assert.ok(Array.isArray(bootstrap.data.notifications));

    const created = await postJson(port, "/api/campaigns", {
      name: "API Smoke Campaign",
      channel: "Email",
      status: "Draft",
    });
    assert.equal(created.ok, true);
    assert.match(created.data.id, /^campaign-/);

    const patched = await patchJson(port, `/api/campaigns/${created.data.id}`, {
      status: "Active",
    });
    assert.equal(patched.data.status, "Active");

    const deleted = await deleteJson(port, `/api/campaigns/${created.data.id}`);
    assert.equal(deleted.data.deleted, true);

    const tiktokPost = await postJson(port, "/api/social-posts", {
      title: "TikTok API Smoke",
      channel: "TikTok",
      copy: "Testing the multi-channel publish workflow.",
    });
    assert.equal(tiktokPost.ok, true);
    assert.equal(tiktokPost.data.publishStatus, "Scheduled");

    const failedPublish = await postJson(port, `/api/social-posts/${tiktokPost.data.id}/publish`);
    assert.equal(failedPublish.ok, true);
    assert.equal(failedPublish.data.post.status, "Failed");
    assert.equal(failedPublish.data.log.status, "failed");
    assert.match(failedPublish.data.post.lastPublishError, /TikTok/);

    const tiktokIntegration = bootstrap.data.integrations.find((item) => item.provider === "tiktok");
    assert.ok(tiktokIntegration);

    const connectedIntegration = await patchJson(port, `/api/integrations/${tiktokIntegration.id}`, {
      status: "connected",
      tokenHealth: "healthy",
      pageId: "tiktok-demo-page",
      connectedAt: new Date().toISOString(),
    });
    assert.equal(connectedIntegration.data.status, "connected");

    const successfulPublish = await postJson(port, `/api/social-posts/${tiktokPost.data.id}/publish`);
    assert.equal(successfulPublish.ok, true);
    assert.equal(successfulPublish.data.post.status, "Published");
    assert.equal(successfulPublish.data.log.status, "published");
    assert.match(successfulPublish.data.post.externalPostId, /^demo-tiktok-/);

    const logs = await getJson(port, "/api/publish-logs", { auth: true });
    assert.ok(logs.data.some((item) => item.postId === tiktokPost.data.id && item.status === "published"));

    const logMutation = await postJson(port, "/api/publish-logs", {
      postId: tiktokPost.data.id,
      channel: "TikTok",
      status: "published",
    });
    assert.equal(logMutation.ok, false);
    assert.equal(logMutation.error.code, "METHOD_NOT_ALLOWED");

    const notifications = await getJson(port, "/api/notifications", { auth: true });
    assert.ok(notifications.data.some((item) => item.relatedId === tiktokPost.data.id));

    const notification = notifications.data.find((item) => item.relatedId === tiktokPost.data.id);
    const patchedNotification = await patchJson(port, `/api/notifications/${notification.id}`, {
      status: "read",
    });
    assert.equal(patchedNotification.data.status, "read");

    const invalidNotificationPatch = await patchJson(port, `/api/notifications/${notification.id}`, {
      title: "Tamper",
    });
    assert.equal(invalidNotificationPatch.ok, false);
    assert.equal(invalidNotificationPatch.error.code, "INVALID_BODY");
  } finally {
    const exitPromise = server.exitCode === null ? once(server, "exit") : Promise.resolve();
    server.kill("SIGTERM");
    await exitPromise.catch(() => {});
    await rm(tempDir, { force: true, recursive: true });
  }
});

async function waitForServer(server, port) {
  const deadline = Date.now() + 5000;
  let stderr = "";
  server.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Server exited before readiness: ${stderr}`);
    }

    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  }

  throw new Error(`Server did not become ready: ${stderr}`);
}

function getJson(port, pathname, options = {}) {
  return requestJson(port, pathname, { method: "GET", ...options });
}

function postJson(port, pathname, body) {
  return requestJson(port, pathname, { method: "POST", auth: true, body });
}

function patchJson(port, pathname, body) {
  return requestJson(port, pathname, { method: "PATCH", auth: true, body });
}

function deleteJson(port, pathname) {
  return requestJson(port, pathname, { method: "DELETE", auth: true });
}

async function requestJson(port, pathname, options) {
  const headers = {};
  if (options.auth) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return response.json();
}
