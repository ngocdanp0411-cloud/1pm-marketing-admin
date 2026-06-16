# Product Overview

## Purpose

1PM Marketing Admin is a web dashboard for a solo operator or small team to run
marketing work from one place: plan content, manage campaigns, schedule posts,
check operational health, and see publishing failures quickly.

The product should feel like an operations cockpit, not a marketing landing
page. Screens should prioritize dense but readable dashboards, clear action
states, and fast recovery from failed work.

## Primary User

- Owner/admin: Ngọc Dân, `ngocdanp0411@gmail.com`.
- Initial use case: personal project operations before public customer launch.
- Future use case: agency or SaaS-style public customer version after auth,
  database, tenancy, billing, and provider app review are added.

## Current Navigation

| Page | Contract |
| --- | --- |
| Overview | Show live operational counts, campaign performance, schedule, content pipeline, channel mix, operation alerts, and marketing health. |
| Content Studio | Manage content items across workflow stages and edit through action workflow modal. |
| Content Calendar | Show scheduled work by date with selected-day detail and approval status. |
| AI Generator | Provide UI for prompt templates, copy/image/video/strategy generation, and generated asset cards. |
| Campaigns | CRUD campaign rows, inspect selected campaign, duplicate, edit, and delete. |
| Analytics | Show marketing analytics surfaces; non-live metrics must stay honest as estimates. |
| Brand Assets | Manage brand asset library and brand kit surfaces. |
| Social Posting | Compose posts, manage channel integrations, queue publishing, publish now/retry, and view publish logs. |
| Local Marketing | Show local listing/review/SEO surface; currently demo/manual. |
| Settings | Workspace settings, integrations, notifications, and user/admin preferences. |

## Language

The UI supports English and Vietnamese through the language toggle in the
topbar. The selected language is stored in `localStorage` under
`onepm-language`.

## Product Truth Rules

- Do not label metrics as live if they are manual or demo estimates.
- Social publishing may be claimed as real only for Facebook Page when Graph API
  credentials are configured.
- Instagram, Threads, TikTok, LinkedIn, and X are demo adapters until OAuth,
  app review, and provider-specific publish APIs exist.
- JSON store is allowed for personal v1 and demo deploys, but not for public
  customer data.

## Public Launch Blockers

- Real authentication and session management.
- Workspace/user isolation.
- PostgreSQL or another durable production datastore.
- Real media storage and upload pipeline.
- Background scheduler/worker for timed posts.
- OAuth/app-review-backed integrations per social platform.
- Security review, audit logging, and backup/restore.
