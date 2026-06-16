# API Contract

## Runtime

The backend uses Node.js built-in modules only. `server/index.js` starts one HTTP
server that serves both API routes and the built frontend assets.

## Auth

All `/api/*` routes except `/api/health` require:

```text
Authorization: Bearer dev-1pm-token
```

The token can be changed with `DEV_API_TOKEN`. This is development auth, not a
production authentication model.

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
| health | `GET /api/health` | No auth required. |
| bootstrap | `GET /api/bootstrap` | Returns workspace, current user, metrics, and all app collections. |
| campaigns | `GET/POST /api/campaigns`, `GET/PATCH/DELETE /api/campaigns/:id` | Generic CRUD. |
| content | `GET/POST /api/content`, `GET/PATCH/DELETE /api/content/:id` | Generic CRUD. |
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

CORS allows common local Vite origins only. Production origin hardening is still
needed before public launch.
