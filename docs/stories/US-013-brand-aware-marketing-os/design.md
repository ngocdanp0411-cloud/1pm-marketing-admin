# Design

## Domain Model

- Brand owns brand context and checklist templates.
- Channel belongs to one Brand.
- Campaign belongs to one Brand.
- Content belongs to a Brand, optionally a Channel and Campaign.
- PublishLog references Content and Channel.

Content status is one of Brief, Draft, Review, Ready, Scheduled, Published, or
Failed. UI actions advance the same record rather than creating social-post or
calendar duplicates.

## Application Flow

The bootstrap endpoint returns brands, channels, campaigns, content, and
publish logs. Generic CRUD remains the mutation boundary. Manual publishing
updates Content with a published URL and creates a PublishLog.

## Interface Contract

New generic resources:

- `/api/brands`
- `/api/channels`

Existing `/api/content` gains brand, channel, checklist, publishing, and
learning fields. Existing legacy resources remain readable for compatibility
but leave the primary UI.

## Data Model

The JSON store remains the personal-v1 persistence layer. `normalizeState`
adds missing collections and maps older content records to the unified shape.
No destructive migration runs.

## UI / Platform Impact

Primary navigation becomes Hôm nay, Nội dung, Lịch, Chiến dịch, Brand, and
Kênh đăng. The composer shows Brand Context and filters Channels/Campaigns by
the selected Brand. Smaller screens use list/calendar agenda layouts without a
wide calendar table.

## Observability

Existing API error envelopes and Harness traces remain the proof surfaces.

## Alternatives Considered

1. Keep separate Content and SocialPost records. Rejected because it duplicates
   scheduling, status, copy, media, and publishing state.
2. Replace JSON with a database now. Rejected because personal v1 explicitly
   retains JSON persistence.

