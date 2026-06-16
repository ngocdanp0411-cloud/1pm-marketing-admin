# US-002 Operations API And JSON Store

## Status

implemented

## Lane

normal

## Product Contract

The Node backend exposes health, bootstrap, CRUD resources, auth guard, JSON
validation, and JSON file persistence for personal v1 operations.

## Relevant Product Docs

- `docs/product/api-contract.md`
- `docs/ARCHITECTURE.md`

## Acceptance Criteria

- `GET /api/health` works without auth.
- Other `/api/*` routes require `Authorization: Bearer <token>`.
- `GET /api/bootstrap` returns workspace, user, metrics, and app collections.
- Campaign CRUD supports create, patch, delete.
- Invalid mutation fields are rejected.
- State persists to `data/app-state.json` or `DATA_FILE_PATH`.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | none currently |
| Integration | `npm run test:api` |
| E2E | none currently |
| Platform | `npm run build` for served frontend contract |
| Release | production health check |

## Evidence

- `server/api-smoke.test.js`
- `npm run test:api`
