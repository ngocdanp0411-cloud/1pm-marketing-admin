# Validation

## Proof Strategy

Typecheck/build the React app and run backend integration tests to ensure the
cookie contract remains intact.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | none currently |
| Integration | Task 1A API cookie tests |
| E2E | Manual login/logout browser smoke after deploy |
| Platform | `npm run build` |
| Performance | not required |
| Logs/Audit | no password or secret persisted in browser storage |

## Fixtures

- Local `APP_ADMIN_PASSWORD`.

## Commands

```text
npm run build
npm run test:api
```

## Acceptance Evidence

- `npm run build` passed on 2026-06-19.
- `npm run test:api` passed 3/3 on 2026-06-19.
- Local browser smoke confirmed the unauthenticated login screen renders before
  the dashboard.
- Local cookie smoke confirmed login, `/api/auth/me`, and protected bootstrap.
