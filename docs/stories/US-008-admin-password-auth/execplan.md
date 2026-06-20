# Exec Plan

## Goal

Add a backend-only password gate for the public internal admin app.

## Scope

In scope:

- Environment configuration.
- Cookie-session auth helper.
- Login, logout, and me routes.
- API protection.
- Integration tests and docs.

Out of scope:

- Frontend login UI.
- Database migration.
- Product UI changes.
- Multi-user authorization.

## Risk Classification

Risk flags:

- Auth.
- Authorization.
- Audit/security.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Auth.
- Authorization.
- Audit/security.

## Work Phases

1. Confirm current auth boundary.
2. Define cookie/session contract.
3. Add integration tests.
4. Implement helper and routes.
5. Run build and API tests.
6. Update Harness proof and trace.

## Stop Conditions

Pause for human confirmation if database persistence, multi-user roles, or
frontend login scope becomes necessary.
