# US-012 Manual Content Composer

## Status

implemented

## Lane

normal

## Product Contract

The operator can create content without an AI API, paste externally written
copy, attach a public asset URL, preserve prompt notes, assign a campaign,
schedule publication, and manage the item through a manual content library.

## Acceptance Criteria

- Content Studio includes `Tạo bài thủ công`.
- Form supports title, platform, type, copy, asset URL, visual/copy notes,
  campaign, scheduled date/time, status, and tags.
- Manual items persist through the existing JSON-backed `content` API.
- Library cards show thumbnail, platform, type, status, schedule, edit, delete,
  and quick status actions.
- Scheduled items appear in Content Calendar.
- Selecting a calendar item opens the edit modal.
- Existing password-cookie authentication remains unchanged.
- Binary upload remains a visible placeholder until object storage exists.

## Validation

| Layer | Expected proof |
| --- | --- |
| Integration | `npm run test:api` covers create, edit, list, bootstrap, delete. |
| Frontend | `npm run build`. |
| Browser | Manual composer, library, and calendar interaction review. |

## Relevant Files

- `src/action-workflow.tsx`
- `src/manual-content-library.tsx`
- `src/manual-content-calendar.tsx`
- `src/app.tsx`
- `server/validators.js`
- `server/api-smoke.test.js`
