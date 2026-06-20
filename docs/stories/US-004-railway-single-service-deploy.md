# US-004 Railway Single-Service Deploy

## Status

implemented

## Lane

normal

## Product Contract

The app deploys as one Railway service that builds the React frontend and runs
the Node backend to serve both static assets and `/api/*`.

## Relevant Product Docs

- `docs/deployment.md`
- `docs/ARCHITECTURE.md`

## Acceptance Criteria

- Railway/Nixpacks runs `npm run build`.
- Runtime starts with `npm start`.
- Built frontend assets are served from `dist/`.
- SPA fallback works for browser pages.
- `/api/health` returns `status: ok` in production.
- Releases push `main` to GitHub and use Railway GitHub Auto Deploy.
- Railway service `web` is connected to
  `ngocdanp0411-cloud/1pm-marketing-admin`, branch `main`.
- Release proof is the latest commit hash/message in Railway Deployments.
- `railway up` is an emergency/manual fallback, not the normal release path.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | none |
| Integration | `npm run test:api` before deploy |
| E2E | none currently |
| Platform | production health curl |
| Release | Railway deploy logs |

## Evidence

- `railway.json`
- `docs/deployment.md`
- Production URL: `https://web-production-2556d0.up.railway.app`
