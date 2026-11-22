# Quran Companion — Next Session Handoff

## Current stopping point (2026-11-22)

- The user selected Render for an initial deployment trial and wants to keep MySQL for now.
- Added `backend/Dockerfile` (PHP 8.4 + Apache + pdo_mysql, dynamic Render PORT binding) and `backend/.dockerignore`.
- Updated root `README.md` with manual Render service configuration, environment variable guidance, cookie/CORS considerations, and safe migration instructions.
- Updated project context, current status, and decisions to record the deployment direction.
- Changes were made on `feature/mokhtasr-tafsir-backend`. PR #1 remains open; do not merge it.
- Docker image has not been built or run in this session. No Render service, external MySQL database, or domain has been created.
- Do not claim deployment readiness until the Docker build and runtime checks pass.

## Next actions

1. Ask the user to pull the latest branch and inspect the new Dockerfile and README.
2. Build the Docker image locally from the `backend` directory:
   `docker build -t quran-companion-api .`
3. If the build succeeds, test it with a temporary local MySQL-compatible database/container and a safe test-only environment. Do not connect to the user's existing `quran_companion` database for this test.
4. Choose an external managed MySQL provider that allows connections from Render and supports backups/TLS.
5. Create Render frontend and backend services only after the Docker image works and the database provider is selected.
6. For a brand-new empty production DB, run `php artisan migrate --force` after checking the target connection. Never use `migrate:fresh`, `db:wipe`, or destructive SQL.

## Database and secret safety

- Never read, print, or commit the real `backend/.env`.
- Never ask the user to share `APP_KEY`, database passwords, or API tokens.
- Preserve all existing bookmark data and cookie-based guest ownership.
- Do not change the database engine to PostgreSQL without discussing migration/data impact and receiving explicit approval.
- Do not merge PR #1 or `main` unless explicitly requested.

## Deployment-specific checks

- Frontend Static Site: root `frontend`, build `npm ci && npm run build`, publish `dist`, set `VITE_API_BASE_URL` to the API origin plus `/api`, and add SPA rewrite `/* -> /index.html`.
- Backend Docker Web Service: root `backend`, Dockerfile `./Dockerfile`, health check `/api/health`.
- Configure `APP_ENV=production`, `APP_DEBUG=false`, unique `APP_KEY`, `APP_URL`, exact `FRONTEND_URL`, MySQL connection variables, secure cookie settings, and stderr logging in Render.
- Test guest bookmark create/read/delete, CORS credentials, tafsir, search, and audio over HTTPS.
