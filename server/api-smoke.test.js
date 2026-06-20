import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import test from "node:test";

const adminPassword = "test-admin-password-strong";

test("backend API supports health, auth, bootstrap, and campaign CRUD", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "1pm-api-test-"));
  const port = 19087 + Math.floor(Math.random() * 1000);
  const facebookGraphPort = 21087 + Math.floor(Math.random() * 1000);
  const dataFilePath = path.join(tempDir, "app-state.json");
  const graphRequests = [];
  const graphServer = createMockFacebookGraphServer(graphRequests);
  await new Promise((resolve) => graphServer.listen(facebookGraphPort, "127.0.0.1", resolve));

  const server = spawn(process.execPath, ["server/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      APP_ADMIN_PASSWORD: adminPassword,
      DATA_FILE_PATH: dataFilePath,
      FACEBOOK_GRAPH_API_BASE_URL: `http://127.0.0.1:${facebookGraphPort}`,
      FACEBOOK_PAGE_ID: "fb-page-smoke",
      FACEBOOK_PAGE_ACCESS_TOKEN: "fb-page-token-smoke",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServer(server, port);

    const health = await getJson(port, "/api/health");
    assert.equal(health.ok, true);
    assert.equal(health.data.status, "ok");

    const serviceMetadata = await getJson(port, "/api");
    assert.equal(serviceMetadata.ok, true);
    assert.equal(serviceMetadata.data.health, "/api/health");

    const preflight = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type",
      },
    });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get("access-control-allow-origin"), "http://localhost:5173");
    assert.equal(preflight.headers.get("access-control-allow-credentials"), "true");
    assert.equal(preflight.headers.get("access-control-allow-headers"), "Content-Type");

    const meBeforeLogin = await getJson(port, "/api/auth/me");
    assert.deepEqual(meBeforeLogin, { ok: true, data: { authenticated: false } });

    const unauthorized = await requestJsonWithResponse(port, "/api/bootstrap", { method: "GET" });
    assert.equal(unauthorized.response.status, 401);
    assert.equal(unauthorized.payload.error.message, "Not authenticated.");

    const wrongLogin = await login(port, "wrong-password");
    assert.equal(wrongLogin.response.status, 401);
    assert.equal(wrongLogin.payload.error.code, "INVALID_CREDENTIALS");

    const successfulLogin = await login(port, adminPassword);
    assert.equal(successfulLogin.response.status, 200);
    assert.deepEqual(successfulLogin.payload, { ok: true, data: { authenticated: true } });
    assert.match(successfulLogin.setCookie, /HttpOnly/i);
    assert.match(successfulLogin.setCookie, /SameSite=Lax/i);
    assert.match(successfulLogin.setCookie, /Path=\//i);
    assert.match(successfulLogin.setCookie, /Secure/i);

    const api = createApiClient(port, successfulLogin.cookie);
    const meAfterLogin = await api.get("/api/auth/me");
    assert.deepEqual(meAfterLogin, { ok: true, data: { authenticated: true } });

    const bootstrap = await api.get("/api/bootstrap");
    assert.equal(bootstrap.ok, true);
    assert.equal(bootstrap.data.workspace.apiPort, port);
    assert.ok(Array.isArray(bootstrap.data.campaigns));
    assert.ok(Array.isArray(bootstrap.data.integrations));
    assert.ok(Array.isArray(bootstrap.data.publishLogs));
    assert.ok(Array.isArray(bootstrap.data.notifications));

    const created = await api.post("/api/campaigns", {
      name: "API Smoke Campaign",
      channel: "Email",
      status: "Draft",
    });
    assert.equal(created.ok, true);
    assert.match(created.data.id, /^campaign-/);

    const patched = await api.patch(`/api/campaigns/${created.data.id}`, {
      status: "Active",
    });
    assert.equal(patched.data.status, "Active");

    const deleted = await api.delete(`/api/campaigns/${created.data.id}`);
    assert.equal(deleted.data.deleted, true);

    const manualContent = await api.post("/api/content", {
      title: "Manual launch caption",
      type: "Caption",
      channel: "Facebook",
      status: "Scheduled",
      stage: "Review",
      owner: "Ngọc Dân",
      campaignId: "campaign-launch-2026",
      copy: "Copy drafted in Claude and pasted into the manual composer.",
      mediaUrl: "https://cdn.1pm.test/manual-launch.png",
      visualNotes: "ChatGPT visual: clean product hero with dark background.",
      copyNotes: "Keep the CTA concise.",
      scheduledFor: "2026-06-24T10:30",
      date: "2026-06-24",
      tags: "launch, facebook, manual",
      source: "manual",
      summary: "Copy drafted in Claude and pasted into the manual composer.",
    });
    assert.equal(manualContent.ok, true);
    assert.equal(manualContent.data.source, "manual");
    assert.equal(manualContent.data.mediaUrl, "https://cdn.1pm.test/manual-launch.png");
    assert.equal(manualContent.data.scheduledFor, "2026-06-24T10:30");

    const editedManualContent = await api.patch(`/api/content/${manualContent.data.id}`, {
      status: "Published",
      stage: "Ready to Publish",
      copy: "Updated manual copy.",
    });
    assert.equal(editedManualContent.data.status, "Published");
    assert.equal(editedManualContent.data.copy, "Updated manual copy.");

    const contentLibrary = await api.get("/api/content");
    assert.equal(
      contentLibrary.data.find((item) => item.id === manualContent.data.id)?.tags,
      "launch, facebook, manual",
    );
    const contentBootstrap = await api.get("/api/bootstrap");
    assert.equal(
      contentBootstrap.data.contentItems.find((item) => item.id === manualContent.data.id)?.scheduledFor,
      "2026-06-24T10:30",
    );

    const deletedManualContent = await api.delete(`/api/content/${manualContent.data.id}`);
    assert.equal(deletedManualContent.data.deleted, true);

    const tiktokPost = await api.post("/api/social-posts", {
      title: "TikTok API Smoke",
      channel: "TikTok",
      copy: "Testing the multi-channel publish workflow.",
      mediaUrl: "https://cdn.1pm.test/tiktok-api-smoke.png",
    });
    assert.equal(tiktokPost.ok, true);
    assert.equal(tiktokPost.data.publishStatus, "Scheduled");
    assert.equal(tiktokPost.data.mediaUrl, "https://cdn.1pm.test/tiktok-api-smoke.png");

    const patchedTikTokPost = await api.patch(`/api/social-posts/${tiktokPost.data.id}`, {
      mediaUrl: "https://cdn.1pm.test/tiktok-api-smoke-v2.png",
    });
    assert.equal(patchedTikTokPost.ok, true);
    assert.equal(patchedTikTokPost.data.mediaUrl, "https://cdn.1pm.test/tiktok-api-smoke-v2.png");

    const refreshedPosts = await api.get("/api/social-posts");
    assert.equal(
      refreshedPosts.data.find((item) => item.id === tiktokPost.data.id)?.mediaUrl,
      "https://cdn.1pm.test/tiktok-api-smoke-v2.png",
    );
    const refreshedBootstrap = await api.get("/api/bootstrap");
    assert.equal(
      refreshedBootstrap.data.socialQueue.find((item) => item.id === tiktokPost.data.id)?.mediaUrl,
      "https://cdn.1pm.test/tiktok-api-smoke-v2.png",
    );

    const failedPublish = await api.post(`/api/social-posts/${tiktokPost.data.id}/publish`);
    assert.equal(failedPublish.ok, true);
    assert.equal(failedPublish.data.post.status, "Failed");
    assert.equal(failedPublish.data.log.status, "failed");
    assert.match(failedPublish.data.post.lastPublishError, /TikTok/);

    const tiktokIntegration = bootstrap.data.integrations.find((item) => item.provider === "tiktok");
    assert.ok(tiktokIntegration);

    const connectedIntegration = await api.patch(`/api/integrations/${tiktokIntegration.id}`, {
      status: "connected",
      tokenHealth: "healthy",
      pageId: "tiktok-demo-page",
      connectedAt: new Date().toISOString(),
    });
    assert.equal(connectedIntegration.data.status, "connected");

    const successfulPublish = await api.post(`/api/social-posts/${tiktokPost.data.id}/publish`);
    assert.equal(successfulPublish.ok, true);
    assert.equal(successfulPublish.data.post.status, "Published");
    assert.equal(successfulPublish.data.log.status, "published");
    assert.match(successfulPublish.data.post.externalPostId, /^demo-tiktok-/);

    const facebookPost = await api.post("/api/social-posts", {
      title: "Facebook API Smoke",
      channel: "Facebook Page",
      copy: "Publishing through the Facebook Graph API.",
    });
    assert.equal(facebookPost.ok, true);

    const facebookPublish = await api.post(`/api/social-posts/${facebookPost.data.id}/publish`);
    assert.equal(facebookPublish.ok, true);
    assert.equal(facebookPublish.data.post.status, "Published");
    assert.equal(facebookPublish.data.log.status, "published");
    assert.equal(facebookPublish.data.post.externalPostId, "fb-page-smoke_12345");
    assert.equal(graphRequests.length, 1);
    assert.equal(graphRequests[0].pathname, "/fb-page-smoke/feed");
    assert.equal(graphRequests[0].body.get("message"), "Publishing through the Facebook Graph API.");
    assert.equal(graphRequests[0].body.get("access_token"), "fb-page-token-smoke");

    const logs = await api.get("/api/publish-logs");
    assert.ok(logs.data.some((item) => item.postId === tiktokPost.data.id && item.status === "published"));

    const logMutation = await api.post("/api/publish-logs", {
      postId: tiktokPost.data.id,
      channel: "TikTok",
      status: "published",
    });
    assert.equal(logMutation.ok, false);
    assert.equal(logMutation.error.code, "METHOD_NOT_ALLOWED");

    const notifications = await api.get("/api/notifications");
    assert.ok(notifications.data.some((item) => item.relatedId === tiktokPost.data.id));

    const notification = notifications.data.find((item) => item.relatedId === tiktokPost.data.id);
    const patchedNotification = await api.patch(`/api/notifications/${notification.id}`, {
      status: "read",
    });
    assert.equal(patchedNotification.data.status, "read");

    const invalidNotificationPatch = await api.patch(`/api/notifications/${notification.id}`, {
      title: "Tamper",
    });
    assert.equal(invalidNotificationPatch.ok, false);
    assert.equal(invalidNotificationPatch.error.code, "INVALID_BODY");

    const logout = await requestJsonWithResponse(port, "/api/auth/logout", {
      method: "POST",
      cookie: successfulLogin.cookie,
    });
    assert.equal(logout.response.status, 200);
    assert.deepEqual(logout.payload, { ok: true, data: { authenticated: false } });
    assert.match(logout.response.headers.get("set-cookie") ?? "", /Max-Age=0/i);

    const meAfterLogout = await getJson(port, "/api/auth/me", { cookie: successfulLogin.cookie });
    assert.deepEqual(meAfterLogout, { ok: true, data: { authenticated: false } });

    const protectedAfterLogout = await requestJsonWithResponse(port, "/api/bootstrap", {
      method: "GET",
      cookie: successfulLogin.cookie,
    });
    assert.equal(protectedAfterLogout.response.status, 401);
    assert.equal(protectedAfterLogout.payload.error.message, "Not authenticated.");
  } finally {
    const exitPromise = server.exitCode === null ? once(server, "exit") : Promise.resolve();
    server.kill("SIGTERM");
    await exitPromise.catch(() => {});
    await rm(tempDir, { force: true, recursive: true });
    await new Promise((resolve) => graphServer.close(resolve));
  }
});

