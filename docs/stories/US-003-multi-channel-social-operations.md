# US-003 Multi-Channel Social Operations

## Status

implemented

## Lane

normal

## Product Contract

The Social Posting module supports channel integration health, queued posts,
publish now/retry, publish status transitions, publish logs, and notifications.
Facebook Page can publish through the Graph API when credentials are configured;
other providers are demo adapters.

## Relevant Product Docs

- `docs/product/operations.md`
- `docs/product/api-contract.md`
- `docs/deployment.md`

## Acceptance Criteria

- Bootstrap returns integrations, publish logs, notifications, and social queue.
- Publishing against a disconnected/unhealthy channel marks the post failed,
  appends a failed log, and creates warning notification.
- Publishing against a connected demo channel marks post published and creates
  demo external post ID.
- Facebook Page publishing sends copy to `/{page-id}/feed` with page token when
  configured.
- Publish logs are read-only through public API.
- Notifications can only update status.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | none currently |
| Integration | `npm run test:api` |
| E2E | planned browser workflow test |
| Platform | production env vars for Facebook only when real publish is needed |
| Release | manual publish smoke before using real Page |

## Evidence

- `server/api-smoke.test.js`
- `npm run test:api`

## Gaps

- No background scheduler.
- No media upload.
- No real OAuth/app-review adapters for Instagram, Threads, TikTok, LinkedIn,
  or X.
