# Quran Companion — Technical Decisions

This file records confirmed user choices and checked implementation constraints. Migration definitions do not prove the live database schema.

## Confirmed decisions

### 1. Guest bookmarks use cookie-based ownership

- Bookmarks do not require registration or login.
- The guest identity cookie is `quran_companion_guest_token`; the backend hashes its value with SHA-256 for owner lookup/storage.
- Do not replace this with localStorage identity or a full authentication flow without discussing the trade-offs and obtaining approval.

### 2. Bookmark rows identify an Ayah, not Quran text

- The declared schema stores `surah_number` and `ayah_number`, associated with an owner.
- Quran text is supplied by the Quran data/API flow rather than copied into each bookmark.
- Current migrations declare a unique owner/surah/ayah combination. Confirm the live schema before any schema change.

### 3. Preserve existing bookmark data

- Never use destructive database commands (`migrate:fresh`, `db:wipe`, dropping tables, truncating bookmark tables, or deleting/recreating the database) as troubleshooting shortcuts.
- Do not modify bookmark data as part of unrelated work.
- Before a requested schema/data migration, inspect its impact and explain it; use an appropriate backup for risky operations.

### 4. Changing the reciter reloads the application

- The selected audio edition is a persisted preference separate from UI language and translation selection.
- Changing the reciter from Settings saves the new edition to localStorage synchronously, then performs a full page reload.
- The user does not require preserving the current Surah or Ayah; after reload, the app returns to its normal initial navigation state.
- Selecting the already active reciter does not trigger a reload.
- The audio player and reader initialize using the newly persisted edition after the reload.
### 5. Initial deployment direction

- The user chose Render for an initial deployment trial, with the frontend as a Static Site and Laravel API as a Docker Web Service.
- Keep MySQL for now. Render's managed database offering is PostgreSQL, so a separate MySQL provider must be selected before deploying the API.
- This is a deployment direction, not approval to migrate the production database or change the application's database engine.
- Preserve guest bookmark data and do not run destructive migrations.

## Verified implementation details

- Routes are owner-middleware protected for bookmark list/create/delete.
- The controller validates surah and Ayah bounds and scopes deletion to the current owner.
- `firstOrCreate` is backed by a declared database uniqueness constraint for owner/surah/Ayah.
- Backend API configuration defaults to `https://api.alquran.cloud/v1`, translation `en.sahih`, and audio `ar.alafasy`. Active environment overrides were not inspected.
- `getSurahAudio` uses a 12-hour cache. Frontend deduplication coalesces pending requests for a surah/edition.

## Change-control rule

For a significant architectural change:
1. Explain current behavior and the proposed change.
2. Explain benefits, costs, and migration/data impact.
3. Wait for the user's agreement before changing the architecture.
4. Update this file after the decision is made.
