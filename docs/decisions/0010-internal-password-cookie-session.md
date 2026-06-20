# 0010 Internal Password Cookie Session

Date: 2026-06-19

## Status

Accepted

## Context

The Railway deployment is public but currently intended for one internal admin.
It needs a small password gate before additional product work. The current app
has no database-backed identity system.

## Decision

Use `APP_ADMIN_PASSWORD` for one admin password and opaque random server-side
session tokens delivered in an HttpOnly, SameSite=Lax, Path=/ cookie. Add
`Secure` only in production. Store sessions in memory for the current
single-instance deployment.

## Alternatives Considered

1. JWT.
2. Signed stateless cookie.
3. Database-backed sessions.

## Consequences

Positive:

- Password never reaches frontend JavaScript after login.
- Logout can revoke the current token immediately.
- Small isolated backend change.

Tradeoffs:

- Sessions are lost on server restart.
- Multi-instance deployment would require shared session storage.
- Task 1B is required before the frontend can authenticate.

## Follow-Up

- Build frontend login UI in Task 1B.
- Move sessions to shared durable storage if Railway scales beyond one instance.
