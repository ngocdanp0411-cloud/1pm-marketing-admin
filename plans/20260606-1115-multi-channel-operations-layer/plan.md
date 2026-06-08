# Multi-Channel Operations Layer Plan

Status: implemented, verification in progress  
Created: 2026-06-06  
Scope: personal-use v1 before public customer launch

## Codebase Context

- Frontend: React + Vite + TypeScript in `src/`.
- Backend: Node stdlib API in `server/`, JSON store in `data/app-state.json`.
- Existing API resources: campaigns, content, calendar, social-posts.
- Existing UI already has Social Posting, Settings > Integrations, Analytics, Local Marketing, Action Workflow modal.
- Current gap: UI looks like operations product, but social channel connection, publishing states, publish log, notification and integration health are not real product flows yet.

## Expected Output

At the end of this implementation, the user should see:

- Multi-channel connection cards for Instagram, Threads, TikTok, Facebook Page, LinkedIn, and X.
- Social post workflow with channel-specific readiness, `Publish now`, retry, and clear states.
- Publish log panel showing publish attempts and outcomes.
- Notification panel for failed publish, pending approval, and channel reconnect.
- Honest module labels for non-real areas: manual estimate / coming later.
- Backend JSON store support for integrations, publish logs, notifications and social publish status updates.

## Acceptance Criteria

- `GET /api/bootstrap` returns `integrations`, `publishLogs`, `notifications`, and social queue status fields.
- UI can mark a channel as connected/disconnected in demo mode using JSON store.
- UI can run `Publish now` on a social post:
  - If channel is connected: post status becomes `Published`, publish log appended, success notification shown.
  - If channel is disconnected/needs setup: post status becomes `Failed`, error shown, publish log appended.
- UI can retry a failed post after channel is connected.
- Social Posting page shows queue, publish status, connection health, and recent publish log without text overlap.
- Settings > Integrations shows per-channel status, required permissions, and setup notes.
- Local Marketing and ROI/ROAS surfaces are labeled as deferred/manual estimate instead of pretending live attribution.
- Existing CRUD for campaigns, content, calendar, and social-posts remains compatible.
- `npm run build` passes.
- `npm run test:api` passes.

## Scope Boundary

In scope:

- Multi-channel data model and demo operational workflow.
- Internal JSON-store publish simulation and logging.
- UI/UX changes to focus the product on real operation readiness.
- Facebook/Instagram/Threads/TikTok/LinkedIn/X connection status as product surfaces.

Out of scope this round:

- Real OAuth for Meta/TikTok/LinkedIn/X.
- Real API publishing to external networks.
- App Review / Business Verification.
- Real media binary upload to cloud storage.
- Public customer multi-tenant accounts.
- Billing/subscriptions.
- PostgreSQL migration.

## Non-Negotiable Constraints

- Keep React + Vite + TypeScript frontend.
- Keep Node stdlib backend and JSON store.
- Preserve current deploy shape: one Railway service serving API and built frontend.
- No fake "real API connected" copy. Demo mode must be explicit.
- Do not break existing public endpoints.
- Keep implementation scoped to existing files unless a small helper module clearly reduces complexity.

## Touchpoints

Frontend:

- `src/types.ts`
- `src/operations-api.ts`
- `src/app.tsx`
- `src/action-workflow.tsx`
- `src/styles.css`
- `src/components.tsx`

Backend:

- `server/router.js`
- `server/state-store.js`
- `server/validators.js`
- `server/seed-state.js`
- `server/seed-supporting-records.js`
- `server/api-smoke.test.js`
- `server/README.md`

Docs:

- `docs/deployment.md`
- `plans/reports/marketing-research-20260606-core-functions-audit.md` if final decisions change.

## Implementation Phases

### Phase 1: Data Model + API

Status: complete

- Add typed integrations, publish logs and notifications.
- Extend social post with `publishStatus`, `lastPublishError`, `publishedAt`, `externalPostId`.
- Add resource support:
  - `GET/PATCH /api/integrations/:id`
  - `GET /api/publish-logs`
  - `GET/PATCH /api/notifications/:id`
  - `POST /api/social-posts/:id/publish`
- Keep existing generic CRUD unchanged.

### Phase 2: UI Product Focus

Status: complete

- Social Posting:
  - show selected channels: Instagram, Threads, TikTok, Facebook Page, LinkedIn, X.
  - queue cards include publish status, channel readiness, publish now/retry.
  - add Publish Log panel.
- Settings > Integrations:
  - replace generic integrations with real channel cards.
  - show demo connect/disconnect, permissions, token health.
- Overview/Analytics:
  - make live metrics operational: connected channels, scheduled posts, failed publishes.
  - label ROI/ROAS as manual estimate.

### Phase 3: UX Hardening

Status: complete

- Add empty/loading/error states for integrations/logs/notifications.
- Ensure mobile has no horizontal overflow.
- Disable publish buttons while action is pending.
- Keep Coming soon/manual estimate labels visually clear.

### Phase 4: Verification

Status: complete

- Run `npm run build`.
- Run `npm run test:api`.
- Manual verify:
  - connect/disconnect channel
  - publish connected post
  - publish disconnected post
  - retry failed post
  - notifications/logs update

## Risk Assessment

- Main risk: broad `src/app.tsx` grows larger. Mitigation: use small helper functions/components in same pattern; consider extraction only if necessary.
- Main product risk: user may expect real external posting. Mitigation: label as demo operations layer and keep real OAuth out of this slice.
- Main backend risk: extending generic router can accidentally break CRUD. Mitigation: route custom social publish before generic resource routing and test existing API.

## Sources Behind Channel Strategy

- Meta/Facebook and Instagram publishing require platform-specific tokens and permissions.
- Threads and TikTok publishing require separate platform APIs and app setup.
- Therefore this slice builds a channel-agnostic operations layer first, then real adapters can be added one by one.

## Approval Needed

Approve this exact scope before implementation.
