import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(serverDir, "..");

export const defaultPort = 8787;
export const devAuthToken = process.env.DEV_API_TOKEN || "dev-1pm-token";
export const jsonBodyLimitBytes = 1024 * 1024;
export const dataFilePath = process.env.DATA_FILE_PATH || path.join(projectRoot, "data", "app-state.json");
export const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173/";
export const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

export function resolvePort(value) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultPort;
}
