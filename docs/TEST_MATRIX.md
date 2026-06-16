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
| US-001 | Marketing dashboard shell renders all 10 pages with responsive UI and language toggle. | no | no | no | no | implemented | `npm run build`; manual browser review during UI work. |
| US-002 | Backend API supports health, bootstrap, auth guard, generic CRUD, and JSON persistence. | no | yes | no | no | implemented | `npm run test:api` first smoke test. |
| US-003 | Multi-channel social operations support integrations, publish states, publish logs, notifications, demo adapters, and Facebook Page Graph API publishing when configured. | no | yes | no | no | implemented | `npm run test:api`; `server/api-smoke.test.js`. |
| US-004 | Single Railway service builds frontend and serves API/static assets in production. | no | no | no | yes | implemented | `npm run build`; deployed URL health check in `docs/deployment.md`. |
| US-005 | Social composer supports text, image/media URL, and schedule input end-to-end. | no | no | no | no | in_progress | Frontend UI exists; backend persistence for `mediaUrl` missing. |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers deploy/runtime behavior that cannot be proven in lower
  layers.
- A story can be implemented without every proof column if the story packet
  explains why.