test("facebook publishing fails clearly without Graph API credentials", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "1pm-api-test-"));
  const port = 20087 + Math.floor(Math.random() * 1000);
  const dataFilePath = path.join(tempDir, "app-state.json");
  const server = spawn(process.execPath, ["server/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "test",
      PORT: String(port),
      APP_ADMIN_PASSWORD: adminPassword,
      DATA_FILE_PATH: dataFilePath,
      FACEBOOK_PAGE_ID: "",
      FACEBOOK_PAGE_ACCESS_TOKEN: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServer(server, port);
    const successfulLogin = await login(port, adminPassword);
    const api = createApiClient(port, successfulLogin.cookie);

    const facebookPost = await api.post("/api/social-posts", {
      title: "Facebook Missing Credentials",
      channel: "Facebook Page",
      copy: "This should not publish without credentials.",
    });

    const facebookPublish = await api.post(`/api/social-posts/${facebookPost.data.id}/publish`);
    assert.equal(facebookPublish.ok, true);
    assert.equal(facebookPublish.data.post.status, "Failed");
    assert.equal(facebookPublish.data.log.status, "failed");
    assert.match(facebookPublish.data.post.lastPublishError, /FACEBOOK_PAGE_ID/);
  } finally {
    const exitPromise = server.exitCode === null ? once(server, "exit") : Promise.resolve();
    server.kill("SIGTERM");
    await exitPromise.catch(() => {});
    await rm(tempDir, { force: true, recursive: true });
  }
});

