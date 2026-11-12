# Quran Companion — Project Context

> Last audited: 2026-11-08
> Facts below were checked against this checkout. Runtime `.env` settings and live database contents were not inspected.

## 1. Project overview

Quran Companion is a web application for reading and exploring the Quran. It has a Laravel JSON API backend and a React/Vite frontend. Features in the current source include Quran reading, search, translations, audio editions and playback, settings, and guest bookmarks.

## 2. Repository and verified toolchain

- Repository root: `E:\Quran Companion`
- Backend: `E:\Quran Companion\backend`
- Frontend: `E:\Quran Companion\frontend`
- Backend framework reported by `php artisan --version`: Laravel 13.32.0.
- Backend dependency constraints: PHP `^8.3`, Laravel `^13.17` in `backend/composer.json`.
- Frontend dependency declarations: React `^19.3.0`, Vite `^8.3.0`.
- Toolchain observed during this audit: PHP 8.5.12, Composer 2.9.8, Node.js 22.16.0, npm 11.14.1.
- Vite is configured for port 5173; Laravel's documented development port is 8000. These are configuration/documentation defaults, not confirmation that servers are running.

## 3. Quran API and audio

- Backend API routes are under `/api`; Quran routes include surah data, a separate per-surah audio metadata endpoint, editions, search, and audio editions.
- Default API base URL in `backend/config/quran.php`: `https://api.alquran.cloud/v1`.
- Config fallback timeout is 10 seconds. `backend/.env.example` sets `QURAN_API_TIMEOUT=30`; the active `.env` value was intentionally not inspected.
- Config defaults are translation `en.sahih` and audio edition `ar.alafasy`.
- `QuranApiService::getSurahAudio` caches audio metadata for 12 hours. The frontend `getSurahAudio` helper coalesces concurrent in-flight requests for the same surah/edition.
- The reader loads surah text and translation through `getSurah`; when the preferred audio edition changes, it fetches audio metadata through `getSurahAudio` and merges the URLs without requesting the surah text again.
- `PreferencesContext` persists UI language, theme, and audio edition in localStorage. UI language is distinct from Quran translation selection.
- The shared `AudioPlayerContext` owns the current queue, track, playback state, and playback intent. Reader Ayah controls reflect that shared state; clicking Ayah text only selects it.

## 4. Guest bookmark architecture

- Bookmark routes are protected by `EnsureBookmarkOwner`.
- `GuestBookmarkOwnerService` reads cookie `quran_companion_guest_token`, hashes its value with SHA-256, and resolves/creates a `BookmarkOwner`. The raw token is not stored in the model record.
- `BookmarkController` scopes list/create/delete operations to the resolved owner. It validates surah/ayah numbers; `firstOrCreate` and the declared unique index prevent duplicate owner/ayah rows.
- Migrations declare `bookmark_owners` with nullable unique `token_hash` and nullable unique `user_id`, and `bookmarks` with `owner_id`, surah/ayah numbers, a unique owner/surah/ayah index, and cascading owner deletion.
- These are code/migration facts only; this audit did not inspect the live database or its schema.
- Preserve cookie-based guest ownership and existing bookmark data. Do not replace it with login/localStorage identity or run destructive database operations.

## 5. Environment and deployment caveats

- `backend/.env.example` documents MySQL at `127.0.0.1:3306` with database `quran_companion`. `backend/config/database.php` falls back to SQLite if `DB_CONNECTION` is absent.
- A MySQL connection refusal at `127.0.0.1:3307` was reported on 2026-10-28. This is a historical report, not a confirmed current blocker; the active `.env`, service, port, and database were not inspected in this audit.
- Never copy values from `.env` into documentation or chat.
- No production hosting provider, database, domain, or deployment plan has been confirmed.

## 6. Verification discipline

- Context is a handoff, not proof. Confirm current files and Git state before relying on historical claims.
- Do not claim tests pass unless they were run against the current checkout; state whether results were run in the current task or reported from a preceding task.
- Laravel's `phpunit.xml` configures tests to use SQLite `:memory:`. This audit did not run Laravel tests and did not connect to or change any database.
