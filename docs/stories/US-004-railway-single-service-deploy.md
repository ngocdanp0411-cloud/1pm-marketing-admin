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
- Releases use `railway status` and `railway up` from the linked repository.
- GitHub pushes are not treated as deploy proof unless auto-deploy is verified.

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
