# Overview

## Current Behavior

The backend has an admin password cookie session, but the React app immediately
loads the dashboard and protected bootstrap endpoint. Unauthenticated browser
users therefore see fallback data instead of a login flow.

## Target Behavior

The app checks `/api/auth/me` before rendering the dashboard. Authenticated
users see the existing dashboard; unauthenticated users see a small password
login screen. Logout returns the user to that login screen.

## Affected Users

- Internal admin operating the 1PM dashboard.

## Affected Product Docs

- `docs/product/api-contract.md`
- `docs/ARCHITECTURE.md`

## Non-Goals

- Dashboard redesign.
- Backend auth redesign.
- Password storage in browser state beyond the active form.
- Database migration, user accounts, roles, password reset, or MFA.
