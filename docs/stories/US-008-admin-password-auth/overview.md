# Overview

## Current Behavior

The repository uses `APP_ADMIN_PASSWORD`, an HttpOnly cookie session, and a
frontend login gate. Production must be deployed and verified through the
documented Railway release path so an older artifact cannot silently preserve
the retired bearer-token middleware.

## Target Behavior

The backend accepts one admin password from `APP_ADMIN_PASSWORD`, creates an
HttpOnly cookie session after login, exposes login/logout/me endpoints, and
rejects unauthenticated access to every API route except harmless service
metadata, health, and auth.

## Affected Users

- Internal admin operating the public Railway deployment.

## Affected Product Docs

- `docs/product/api-contract.md`
- `docs/deployment.md`
- `docs/ARCHITECTURE.md`

## Non-Goals

- Database or persistent session storage.
- Multiple users, roles, password reset, or MFA.
- Redesigning product UI.
