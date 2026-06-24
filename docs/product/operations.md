# Operations Contract

## Core Loop

```text
Brand
  -> Content
  -> Schedule
  -> Manual Publish
  -> Published URL / Learning note
```

The app should help the operator answer three questions quickly:

1. What needs action now?
2. What is scheduled or queued?
3. What failed and how do I recover?

## Brand And Channel Operations

Brand stores positioning, audience, voice, tone, visual direction, CTA,
hashtags, do/don't guidance, checklist template, content pillars, prompt style,
and asset notes. Channel belongs to one Brand and stores platform/page
information plus manual posting guidance.

Connection status is informational in this release. The primary UI does not
pretend provider OAuth or automatic publishing is active.

## Campaign Operations

Campaigns belong to one Brand and store objective, key message, dates, status,
and notes. Campaign progress is derived from related Content statuses rather
than fake ROI or revenue.

## Content Workflow

Content items are stored under the `content` resource and are the single source
of truth for the full lifecycle:

- `brandId`
- `channelId`
- `campaignId`
- `contentType`
- `copy`
- `mediaUrl`
- `visualPromptNotes`
- `copyPromptNotes`
- `status`
- `scheduledAt`
- `publishedUrl`
- `learningNote`
- `reusable`
- `tags`
- `checklistItems` for backward-compatible records; the current composer no
  longer shows a manual self-check checklist.

Status moves through Brief, Draft, Review, Ready, Scheduled, then Published or
Failed. Each status exposes one useful next action. Calendar, campaign detail,
and publishing queue are filtered views of Content, not separate records.

The composer supports direct image/video upload for personal use. Uploaded
files are stored on the backend filesystem and the returned `/uploads/...` URL
is persisted as `mediaUrl`. Public customer use still needs durable object
storage such as S3, Cloudinary, or Supabase Storage.

## Manual Publishing

Scheduled Content can be opened in the manual publish flow. The operator can
copy the caption, open the media URL, open the Channel URL, paste the published
URL, and mark the Content Published or Failed. This updates Content and appends
a PublishLog.

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

## Legacy Provider Boundary

The existing `social-posts` and provider publish routes remain for backward
compatibility and existing tests. They are not used by the six-area primary UI.
Authentication and Facebook provider behavior were not changed by US-013.

## Next Operational Slice

- Replace local filesystem uploads with durable object storage before customer
  use.
- Add durable database persistence before customer use.
- Add provider OAuth and automatic publishing only after manual operations are
  stable.
