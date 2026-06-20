# Overview

## Current Behavior

Protected API routes use a static development bearer token. The public Railway
deployment has no user-facing password gate.

## Target Behavior

The backend accepts one admin password from `APP_ADMIN_PASSWORD`, creates an
HttpOnly cookie session after login, exposes login/logout/me endpoints, and
rejects unauthenticated access to every API route except health and auth.

## Affected Users

- Internal admin operating the public Railway deployment.

## Affected Product Docs

- `docs/product/api-contract.md`
- `docs/deployment.md`
- `docs/ARCHITECTURE.md`

## Non-Goals

- Frontend login UI.
- Database or persistent session storage.
- Multiple users, roles, password reset, or MFA.
- Removing the frontend's existing Authorization header.
- Redesigning product UI.
