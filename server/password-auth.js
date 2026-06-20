import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { appAdminPassword, isProduction } from "./config.js";
import { HttpError } from "./http-helpers.js";

export const adminSessionCookieName = "onepm_admin_session";

export class PasswordAuth {
  constructor({ password = appAdminPassword, secure = isProduction } = {}) {
    this.password = password;
    this.secure = secure;
    this.sessions = new Set();
  }

  login(candidatePassword) {
    this.assertConfigured();

    if (!passwordsMatch(candidatePassword, this.password)) {
      throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid admin password.");
    }

    const token = randomBytes(32).toString("base64url");
    this.sessions.add(token);
    return {
      token,
      cookie: serializeSessionCookie(token, { secure: this.secure }),
    };
  }

  logout(req) {
    const token = readCookie(req, adminSessionCookieName);
    if (token) {
      this.sessions.delete(token);
    }

    return serializeSessionCookie("", { secure: this.secure, clear: true });
  }

  isAuthenticated(req) {
    const token = readCookie(req, adminSessionCookieName);
    return Boolean(token && this.sessions.has(token));
  }

  requireAuthenticated(req) {
    this.assertConfigured();

    if (!this.isAuthenticated(req)) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required.");
    }
  }

  assertConfigured() {
    if (!this.password) {
      throw new HttpError(
        503,
        "AUTH_NOT_CONFIGURED",
        "Admin password authentication is not configured.",
      );
    }
  }
}

function passwordsMatch(candidate, expected) {
  if (typeof candidate !== "string") {
    return false;
  }

  const candidateDigest = createHash("sha256").update(candidate).digest();
  const expectedDigest = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateDigest, expectedDigest);
}

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return "";
  }

  for (const cookie of cookieHeader.split(";")) {
    const separatorIndex = cookie.indexOf("=");
    if (separatorIndex === -1) continue;

    const cookieName = cookie.slice(0, separatorIndex).trim();
    if (cookieName !== name) continue;

    return cookie.slice(separatorIndex + 1).trim();
  }

  return "";
}

function serializeSessionCookie(value, { secure, clear = false }) {
  const attributes = [
    `${adminSessionCookieName}=${value}`,
    "HttpOnly",
    "SameSite=Lax",
    "Path=/",
  ];

  if (clear) {
    attributes.push("Max-Age=0");
  }

  if (secure) {
    attributes.push("Secure");
  }

  return attributes.join("; ");
}
