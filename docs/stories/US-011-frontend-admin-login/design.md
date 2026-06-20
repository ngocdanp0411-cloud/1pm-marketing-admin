# Design

## Domain Model

Frontend auth state has three states: checking, authenticated, and
unauthenticated.

## Application Flow

1. App mounts and calls `GET /api/auth/me` with same-origin credentials.
2. Checking state shows a neutral loading screen.
3. Unauthenticated state shows password form.
4. Login posts the password and transitions to dashboard on success.
5. Dashboard API requests include cookies and no frontend secret.
6. Logout posts to the backend and returns to the login screen.

## Interface Contract

Frontend API helpers:

- `fetchAuthStatus()`
- `loginWithPassword(password)`
- `logoutSession()`

## Data Model

No persistent frontend auth storage. Password remains in component state only
until login completes.

## UI / Platform Impact

One simple login surface and one Logout button in the existing topbar.

## Observability

Login errors are shown to the user without exposing configuration or secrets.

## Alternatives Considered

1. Store auth state in localStorage: rejected because backend cookie is source
   of truth.
2. Add a routing library: unnecessary for this bounded gate.
