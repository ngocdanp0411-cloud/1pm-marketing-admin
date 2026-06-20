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

- `npm run build` passed on 2026-06-19.
- `npm run test:api` passed 3/3 on 2026-06-19.
- Integration proof covers wrong password, login cookie flags, authenticated
  access, legacy bearer rejection, logout revocation, and missing production
  configuration.
