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
- `copy`
- `mediaUrl`
- `visualNotes`
- `copyNotes`
- `scheduledFor`
- `tags`
- `source`

The Content Studio page groups items into workflow columns. Review and publish
states may be updated through row actions and the action workflow modal.

Manual content is the primary creation path. An operator can paste copy created
elsewhere, add a public image/video URL, keep visual and copy prompts as notes,
assign a campaign, set Draft/Ready/Scheduled/Published status, and reopen the
item from the library or calendar. Items with `scheduledFor` appear in the
Content Calendar.

Binary file upload is not implemented yet because the app has no object
storage. The composer shows an upload placeholder and persists asset URLs in
the JSON backend.

## Social Posting

Social posts are stored under `social-posts`. Current publishing fields:

- `status`
- `publishStatus`
- `scheduledFor`
- `copy`
- `mediaUrl`
- `campaignId`
- `lastPublishError`
- `publishedAt`
- `externalPostId`

Current composer requirements:

- Text input.
- Image/media URL input persisted through the backend.
- Schedule datetime input.

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

- Add uploaded asset references for real media files.
- Add a scheduler/worker loop.
- Retry failed posts with clear error history.
- Add Facebook image post support, not just feed text.