test("production rejects protected routes when admin password is not configured", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "1pm-api-test-"));
  const port = 22087 + Math.floor(Math.random() * 1000);
  const dataFilePath = path.join(tempDir, "app-state.json");
  const server = spawn(process.execPath, ["server/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_ENV: "production",
      PORT: String(port),
      APP_ADMIN_PASSWORD: "",
      DATA_FILE_PATH: dataFilePath,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  try {
    await waitForServer(server, port);

    const health = await getJson(port, "/api/health");
    assert.equal(health.ok, true);

    const me = await getJson(port, "/api/auth/me");
    assert.deepEqual(me, { ok: true, data: { authenticated: false } });

    const protectedRoute = await requestJsonWithResponse(port, "/api/bootstrap", {
      method: "GET",
    });
    assert.equal(protectedRoute.response.status, 503);
    assert.equal(protectedRoute.payload.error.code, "AUTH_NOT_CONFIGURED");

    const loginAttempt = await login(port, "any-password");
    assert.equal(loginAttempt.response.status, 503);
    assert.equal(loginAttempt.payload.error.code, "AUTH_NOT_CONFIGURED");
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

function postJson(port, pathname, body, options = {}) {
  return requestJson(port, pathname, { method: "POST", body, ...options });
}

function patchJson(port, pathname, body, options = {}) {
  return requestJson(port, pathname, { method: "PATCH", body, ...options });
}

function deleteJson(port, pathname, options = {}) {
  return requestJson(port, pathname, { method: "DELETE", ...options });
}

async function requestJson(port, pathname, options) {
  const result = await requestJsonWithResponse(port, pathname, options);
  return result.payload;
}

async function requestJsonWithResponse(port, pathname, options) {
  const headers = {};
  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return {
    response,
    payload: await response.json(),
  };
}

async function login(port, password) {
  const result = await requestJsonWithResponse(port, "/api/auth/login", {
    method: "POST",
    body: { password },
  });
  const setCookie = result.response.headers.get("set-cookie") ?? "";

  return {
    ...result,
    setCookie,
    cookie: setCookie.split(";")[0],
  };
}

function createApiClient(port, cookie) {
  return {
    get: (pathname) => getJson(port, pathname, { cookie }),
    post: (pathname, body = {}) => postJson(port, pathname, body, { cookie }),
    patch: (pathname, body) => patchJson(port, pathname, body, { cookie }),
    delete: (pathname) => deleteJson(port, pathname, { cookie }),
  };
}

function createMockFacebookGraphServer(requests) {
  return createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
    requests.push({ method: req.method, pathname: url.pathname, body });

    if (req.method !== "POST" || url.pathname !== "/fb-page-smoke/feed") {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Not found" } }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ id: "fb-page-smoke_12345" }));
  });
}
