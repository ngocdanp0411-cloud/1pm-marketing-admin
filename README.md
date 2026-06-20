# 1PM Marketing Admin

1PM Marketing Admin is a personal-first marketing command center for planning,
creating, scheduling, and publishing marketing work from one browser dashboard.

The current product is a working React/Vite frontend plus a Node.js API backed
by a local JSON store. It is suitable for personal use, demos, and continued
product development. It is not yet ready for public multi-customer SaaS use.

## Product Scope

Implemented surfaces:

- Overview dashboard with live operational metrics from the backend.
- Content Studio kanban workflow for ideas, drafting, review, and publish
  readiness.
- Content Calendar and schedule detail panels.
- AI Generator UI for copy, image, video, and strategy prompts.
- Campaign CRUD with table, detail panel, duplicate, edit, and delete actions.
- Analytics, Brand Assets, Local Marketing, and Settings dashboards.
- Social Posting composer, queue, publish log, notifications, and integration
  health.
- Vietnamese/English language toggle.

Current real operations:

- Backend CRUD for campaigns, content, calendar events, social posts,
  integrations, publish logs, and notifications.
- JSON persistence in `data/app-state.json`.
- Facebook Page publishing through Graph API when `FACEBOOK_PAGE_ID` and
  `FACEBOOK_PAGE_ACCESS_TOKEN` are configured.
- Demo publish adapters for Instagram, Threads, TikTok, LinkedIn, and X.

Known gaps:

- Authentication is a single-admin password/cookie gate, not a multi-user
  identity or role system.
- Sessions are in memory and are not suitable for multi-instance or multi-user use.
- No PostgreSQL or tenant isolation.
- No background scheduler loop yet; scheduled posts require manual publish.
- Media binary upload/storage is not implemented; social posts currently persist
  image/media references as `mediaUrl`.

The current login is a temporary internal password gate for a private admin
tool, not full multi-user authentication. Configure it on Railway with:

```text
APP_ADMIN_PASSWORD=your-strong-password
```

## Tech Stack

- Frontend: React 18, Vite 6, TypeScript, Lucide icons, CSS.
- Backend: Node.js built-in modules only.
- Storage: JSON file store.
- Deploy: Railway single service.

## Local Development

Install dependencies:

```bash
npm install
```

Run frontend and backend separately:

```bash
npm run dev:api
npm run dev
```

Run both with the current script:

```bash
npm run dev:full
```

Default backend port is `8787`. The Vite frontend runs on `5173`.
Set `APP_ADMIN_PASSWORD` for local backend work; there is no built-in password
fallback.

## Validation

Build frontend and typecheck:

```bash
npm run build
```

Run backend API smoke tests:

```bash
npm run test:api
```

Harness proof matrix:

```bash
scripts/bin/harness-cli query matrix
```

## Deployment

Production is currently deployed on Railway:

https://web-production-2556d0.up.railway.app

The official release path is GitHub Auto Deploy:

```text
local code -> git push origin main -> Railway GitHub Auto Deploy
```

Railway service `web` must be connected to
`ngocdanp0411-cloud/1pm-marketing-admin` on branch `main`, with automatic
deployments enabled. `railway up` is reserved for emergency/manual releases and
is not the normal release path.

See `docs/deployment.md` for deploy variables and platform notes.

## Harness Entry Points

This repo uses Repository Harness for agent-ready documentation and proof
tracking.

Start with:

- `AGENTS.md`
- `docs/FEATURE_INTAKE.md`
- `docs/product/overview.md`
- `docs/product/operations.md`
- `docs/ARCHITECTURE.md`
- `docs/TEST_MATRIX.md`

Before implementation, run:

```bash
scripts/bin/harness-cli query matrix
```
