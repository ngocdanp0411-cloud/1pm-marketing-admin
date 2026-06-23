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
- Future use case: agency or SaaS-style public customer version after multi-user
  auth, database, tenancy, billing, and provider app review are added.

## Current Navigation

| Page | Contract |
| --- | --- |
| Hôm nay | Show the next operational work grouped by Brief/Draft, Review, Ready, Scheduled today, overdue, and Failed. |
| Nội dung | Create, filter, edit, delete, and advance one unified Content library. |
| Lịch | Show scheduled Content only, with month and agenda views opening the same editor. |
| Chiến dịch | Manage Brand-scoped campaigns, related content, and progress by status. |
| Brand | Manage reusable Brand context, checklist, content pillars, prompts, and channels. |
| Kênh đăng | Manage Brand-scoped pages and complete manual publishing from the unified Content queue. |

The primary operator UI uses simple Vietnamese labels. Demo-only AI Generator,
Local Marketing, fake Analytics, and fake Settings surfaces are no longer in
the main navigation.

`Cài đặt` is an auxiliary sidebar item below the operating menu. It only shows
Workspace, Account, and Interface basics; team management, billing, fake
security tabs, and demo integrations are intentionally absent.

## Product Truth Rules

- Do not label metrics as live if they are manual or demo estimates.
- The primary workflow is manual publishing. Connection status must say
  `Chưa kết nối`, `Sắp có`, or `Kết nối sau`.
- Legacy Facebook Page Graph API code remains available but is not presented as
  the default operating workflow.
- JSON store is allowed for personal v1 and demo deploys, but not for public
  customer data.

## Public Launch Blockers

- Multi-user authentication/authorization and account recovery.
- Shared durable session storage for multi-instance deployment.
- Workspace/user isolation.
- PostgreSQL or another durable production datastore.
- Real media storage and upload pipeline.
- Background scheduler/worker for timed posts.
- OAuth/app-review-backed integrations per social platform.
- Security review, audit logging, and backup/restore.
