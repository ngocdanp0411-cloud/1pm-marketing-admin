# Overview

## Current Behavior

The app exposes ten top-level modules. Content Studio and Social Posting create
separate records for the same marketing lifecycle, while several demo surfaces
look operational.

## Target Behavior

The app exposes six Vietnamese operating areas and one brand-aware Content
workflow:

```text
Brand -> Content -> Checklist -> Schedule -> Manual Publish -> Learning
```

## Affected Users

- Personal owner/admin operating multiple brands and pages.

## Affected Product Docs

- `docs/product/overview.md`
- `docs/product/operations.md`
- `docs/product/api-contract.md`
- `docs/ARCHITECTURE.md`
- `docs/TEST_MATRIX.md`

## Non-Goals

- Multi-user roles or tenancy.
- AI generation.
- Automatic social publishing.
- Real media upload.

