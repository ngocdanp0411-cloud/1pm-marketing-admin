# 0008 Personal V1 Single-Service JSON Store

Date: 2026-06-16

## Status

Accepted

## Context

1PM is currently for personal operation and demo usage. The app already deploys
as one Railway service with a Node backend serving API and built frontend. A
simple JSON store keeps iteration speed high while the product loop is still
being shaped.

## Decision

Keep personal v1 on a single Railway Node service with JSON file persistence.
Use docs and UI copy to make the boundary explicit: this is not public
customer-grade storage or auth.

## Alternatives Considered

1. Move immediately to PostgreSQL and auth.
2. Keep frontend-only mock data.

## Consequences

Positive:

- Fast iteration.
- Simple deploy.
- API behavior can still be tested with `node --test`.

Tradeoffs:

- No tenant isolation.
- No strong concurrent write guarantees beyond serialized process writes.
- Not suitable for customer data.

## Follow-Up

- Add PostgreSQL before public customer/team use.
- Add real auth/session before sensitive data or public access.
