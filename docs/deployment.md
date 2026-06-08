# Deployment

## Platform: Railway

## Production URL

https://web-production-2556d0.up.railway.app

This app deploys as one Node service:

- Railway/Nixpacks installs dependencies, then `npm run build` builds the React frontend into `dist/`
- `npm start` runs `server/index.js`
- The backend serves both `/api/*` and the static frontend from `dist/`

## Environment Variables

- `PORT` - provided by Railway
- `HOST` - optional, defaults to `0.0.0.0`
- `DEV_API_TOKEN` - optional demo token, defaults to `dev-1pm-token`
- `DATA_FILE_PATH` - optional JSON state path, defaults to `data/app-state.json`

## Demo Admin

- Name: Ngọc Dân
- Email: ngocdanp0411@gmail.com
- Role: Admin

## Notes

JSON storage is fine for a public demo. It is not durable production storage; use PostgreSQL before real customer/team use.

## Multi-Channel Operations Layer

The current publish workflow is an internal demo layer:

- Supports Instagram, Threads, TikTok, Facebook Page, LinkedIn, and X connection status.
- Supports JSON-store publish states, publish logs, notifications, and retry behavior.
- Does not publish to external social APIs yet.

Before public customer use, add OAuth/app-review-backed adapters per platform and move persistence from JSON store to PostgreSQL.
