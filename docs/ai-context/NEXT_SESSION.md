# Quran Companion — Next Session Handoff

## Current stopping point

The context documents were audited against the current source on 2026-11-08 and updated to remove stale status assumptions. No application source, `.env`, database, or bookmark data was changed. The `.env` file was not opened or exposed, and no database connection was made.

The worktree is intentionally dirty on branch `main` at `ccdfae6`. It contains uncommitted audio/player changes, the new frontend test, package/config changes, and untracked `AGENTS.md` and `docs/`. Inspect `git status` and relevant diffs before editing; do not discard or overwrite user changes.

## If continuing the audio-player task

1. Read `PROJECT_CONTEXT.md`, `CURRENT_STATUS.md`, and `DECISIONS.md`.
2. Inspect the current diff for `frontend/src/contexts/AudioPlayerContext.jsx`, `frontend/src/components/AudioPlayer.jsx`, `frontend/src/pages/SurahReaderPage.jsx`, tests, and package/config changes.
3. If appropriate, rerun frontend tests/build and `git diff --check`.
4. Browser playback under real network conditions remains unverified; frontend tests mock the media element.
5. Backend tests previously passed with 11 tests/35 assertions, but were not rerun in the documentation audit.

## Database and secret safety

- Do not read, print, or copy secrets from `backend/.env`.
- Do not connect to, alter, migrate, reset, drop, truncate, or recreate any database for unrelated validation.
- Preserve all existing bookmark data and the cookie-based guest-owner design.
- `phpunit.xml` declares SQLite `:memory:` for tests, but confirm test setup if any future test could use a real environment; do not assume the runtime `.env` settings.

## Environment notes

- PHP 8.5.12, Composer 2.9.8, Node.js 22.16.0, npm 11.14.1, and Laravel 13.32.0 were observed during the audit.
- `.env.example` documents MySQL on port 3306. A refusal on port 3307 was a historical report from 2026-10-28; current runtime DB configuration/service status is unknown.
- No deployment target is confirmed.
