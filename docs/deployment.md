# Deployment

## Platform: Railway

## Production URL

https://web-production-2556d0.up.railway.app

This app deploys as one Node service:

- Railway/Nixpacks installs dependencies, then `npm run build` builds the React frontend into `dist/`
- `npm start` runs `server/index.js`
- The backend serves both `/api/*` and the static frontend from `dist/`

## Official Deploy Path

Use GitHub Auto Deploy:

```text
local code -> git push origin main -> Railway GitHub Auto Deploy
```

In the Railway dashboard, service `web` must use:

- Source repository: `ngocdanp0411-cloud/1pm-marketing-admin`
- Source branch: `main`
- Automatic deployment trigger: enabled for pushes to `main`

`railway up` is an emergency/manual fallback only. Do not use it for normal
releases because it can create production artifacts that are not traceable to
the expected GitHub deployment trigger.

## Environment Variables

- `PORT` - provided by Railway
- `HOST` - optional, defaults to `0.0.0.0`
- `APP_ADMIN_PASSWORD` - required for the internal password gate; keep it server-side and use a long random value
- `DATA_FILE_PATH` - optional JSON state path, defaults to `data/app-state.json`
- `FACEBOOK_PAGE_ID` - required for real Facebook Page publishing
- `FACEBOOK_PAGE_ACCESS_TOKEN` - required Page token with `pages_manage_posts`
- `FACEBOOK_GRAPH_API_BASE_URL` - optional, defaults to `https://graph.facebook.com/v23.0`

Set this Railway variable before deploying the auth gate:

```text
APP_ADMIN_PASSWORD=your-strong-password
```

Use a unique long password in Railway; the value above is only a placeholder.

## Demo Admin

- Name: Ngọc Dân
- Email: ngocdanp0411@gmail.com
- Role: Admin

## Notes

JSON storage is fine for a public demo. It is not durable production storage; use PostgreSQL before real customer/team use.

The frontend now includes the password login gate. Before deploy, set
`APP_ADMIN_PASSWORD` in Railway. Existing sessions are invalidated whenever the
single Node process restarts.

This is a temporary internal password gate for a private admin tool, not full
multi-user authentication.

## Release Checklist

1. Set `APP_ADMIN_PASSWORD` in the Railway production environment.
2. Run `npm run build`.
3. Run `npm run test:api`.
4. Run `git status` and confirm only the intended release changes exist.
5. Confirm the intended release with `git log --oneline -1`.
6. Run `git push origin main`.
7. In Railway Deployments, confirm the latest deployment shows the pushed
   commit hash/message and completes successfully.
8. Verify the production auth contract using the commands below.

## Production Auth Verification

Public auth status must return `200` with `authenticated: false` before login:

```bash
curl -i https://web-production-2556d0.up.railway.app/api/auth/me
```

Protected bootstrap must return `401 Not authenticated.` before login:

```bash
curl -i https://web-production-2556d0.up.railway.app/api/bootstrap
```

Login must set the `onepm_admin_session` cookie:

```bash
curl -i -c /tmp/1pm-cookies.txt \
  -H "Content-Type: application/json" \
  -X POST \
  https://web-production-2556d0.up.railway.app/api/auth/login \
  --data '{"password":"<password>"}'
```

The saved cookie must allow protected bootstrap access:

```bash
curl -i -b /tmp/1pm-cookies.txt \
  https://web-production-2556d0.up.railway.app/api/bootstrap
```

Delete `/tmp/1pm-cookies.txt` after verification.

## Troubleshooting Stale Auth

If production returns `Missing or invalid bearer token.`, Railway is serving an
old artifact. Do not patch the auth code again. In Railway service `web`, check
that Source points to `ngocdanp0411-cloud/1pm-marketing-admin`, branch `main`,
and that pushes trigger deployments. Then confirm the Deployments tab shows the
latest GitHub commit hash/message.

## Multi-Channel Operations Layer

The current publish workflow is an internal demo layer:

- Supports Instagram, Threads, TikTok, Facebook Page, LinkedIn, and X connection status.
- Supports JSON-store publish states, publish logs, notifications, and retry behavior.
- Facebook Page posts can publish through the real Graph API when Facebook env vars are configured.
- Instagram, Threads, TikTok, LinkedIn, and X are still demo adapters.

Before public customer use, add OAuth/app-review-backed adapters per platform and move persistence from JSON store to PostgreSQL.
