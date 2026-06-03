import http from "node:http";

import { resolvePort, serverHost } from "./config.js";
import { handlePreflight, sendError } from "./http-helpers.js";
import { createRouter } from "./router.js";
import { AppStateStore } from "./state-store.js";

const port = resolvePort(process.env.PORT);
const host = serverHost;
const store = new AppStateStore();

try {
  await store.init();
} catch (error) {
  console.error("Failed to initialize app state.");
  console.error(error);
  process.exit(1);
}

const route = createRouter({ store, port });

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      handlePreflight(req, res);
      return;
    }

    await route(req, res);
  } catch (error) {
    sendError(req, res, error);
  }
});

server.on("clientError", (error, socket) => {
  console.error("Client connection error:", error.message);
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  }
});

server.on("error", (error) => {
  console.error("Server startup error:", error);
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`1PM backend listening on http://${host}:${port}`);
});

const shutdown = () => {
  server.close((error) => {
    if (error) {
      console.error("Server shutdown error:", error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
