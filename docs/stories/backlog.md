# Story Backlog

## Candidate Epics

| Epic | Description | Status |
| --- | --- | --- |
| E01 Dashboard UX | Keep the 10-screen admin UI polished, readable, responsive, and bilingual. | active |
| E02 Operations API | Keep backend CRUD, bootstrap, JSON state, validation, and deploy shape stable. | active |
| E03 Social Publishing | Turn the social posting loop into a real operating system: compose, schedule, publish, retry, log, notify. | active |
| E04 Public Launch Readiness | Add auth, database, tenancy, security, billing, and provider app review before customer use. | unsliced |

## Next Candidate Stories

| Story | Title | Why it matters | Suggested lane |
| --- | --- | --- | --- |
| US-005 | Persist media URL for social posts | Current UI captures image/media URL, but backend rejects the field. | normal |
| US-006 | Background scheduler for queued posts | Scheduled posts should publish at their scheduled time, not only by manual button. | high-risk |
| US-007 | Facebook image post support | Real Page publishing currently posts text to `/feed`; marketing posts need image support. | normal |
| US-008 | Replace dev auth with real auth/session | Required before public or sensitive use. | high-risk |
| US-009 | Move JSON store to PostgreSQL | Required before public customer/team use. | high-risk |
| US-010 | Extract page modules from `src/app.tsx` | App file is large and should be split before more UI work piles up. | normal |
