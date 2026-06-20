# Exec Plan

## Goal

Connect the existing React dashboard to Task 1A cookie authentication.

## Scope

In scope:

- Auth status check.
- Login form and loading/error states.
- Cookie-aware API calls.
- Header logout.

Out of scope:

- Dashboard redesign.
- Backend auth changes unless integration proves necessary.
- Database or multi-user auth.

## Risk Classification

Risk flags:

- Auth.
- Authorization.
- Public contracts.
- Existing behavior.
- Weak proof.

Hard gates:

- Auth.
- Authorization.

## Work Phases

1. Read frontend bootstrap and shell boundaries.
2. Add auth API methods.
3. Add auth gate/login screen.
4. Add logout control.
5. Build and validate against backend.
6. Update Harness evidence.

## Stop Conditions

Pause if frontend requires storing the admin password or exposing a server
secret.
