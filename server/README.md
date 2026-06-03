# 1PM Backend v1

Run the backend with built-in Node modules only:

```bash
node server/index.js
PORT=8788 node server/index.js
```

Default port is `8787`. Set `PORT` to override it.

Dev auth token for all non-health API routes:

```text
Authorization: Bearer dev-1pm-token
```

Core endpoints:

- `GET /api/health`
- `GET /api/bootstrap`
- `GET|POST /api/campaigns`
- `GET|PATCH|DELETE /api/campaigns/:id`
- `GET|POST /api/content`
- `GET|PATCH|DELETE /api/content/:id`
- `GET|POST /api/calendar`
- `GET|PATCH|DELETE /api/calendar/:id`
- `GET|POST /api/social-posts`
- `GET|PATCH|DELETE /api/social-posts/:id`

Persistence:

- State lives in `data/app-state.json`
- The file is auto-seeded on first boot if it does not exist

Behavior notes:

- CORS allows common localhost Vite origins
- `Authorization` is required for every `/api/*` route except `/api/health`
- JSON request bodies are limited to 1 MB
- Error responses use a consistent shape: `{ "ok": false, "error": { ... } }`

Production swap notes:

- Replace the dev bearer token with real auth middleware
- Replace the JSON file store with a database-backed repository layer
- Tighten CORS origins to deployed frontend hosts only
