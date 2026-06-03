# Deployment

## Platform: Railway

This app deploys as one Node service:

- `npm run build` builds the React frontend into `dist/`
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
