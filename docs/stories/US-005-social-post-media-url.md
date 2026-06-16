# US-005 Social Post Media URL Persistence

## Status

implemented

## Lane

normal

## Product Contract

The social composer supports the operational minimum for a post: text,
image/media URL, and schedule time. The backend persists `mediaUrl` through
create, update, list, and bootstrap flows.

## Relevant Product Docs

- `docs/product/operations.md`
- `docs/product/api-contract.md`

## Acceptance Criteria

- `POST /api/social-posts` accepts `mediaUrl`.
- `PATCH /api/social-posts/:id` accepts `mediaUrl`.
- Bootstrap/list flows return social posts with `mediaUrl`.
- Composer-created posts preserve media URL after refresh.
- API tests cover create/update with `mediaUrl`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | none expected |
| Integration | `npm run test:api` with media URL assertions |
| E2E | optional browser composer smoke |
| Platform | `npm run build` |
| Release | production smoke after deploy |

## Harness Delta

Backfilled because documentation review found frontend/backend drift.

## Evidence

- `npm run build`
- `npm run test:api`
