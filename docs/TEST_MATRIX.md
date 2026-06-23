# Test Matrix

This file maps product behavior to proof. Durable proof rows should also be
mirrored through `scripts/bin/harness-cli story add/update` so agents can query
the matrix mechanically.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| US-001 | Legacy ten-page dashboard shell. | no | no | no | yes | retired | Superseded by US-013 six-area operating workflow. |
| US-002 | Backend API supports health, bootstrap, auth guard, generic CRUD, and JSON persistence. | no | yes | no | no | implemented | `npm run test:api` first smoke test. |
| US-003 | Multi-channel social operations support integrations, publish states, publish logs, notifications, demo adapters, and Facebook Page Graph API publishing when configured. | no | yes | no | no | implemented | `npm run test:api`; `server/api-smoke.test.js`. |
| US-004 | Single Railway service builds frontend and serves API/static assets in production through GitHub Auto Deploy from `main`. | no | no | no | yes | implemented | `npm run build`; Railway service `web` source/branch checklist and production verification in `docs/deployment.md`. |
| US-005 | Social composer supports text, image/media URL, and schedule input end-to-end. | no | yes | no | yes | implemented | `npm run build`; `npm run test:api` with media URL assertions. |
| US-008 | Backend uses `APP_ADMIN_PASSWORD` and HttpOnly cookie sessions to protect all non-public API routes while keeping service metadata, health, and auth lifecycle routes public. | no | yes | no | yes | implemented | `npm run build`; `npm run test:api` 3/3 covers public auth ordering, cookie login/logout, credential-aware local CORS, and protected bootstrap/CRUD access. |
| US-011 | Frontend checks auth before rendering, provides password login, sends cookie credentials, and logs out from the topbar. | no | yes | no | yes | implemented | `npm run build`; backend auth tests 3/3; local browser login-screen smoke. |
| US-012 | Manual content composer persists pasted copy, asset URL, notes, campaign, schedule, status, and tags. | no | yes | no | yes | changed | Extended and unified under Brand-aware US-013. |
| US-013 | Six-area Vietnamese Marketing OS uses Brand/Channel/Campaign-aware unified Content for next actions, library, calendar, campaigns, and manual publishing, with Settings kept as a simple auxiliary page. | no | yes | yes | yes | implemented | `npm run build`; `npm run test:api` 3/3; browser smoke for navigation, composer Brand Context, responsive layout, manual publish modal, and no demo team/alert seed data. |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers deploy/runtime behavior that cannot be proven in lower
  layers.
- A story can be implemented without every proof column if the story packet
  explains why.
