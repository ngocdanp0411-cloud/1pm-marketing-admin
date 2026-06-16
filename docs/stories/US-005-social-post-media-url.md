# US-005 Social Post Media URL Persistence

## Status

in_progress

## Lane

normal

## Product Contract

The social composer should support the operational minimum for a post: text,
image/media URL, and schedule time. The UI currently captures these fields, but
the backend must persist `mediaUrl` for the flow to be end-to-end.

## Relevant Product Docs

- `docs/product/operations.md`
- `docs/product/api-contract.md`

## Acceptance Criteria

- `POST /api/social-posts` accepts `mediaUrl`.
- `PATCH /api/social-posts/:id` accepts `mediaUrl`.
- Bootstrap returns social posts with `mediaUrl`.
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
