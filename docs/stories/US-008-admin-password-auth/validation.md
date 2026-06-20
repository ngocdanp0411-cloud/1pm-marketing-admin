# Validation

## Proof Strategy

Use backend integration tests against a real spawned Node server. Verify public
routes, wrong password, successful cookie creation, authenticated API access,
logout revocation, secure production cookie, and missing production config.

## Test Plan

| Layer | Cases |
| --- | --- |
| Unit | Timing-safe comparison and cookie parser are exercised through API flows. |
| Integration | Login, me, protected CRUD, logout, missing config. |
| E2E | Deferred to Task 1B frontend login. |
| Platform | Production cookie includes `Secure`. |
| Performance | Not required for one internal admin. |
| Logs/Audit | Ensure password and token are absent from responses/errors. |

## Fixtures

- Admin password: test-only environment value.
- Temporary JSON state file.
- Spawned Node server.

## Commands

```text
npm run build
npm run test:api
```

## Acceptance Evidence

- `npm run build` passed on 2026-06-20.
- `npm run test:api` passed 3/3 on 2026-06-20.
- Integration proof covers public service metadata and auth routes, unauthenticated
  status, wrong password, login cookie flags, authenticated bootstrap access,
  protected CRUD, logout revocation, credential-aware local CORS, and missing
  production configuration.
- Auth endpoints execute before the protected-route guard and use the standard
  `{ "ok": true, "data": ... }` response envelope.
- Pre-deploy production check on 2026-06-20 returned the retired
  `Missing or invalid bearer token.` response for `/api/auth/me`, proving the
  active Railway artifact was older than `origin/main`. Production cookie-auth
  verification remains required immediately after the next `railway up`.
