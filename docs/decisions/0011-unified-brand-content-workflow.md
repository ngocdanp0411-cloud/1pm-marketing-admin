# 0011 Unified Brand Content Workflow

Date: 2026-06-21

## Status

Accepted

## Context

The dashboard modeled content planning and social posting as separate flows.
That duplicated copy, media, status, scheduling, and publishing state and made
the personal operating workflow difficult to understand.

## Decision

Brand is the top-level operating context. Channel and Campaign belong to a
Brand. One Content entity owns the lifecycle from Brief through Published or
Failed. Calendar, campaign progress, and the manual publishing queue are views
of Content rather than independent records.

Legacy social and calendar resources remain available for compatibility but
are not used by the primary UI. Authentication and provider APIs do not change.

## Alternatives Considered

1. Synchronize separate Content and SocialPost resources.
2. Introduce a relational database and migration immediately.

## Consequences

Positive:

- One source of truth for copy, media, schedule, checklist, and publishing.
- Clear next actions and fewer top-level modules.
- Brand context becomes reusable across all content.

Tradeoffs:

- Existing JSON records require normalization.
- Automatic provider publishing remains out of scope.

## Follow-Up

- Replace JSON with a durable database before public multi-customer use.
- Add object storage and background scheduling later.

