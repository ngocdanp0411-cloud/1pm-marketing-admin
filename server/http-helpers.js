import { allowedOrigins, devAuthToken, jsonBodyLimitBytes } from "./config.js";

export class HttpError extends Error {
  constructor(statusCode, code, message, details) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendJson(req, res, statusCode, data) {
  applyCommonHeaders(req, res);
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ ok: true, data }, null, 2));
}

export function sendError(req, res, error) {
  applyCommonHeaders(req, res);

  const statusCode = error instanceof HttpError ? error.statusCode : 500;
  const code = error instanceof HttpError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = error instanceof HttpError ? error.message : "Unexpected server error.";
  const details = error instanceof HttpError ? error.details : undefined;

  if (!(error instanceof HttpError)) {
    console.error(error);
  }

  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(
    JSON.stringify(
      {
        ok: false,
        error: {
          code,
          message,
          details: details ?? null,
        },
      },
      null,
      2,
    ),
  );
}

export function handlePreflight(req, res) {
  applyCommonHeaders(req, res);
  res.writeHead(204);
  res.end();
}

export function requireDevAuth(req) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${devAuthToken}`) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing or invalid bearer token.");
  }
}

export async function parseJsonBody(req) {
  const contentLength = Number.parseInt(req.headers["content-length"] ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > jsonBodyLimitBytes) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "JSON body exceeds the 1 MB limit.");
  }

  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of req) {
    totalBytes += chunk.length;
    if (totalBytes > jsonBodyLimitBytes) {
      throw new HttpError(413, "PAYLOAD_TOO_LARGE", "JSON body exceeds the 1 MB limit.");
    }

    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  let parsed;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  if (!isPlainObject(parsed)) {
    throw new HttpError(400, "INVALID_BODY", "Request body must be a JSON object.");
  }

  return parsed;
}

function applyCommonHeaders(req, res) {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), geolocation=(), microphone=()");
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
