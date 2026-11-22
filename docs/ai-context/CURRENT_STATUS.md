# Quran Companion — Current Status

> Updated: 2026-11-22
> This status reflects the checked-out source and working tree at the time of this audit.

## Current checkout

- Branch: `main`
- HEAD: `ccdfae6` (`fixing the aduio`)
- The worktree is not clean. Audio-player, reader, localization, frontend package/config files have local modifications; `frontend/src/pages/SurahReaderPage.test.jsx`, `AGENTS.md`, and `docs/` are untracked. Preserve these changes; do not assume they are committed or discard them.
- Toolchain observed: Laravel 13.32.0, PHP 8.5.12, Composer 2.9.8, Node.js 22.16.0, npm 11.14.1.

## Verified implementation status

- [x] Quran JSON API routes exist for surah data/audio, editions, search, and audio editions.
- [x] Audio metadata has a dedicated `/api/quran/surahs/{number}/audio` endpoint and is cached by the backend for 12 hours.
- [x] Reader reciter changes fetch/merge audio metadata separately from Quran text/translation.
- [x] Audio playback state and queue are held in `AudioPlayerContext`; the reader's Ayah button reflects shared loading/playing/paused/error state.
- [x] Clicking Quran text selects an Ayah; the translation-panel button starts or controls its audio.
- [x] Guest bookmark routes use cookie-based owner resolution; the owner lookup hashes the cookie token, and create/delete operations are scoped to that owner.
- [x] Migrations declare the bookmark tables, owner/ayah uniqueness, and cascade behavior. Live DB schema/data were not inspected.
- [x] `phpunit.xml` configures test database access to SQLite `:memory:`; this audit did not run backend tests.

## Test/build results available

The following results were reported and observed in the preceding audio-fix task against this checkout, not rerun as part of this documentation audit:

- Frontend: `npm test` — 5 tests passed.
- Frontend: `npm run build` — succeeded.
- Backend: `php artisan test --colors=never` from `backend` — 11 tests passed, 35 assertions.
- `git diff --check` — succeeded; Git printed line-ending conversion warnings for modified frontend files.

## Historical report, not a confirmed current blocker

- MySQL connection refusal at `127.0.0.1:3307` was reported on 2026-10-28.
- The checked-in `.env.example` instead documents port `3306`; actual runtime settings and database availability were not inspected.
- No database command, migration, or database connection was used in this audit.

## Deployment preparation (2026-11-22)

- User selected Render for an initial deployment trial, with the current MySQL architecture retained for now.
- Added `backend/Dockerfile` using PHP 8.4 + Apache + `pdo_mysql`; it serves Laravel from `public` and binds Apache to Render's `PORT`.
- Added `backend/.dockerignore`.
- Updated the root README with Render frontend/backend setup, environment variables, cookie/CORS notes, and a guarded first-migration procedure.
- No Render services or external MySQL database have been created. Docker image build and runtime behavior have not yet been tested.
- The external MySQL provider is still undecided. Do not switch the project to PostgreSQL without discussing the architecture and migration impact.

## Pending / not verified

- Whether the actual local MySQL service and configured runtime database are available.
- The live database schema and whether it contains existing bookmarks.
- Browser-level media playback over a real network; the frontend tests mock media behavior.
- Production deployment target/readiness: Render selected for trial; actual service/database provisioning and live HTTPS tests remain pending.
- Review and disposition of the current uncommitted audio-player work, if the user wants further implementation.
