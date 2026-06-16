# Operations Contract

## Core Loop

```text
Campaign or idea
  -> content item
  -> calendar/social post
  -> approval or queued state
  -> publish attempt
  -> publish log + notification
  -> dashboard/analytics feedback
```

The app should help the operator answer three questions quickly:

1. What needs action now?
2. What is scheduled or queued?
3. What failed and how do I recover?

## Campaign Operations

Campaigns are stored under the `campaigns` resource. Required fields are
`name` and `channel`. The UI supports create, edit, duplicate, delete, table
selection, and detail inspection.

Campaign rows are intentionally string-shaped because the current API keeps a
simple JSON store and avoids schema migration complexity. Future database work
should normalize money, dates, and metric fields.

## Content Workflow

Content items are stored under the `content` resource with workflow fields:

- `stage`
- `status`
- `owner`
- `channel`
- `campaignId`
- `summary`

The Content Studio page groups items into workflow columns. Review and publish
states may be updated through row actions and the action workflow modal.

## Social Posting

Social posts are stored under `social-posts`. Current publishing fields:

- `status`
- `publishStatus`
- `scheduledFor`
- `copy`
- `campaignId`
- `lastPublishError`
- `publishedAt`
- `externalPostId`

Current composer requirements:

- Text input.
- Image/media URL input in the frontend.
- Schedule datetime input.

Known gap: backend `server/validators.js` currently does not allow `mediaUrl`,
so media URL is a product intent that still needs backend persistence.

## Integration Health

Integrations are stored under `integrations`. Health is determined from:

- `status`: connected, needs setup, attention, disconnected.
- `tokenHealth`: healthy, missing, expires soon, invalid.
- `permissions`.
- `pageId`.

A publish attempt is allowed to succeed only when the matching integration is
connected and token health is healthy. Otherwise the post becomes `Failed`, a
publish log is appended, and a warning notification is created.

## Publish Logs And Notifications

Publish logs are append-only through the public API and read-only for clients.
Notifications can only be patched by `status`. This prevents UI clients from
rewriting historical publish evidence.

## Current Provider Reality

| Provider | Current behavior |
| --- | --- |
| Facebook Page | Can call real Graph API with configured page ID and page access token. |
| Instagram | Demo adapter only. |
| Threads | Demo adapter only. |
| TikTok | Demo adapter only. |
| LinkedIn | Demo adapter only. |
| X | Demo adapter only. |

## Next Operational Slice

The next most valuable slice is to make scheduled publishing real:

- Persist media URL or uploaded asset references.
- Add a scheduler/worker loop.
- Retry failed posts with clear error history.
- Add Facebook image post support, not just feed text.
