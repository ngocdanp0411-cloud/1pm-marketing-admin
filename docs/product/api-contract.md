# API Contract

## Runtime

The backend uses Node.js built-in modules only. `server/index.js` starts one HTTP
server that serves both API routes and the built frontend assets.

## Auth

Public routes:

```text
GET  /api
GET  /api/health
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

All other `/api/*` routes require the `onepm_admin_session` HttpOnly cookie.
`POST /api/auth/login` accepts `{ "password": "..." }` and compares it to
`APP_ADMIN_PASSWORD`. The cookie uses `HttpOnly`, `SameSite=Lax`, `Path=/`, and
`Secure` when `NODE_ENV=production`.

Sessions are stored in memory for the current single-instance deployment.
Server restarts invalidate sessions. Browser requests use same-origin cookie
credentials and do not contain a frontend authentication secret.

If `APP_ADMIN_PASSWORD` is missing, login and protected routes return
`503 AUTH_NOT_CONFIGURED`. `/api/health`, logout, and auth status remain usable.

`GET /api/auth/me` always returns `200` with the standard response envelope and
an `authenticated` boolean. Unauthenticated protected routes return `401` with
the message `Not authenticated.` No bearer token is required for app routes.

## Response Shape

Successful API responses are JSON. Error responses use:

```json
{
  "ok": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Frontend API helpers unwrap `payload.data ?? payload`.

## Resources

| Resource | Routes | Notes |
| --- | --- | --- |
| service metadata | `GET /api` | No auth required. |
| health | `GET /api/health` | No auth required. |
| auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` | Public session lifecycle endpoints. |
| bootstrap | `GET /api/bootstrap` | Returns workspace, current user, metrics, and all app collections. |
| brands | `GET/POST /api/brands`, `GET/PATCH/DELETE /api/brands/:id` | Generic Brand context CRUD. |
| channels | `GET/POST /api/channels`, `GET/PATCH/DELETE /api/channels/:id` | Generic Brand-scoped Channel CRUD. |
| campaigns | `GET/POST /api/campaigns`, `GET/PATCH/DELETE /api/campaigns/:id` | Brand-scoped campaign CRUD. |
| content | `GET/POST /api/content`, `GET/PATCH/DELETE /api/content/:id` | Unified Brand/Channel/Campaign-aware content CRUD. |
| manual publish | `POST /api/content/:id/manual-publish` | Marks unified Content Published/Failed and appends a PublishLog. |
| calendar | `GET/POST /api/calendar`, `GET/PATCH/DELETE /api/calendar/:id` | Generic CRUD. |
| social posts | `GET/POST /api/social-posts`, `GET/PATCH/DELETE /api/social-posts/:id` | Generic CRUD plus publish action. Supports `mediaUrl` as a string or null. |
| social publish | `POST /api/social-posts/:id/publish` | Updates post, publish log, and notification. |
| integrations | `GET/PATCH /api/integrations/:id` | Generic list/get also supported. |
| publish logs | `GET /api/publish-logs` | Read-only append history. |
| notifications | `GET /api/notifications`, `PATCH /api/notifications/:id` | PATCH may update `status` only. |

## Persistence

State lives in `data/app-state.json` by default and can be moved with
`DATA_FILE_PATH`. The store writes through a temp file and rename to reduce
partial write risk.

`normalizeState` adds Brand/Channel collections and maps legacy content/social
records to the unified Content shape in memory. It does not delete legacy
collections.

The JSON store is acceptable for personal v1. Public customer use requires a
database-backed repository layer and tenancy boundaries.

## Validation

`server/validators.js` owns allowed fields, defaults, and required fields for
mutations. It rejects:

- non-object JSON bodies,
- reserved fields `id`, `createdAt`, `updatedAt`,
- unsupported fields,
- non-string/non-null values,
- empty PATCH payloads.

## CORS

CORS allows common local Vite origins with credentials and `Content-Type`.
Production is same-origin because the Node service serves both the frontend and
API. Production origin hardening is still needed before public launch.
