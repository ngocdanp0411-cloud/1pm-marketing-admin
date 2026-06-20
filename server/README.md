# 1PM Backend v1

Run the backend with built-in Node modules only:

```bash
node server/index.js
PORT=8788 node server/index.js
```

Default port is `8787`. Set `PORT` to override it.

Set the internal admin password before using protected API routes:

```bash
APP_ADMIN_PASSWORD="use-a-long-random-password" node server/index.js
```

Core endpoints:

- `GET /api`
- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/bootstrap`
- `GET|POST /api/campaigns`
- `GET|PATCH|DELETE /api/campaigns/:id`
- `GET|POST /api/content`
- `GET|PATCH|DELETE /api/content/:id`
- `GET|POST /api/calendar`
- `GET|PATCH|DELETE /api/calendar/:id`
- `GET|POST /api/social-posts`
- `GET|PATCH|DELETE /api/social-posts/:id`
- `POST /api/social-posts/:id/publish`
- `GET|PATCH /api/integrations/:id`
- `GET /api/publish-logs`
- `GET|PATCH /api/notifications/:id`

Persistence:

- State lives in `data/app-state.json`
- The file is auto-seeded on first boot if it does not exist

Behavior notes:

- CORS allows common localhost Vite origins
- `/api`, `/api/health`, and `/api/auth/*` are public
- Every other `/api/*` route requires the HttpOnly admin session cookie
- Browser/API app routes do not require the legacy bearer token
- Unauthenticated protected routes return `401 Not authenticated.`
- Login cookies use `HttpOnly`, `SameSite=Lax`, `Path=/`, and `Secure` in production
- Production protected routes fail closed with `AUTH_NOT_CONFIGURED` when `APP_ADMIN_PASSWORD` is missing
- JSON request bodies are limited to 1 MB
- Error responses use a consistent shape: `{ "ok": false, "error": { ... } }`
- Multi-channel publishing updates JSON state, publish logs, and notifications. Facebook Page publishing can call the real Graph API when configured; Instagram, Threads, TikTok, LinkedIn, and X remain demo operations adapters.
- Publish logs are read-only through the public API. Notifications allow status-only PATCH.

Facebook Page publishing:

- Set `FACEBOOK_PAGE_ID` to the target Page ID.
- Set `FACEBOOK_PAGE_ACCESS_TOKEN` to a Page access token with `pages_manage_posts`.
- Optional: set `FACEBOOK_GRAPH_API_BASE_URL` to override the Graph API version/base URL.
- `POST /api/social-posts/:id/publish` publishes Facebook channel posts to `/{page-id}/feed`.

Production swap notes:

- Replace the single-password/in-memory session model for multi-user or multi-instance use
- Replace the JSON file store with a database-backed repository layer
- Tighten CORS origins to deployed frontend hosts only
- Add OAuth/app-review-backed adapters for each remaining social network before claiming real external publishing
