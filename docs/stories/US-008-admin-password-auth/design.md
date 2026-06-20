# Design

## Domain Model

One configured admin password authenticates one internal operator. Successful
logins create opaque random session tokens stored in server memory.

## Application Flow

1. Login parses `{ "password": "..." }`.
2. Backend checks `APP_ADMIN_PASSWORD` using a timing-safe digest comparison.
3. On success, backend stores a random session token and sets an HttpOnly
   cookie.
4. Protected routes require a valid session cookie.
5. Logout deletes the server-side token and expires the cookie.

## Interface Contract

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health` stays public.
- Every other `/api/*` route requires a valid cookie session.

Wrong password returns `401`. Missing production configuration returns a clear
`503 AUTH_NOT_CONFIGURED` response for login and protected routes.

## Data Model

No database changes. Sessions live in an in-memory `Set` for the current
single-instance deployment.

## UI / Platform Impact

No UI changes in Task 1A. Existing frontend data requests will receive `401`
until Task 1B adds the login flow.

## Observability

Authentication failures use structured API error codes. Passwords and session
tokens must never be logged.

## Alternatives Considered

1. Signed stateless cookie: harder to revoke immediately on logout.
2. JWT: unnecessary for one internal admin and this narrow task.
3. Database-backed sessions: deferred until database migration.
