# Architecture

## Current Shape

1PM Marketing Admin is a single-service web app:

```text
Browser
  -> Vite/React bundle from dist/
  -> relative /api/* calls
  -> Node.js HTTP server
  -> AppStateStore
  -> data/app-state.json
```

Railway runs the same Node service for API and static frontend.

## Runtime Stack

| Layer | Current implementation |
| --- | --- |
| Browser UI | React 18 + TypeScript + CSS in `src/`. |
| API client | `src/operations-api.ts`, relative `/api/*`, same-origin cookie credentials. |
| Server | Node.js built-in HTTP modules in `server/`. |
| Router | `server/router.js`, generic resource routing plus custom social publish route. |
| Auth | `server/password-auth.js`, one admin password and in-memory cookie sessions. |
| Validation | `server/validators.js`. |
| Persistence | `server/state-store.js` with JSON file at `data/app-state.json`. |
| Provider adapter | `server/facebook-publisher.js` for Facebook Page Graph API. |
| Deploy | Railway/Nixpacks; `npm run build`, then `npm start`. |

## Frontend Boundaries

Core files:

- `src/main.tsx` mounts the app.
- `src/app.tsx` owns hash-backed page state, bootstrap state, mutations, and
  workflow orchestration.
- `src/components.tsx` owns shell, sidebar, topbar, search, user card, and
  shared visual components.
- `src/action-workflow.tsx` owns Brand, Channel, Campaign, unified Content, and
  manual publish modal behavior.
- `src/*-page.tsx` files own the six primary operating pages.
- `src/content-operating-card.tsx` renders the shared Content action surface.
- `src/marketing-helpers.ts` owns Brand/Channel/Campaign labels, scheduling, and
  next-action helpers.
- `src/auth-gate.tsx` checks the cookie session and owns login/logout UI state.
- `src/operations-api.ts` owns API calls.
- `src/types.ts` owns shared frontend types.
- `src/styles.css` owns visual design and responsive layout.

The primary frontend reads Brand, Channel, Campaign, Content, and PublishLog.
Legacy calendar/social resources remain server-compatible but are not separate
primary UI workflows.

## Backend Boundaries

Core files:

- `server/index.js` starts the HTTP server and handles shutdown.
- `server/router.js` maps HTTP routes to store operations.
- `server/state-store.js` owns JSON state, mutations, derived bootstrap metrics,
  publish transitions, logs, and notifications.
- `server/validators.js` is the mutation boundary and allowed-field contract.
- `server/http-helpers.js` owns JSON parsing, auth, CORS, and error envelopes.
- `server/password-auth.js` owns password comparison, session tokens, cookie parsing, and cookie serialization.
- `server/static-files.js` serves built frontend assets and SPA fallback.
- `server/seed-*.js` seed initial state.
- `server/facebook-publisher.js` is the only real external provider adapter.

## Data Ownership

`AppStateStore` is the single write owner for `data/app-state.json`. It keeps an
in-memory state object and serializes writes through a promise chain with a
temp-file rename.

At initialization, normalization adds missing Brand/Channel relationships and
maps legacy records into the unified Content view without destructive migration.

Do not write `data/app-state.json` directly from other server modules. Add store
methods instead.

## API Boundary Rule

Unknown client input must pass through `validateMutation` before it enters the
store. New mutable fields must be added to both:

1. frontend type/interface and UI form, and
2. `server/validators.js` allowed fields/defaults.

`SocialPost.mediaUrl` is part of the social post API contract and must remain
allowed by backend validation when social composer media handling changes.

## External Provider Rule

Only Facebook Page publishing is wired to a real API. Other providers should
remain clearly marked as demo adapters until each has:

- OAuth/connect flow,
- app review or platform approval path,
- provider-specific publish API implementation,
- error mapping,
- integration tests with mocked provider responses.

## Production Readiness Boundary

Before public customer use, replace or add:

- multi-user auth/session storage and authorization,
- database-backed storage,
- workspace/team tenancy,
- media upload/object storage,
- background scheduler/worker,
- audit logs,
- stricter CORS and security headers,
- backup/restore.

## Validation Ladder

| Check | Command |
| --- | --- |
| TypeScript + build | `npm run build` |
| Backend integration smoke | `npm run test:api` |
| Harness matrix | `scripts/bin/harness-cli query matrix` |
| Deploy health | `curl -fsS https://web-production-2556d0.up.railway.app/api/health` |
