# Product Docs

These files are the current product contract for 1PM Marketing Admin. Keep them
smaller than a monolithic spec. Update the affected file whenever behavior
changes.

## Domain Files

- `overview.md` - product purpose, user, module map, and current boundaries.
- `operations.md` - operational workflow for campaign/content/social publishing.
- `api-contract.md` - backend API resources, auth shape, and persistence rules.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create a story packet under `docs/stories/`.
3. Update durable proof status with `scripts/bin/harness-cli story add` or
   `scripts/bin/harness-cli story update`.
4. Record a decision if architecture, scope, risk, API shape, data ownership, or
   validation requirements change meaningfully.
