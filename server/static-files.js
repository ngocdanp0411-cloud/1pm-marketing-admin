import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mediaUploadDir } from "./config.js";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverDir, "..");
const distDir = path.join(projectRoot, "dist");
const indexPath = path.join(distDir, "index.html");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webm": "video/webm",
  ".webp": "image/webp",
};

export async function serveUploadedAsset(req, res) {
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  const url = new URL(req.url || "/", "http://localhost");
  if (!url.pathname.startsWith("/uploads/")) {
    return false;
  }

  const filename = decodeURIComponent(url.pathname.replace(/^\/uploads\//, ""));
  const requestedPath = path.join(mediaUploadDir, filename);
  if (!isInsideDirectory(mediaUploadDir, requestedPath)) {
    return false;
  }

  const filePath = await resolveFilePath(requestedPath);
  if (!filePath) {
    return false;
  }

  res.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}

export async function serveStaticAsset(req, res) {
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  const url = new URL(req.url || "/", "http://localhost");
  const pathname = decodeURIComponent(url.pathname);
  const requestedPath = pathname === "/" ? indexPath : path.join(distDir, pathname);

  if (!isInsideDist(requestedPath)) {
    return false;
  }

  const filePath = await resolveFilePath(requestedPath);
  if (!filePath) {
    return false;
  }

  const extension = path.extname(filePath);
  res.writeHead(200, {
    "Content-Type": mimeTypes[extension] || "application/octet-stream",
    "Cache-Control": extension === ".html" ? "no-store" : "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
  });
  if (method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}

export async function serveSpaFallback(req, res) {
  const method = req.method || "GET";
  if (method !== "GET" && method !== "HEAD") {
    return false;
  }

  try {
    await access(indexPath);
  } catch {
    return false;
  }

  res.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  if (method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(indexPath).pipe(res);
  return true;
}

async function resolveFilePath(requestedPath) {
  try {
    const fileStat = await stat(requestedPath);
    if (fileStat.isFile()) {
      return requestedPath;
    }
  } catch {
    return null;
  }

  return null;
}

function isInsideDist(filePath) {
  return isInsideDirectory(distDir, filePath);
}

function isInsideDirectory(directoryPath, filePath) {
  const relativePath = path.relative(directoryPath, filePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}
