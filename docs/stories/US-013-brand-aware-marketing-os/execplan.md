# Exec Plan

## Goal

Turn the dashboard into a simple brand-aware marketing content operating
system with one content workflow from brief through manual publishing.

## Scope

In scope:

- Brand, channel, campaign, content, checklist, and manual publish records.
- Six primary Vietnamese navigation areas.
- Brand-aware composer, operational today view, content library, calendar,
  campaign progress, brand management, and manual publishing queue.
- Backward-compatible normalization of existing JSON data.

Out of scope:

- Authentication changes.
- AI generation APIs.
- Social provider publishing APIs.
- Database migration or multi-tenant behavior.

## Risk Classification

Risk flags:

- Data model.
- Public contracts.
- Existing behavior.
- Weak proof.
- Multi-domain.

Hard gates:

- Preserve existing production authentication.
- Preserve readable existing JSON data without destructive migration.

## Work Phases

1. Record product and architecture decision.
2. Extend backend resources and normalize old records.
3. Replace dashboard navigation and page composition.
4. Implement unified content and manual publishing workflows.
5. Add integration proof and browser validation.
6. Update Harness evidence and commit.

## Stop Conditions

Pause for human confirmation if:

- Existing content must be deleted rather than normalized.
- Authentication or provider publishing must change.
- Validation requirements need to be weakened.

