# US-001 Dashboard Shell

## Status

implemented

## Lane

normal

## Product Contract

The browser app provides a 10-page marketing command center with a fixed
sidebar, topbar search, user/workspace context, responsive layout, and
Vietnamese/English language toggle.

## Relevant Product Docs

- `docs/product/overview.md`
- `docs/ARCHITECTURE.md`

## Acceptance Criteria

- Sidebar can navigate to Overview, Content Studio, Content Calendar, AI
  Generator, Campaigns, Analytics, Brand Assets, Social Posting, Local
  Marketing, and Settings.
- Topbar search can find and navigate to pages.
- Language toggle switches Vietnamese/English strings and persists choice.
- Desktop layout has no obvious text overlap or clipped primary controls.
- Mobile/tablet layout avoids horizontal page overflow.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | none currently |
| Integration | none currently |
| E2E | planned Playwright/UI smoke |
| Platform | `npm run build` |
| Release | production visual/manual check |

## Evidence

- `npm run build` passes.
- Manual browser fixes were applied for overlapping topbar, card overflow, and
  social composer layout.
