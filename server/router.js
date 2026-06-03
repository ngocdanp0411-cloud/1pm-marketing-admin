import { HttpError, parseJsonBody, requireDevAuth, sendJson } from "./http-helpers.js";
import { serveSpaFallback, serveStaticAsset } from "./static-files.js";
import { validateMutation } from "./validators.js";

const resourceRouteNames = new Set(["campaigns", "content", "calendar", "social-posts"]);

export function createRouter({ store, port }) {
  return async function route(req, res) {
    const method = req.method || "GET";
    const url = new URL(req.url || "/", "http://localhost");
    const pathSegments = url.pathname.split("/").filter(Boolean);

    if (!url.pathname.startsWith("/api/")) {
      if (await serveStaticAsset(req, res)) {
        return;
      }

      if (await serveSpaFallback(req, res)) {
        return;
      }

      throw new HttpError(404, "NOT_FOUND", "Route not found.");
    }

    if (url.pathname === "/api/health" && method === "GET") {
      sendJson(req, res, 200, {
        status: "ok",
        service: "1pm-marketing-command-center-api",
        port,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (url.pathname === "/api") {
      sendJson(req, res, 200, {
        service: "1pm-marketing-command-center-api",
        health: "/api/health",
        bootstrap: "/api/bootstrap",
      });
      return;
    }

    requireDevAuth(req);

    if (url.pathname === "/api/bootstrap" && method === "GET") {
      const payload = await store.getBootstrap(port);
      sendJson(req, res, 200, payload);
      return;
    }

    if (pathSegments.length < 2 || pathSegments[0] !== "api") {
      throw new HttpError(404, "NOT_FOUND", "Route not found.");
    }

    const resourceName = pathSegments[1];
    if (!resourceRouteNames.has(resourceName)) {
      throw new HttpError(404, "NOT_FOUND", "Route not found.");
    }

    const recordId = pathSegments[2];
    if (pathSegments.length > 3) {
      throw new HttpError(404, "NOT_FOUND", "Route not found.");
    }

    if (method === "GET") {
      if (recordId) {
        const record = await store.getById(resourceName, recordId);
        if (!record) {
          throw new HttpError(404, "NOT_FOUND", "Record not found.");
        }

        sendJson(req, res, 200, record);
        return;
      }

      const records = await store.list(resourceName);
      sendJson(req, res, 200, records);
      return;
    }

    if (method === "POST") {
      if (recordId) {
        throw new HttpError(405, "METHOD_NOT_ALLOWED", "POST is only supported on collections.");
      }

      const payload = validateMutation(resourceName, await parseJsonBody(req));
      const record = await store.create(resourceName, payload);
      sendJson(req, res, 201, record);
      return;
    }

    if (method === "PATCH") {
      if (!recordId) {
        throw new HttpError(405, "METHOD_NOT_ALLOWED", "PATCH requires a record id.");
      }

      const payload = validateMutation(resourceName, await parseJsonBody(req), { partial: true });
      const record = await store.update(resourceName, recordId, payload);
      if (!record) {
        throw new HttpError(404, "NOT_FOUND", "Record not found.");
      }

      sendJson(req, res, 200, record);
      return;
    }

    if (method === "DELETE") {
      if (!recordId) {
        throw new HttpError(405, "METHOD_NOT_ALLOWED", "DELETE requires a record id.");
      }

      const record = await store.delete(resourceName, recordId);
      if (!record) {
        throw new HttpError(404, "NOT_FOUND", "Record not found.");
      }

      sendJson(req, res, 200, {
        id: record.id,
        deleted: true,
      });
      return;
    }

    throw new HttpError(405, "METHOD_NOT_ALLOWED", `Method ${method} is not supported for this route.`);
  };
}
