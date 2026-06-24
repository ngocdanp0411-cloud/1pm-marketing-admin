import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { mediaUploadDir, mediaUploadMaxBytes } from "./config.js";
import { HttpError } from "./http-helpers.js";

const allowedTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["video/mp4", ".mp4"],
  ["video/webm", ".webm"],
  ["video/quicktime", ".mov"],
]);

export async function saveUploadedMedia(payload) {
  const filename = typeof payload.filename === "string" ? payload.filename.trim() : "";
  const contentType = typeof payload.contentType === "string" ? payload.contentType.trim().toLowerCase() : "";
  const dataBase64 = typeof payload.dataBase64 === "string" ? payload.dataBase64.trim() : "";
  const extension = allowedTypes.get(contentType);

  if (!filename || !contentType || !dataBase64) {
    throw new HttpError(400, "INVALID_BODY", "Upload requires filename, contentType, and dataBase64.");
  }

  if (!extension) {
    throw new HttpError(400, "UNSUPPORTED_MEDIA_TYPE", "Only image and video uploads are supported.");
  }

  const rawBase64 = dataBase64.includes(",") ? dataBase64.split(",").pop() : dataBase64;
  const bytes = Buffer.from(rawBase64, "base64");
  if (!bytes.length) {
    throw new HttpError(400, "INVALID_MEDIA_DATA", "Uploaded media data is empty or invalid.");
  }
  if (bytes.length > mediaUploadMaxBytes) {
    throw new HttpError(413, "PAYLOAD_TOO_LARGE", "Media file exceeds the upload size limit.");
  }

  const safeBase = filename
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "media";
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeBase}${extension}`;

  await mkdir(mediaUploadDir, { recursive: true });
  await writeFile(path.join(mediaUploadDir, storedName), bytes);

  return {
    filename: storedName,
    originalFilename: filename,
    contentType,
    sizeBytes: bytes.length,
    url: `/uploads/${encodeURIComponent(storedName)}`,
  };
}
