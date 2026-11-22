# Quran Companion

Quran Companion is a Quran reading and study web application with a React/Vite frontend and a Laravel JSON API backend.

Current features include Quran reading, translations, search, audio reciters and playback, Arabic/English tafsir, settings, and guest bookmarks.

## Project Structure

```text
frontend/  React, Vite, Tailwind CSS, Axios
backend/   Laravel 13 REST API, MySQL-compatible database
```

## Local Development

### Backend

Requirements: PHP 8.3+, Composer, and MySQL.

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure the database and frontend origin in `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=quran_companion
DB_USERNAME=root
DB_PASSWORD=

APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

Run migrations on your local development database:

```bash
php artisan migrate
```

Start the API:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Health check: `http://localhost:8000/api/health`

### Frontend

Requirements: Node.js and npm.

```bash
cd frontend
npm ci
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend URL: `http://localhost:5173`

## Deploying to Render (preparation)

The repository is structured as two Render services:

- **Frontend:** Render Static Site, with the root directory set to `frontend`.
- **Backend:** Render Web Service using Docker, with the root directory set to `backend` and its Dockerfile at `backend/Dockerfile`.

This repository does not provision a production database automatically. The app currently uses MySQL. Render's managed database offering is PostgreSQL rather than managed MySQL, so choose a separate managed MySQL provider before deploying the API. Keep the existing database and its data untouched; do not point production at a local development database.

### Frontend service settings

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment Variable | `VITE_API_BASE_URL=https://YOUR-API-SERVICE.onrender.com/api` |

Because the app uses client-side routing, add a Render rewrite rule from `/*` to `/index.html` with status `200`.

### Backend service settings

| Setting | Value |
|---|---|
| Runtime | Docker |
| Root Directory | `backend` |
| Dockerfile Path | `./Dockerfile` |
| Health Check Path | `/api/health` |

The Docker image uses PHP 8.4 with Apache and the MySQL PHP extension. It listens on Render's `PORT` environment variable and serves Laravel from the `public` directory.

Configure these environment variables in the Render dashboard (never commit production values):

```env
APP_NAME="Quran Companion"
APP_ENV=production
APP_DEBUG=false
APP_KEY=GENERATE_A_UNIQUE_LARAVEL_KEY
APP_URL=https://YOUR-API-SERVICE.onrender.com

FRONTEND_URL=https://YOUR-FRONTEND.onrender.com

DB_CONNECTION=mysql
DB_HOST=YOUR_MYSQL_HOST
DB_PORT=3306
DB_DATABASE=YOUR_DATABASE
DB_USERNAME=YOUR_DATABASE_USER
DB_PASSWORD=YOUR_DATABASE_PASSWORD

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=

CACHE_STORE=database
QUEUE_CONNECTION=database
LOG_CHANNEL=stderr
LOG_LEVEL=info

QURAN_API_BASE_URL=https://api.alquran.cloud/v1
QURAN_API_TIMEOUT=30
QURAN_DEFAULT_TRANSLATION=en.sahih
QURAN_DEFAULT_AUDIO=ar.alafasy

MOKHTASR_API_BASE_URL=https://admin.mokhtasr.com/api/v1
MOKHTASR_API_CONNECT_TIMEOUT=10
MOKHTASR_API_TIMEOUT=30
MOKHTASR_CACHE_DAYS=7
MOKHTASR_ARABIC_BOOK_ID=200
MOKHTASR_ENGLISH_BOOK_ID=319
```

Generate the Laravel key locally with `php artisan key:generate --show` from the backend directory, then enter the result directly in Render's `APP_KEY` setting. Do not paste it into GitHub or chat. Add `MOKHTASR_API_TOKEN` in Render only if your configured tafsir API access requires it.

The frontend and API Render subdomains are normally same-site but cross-origin. Keep Axios `withCredentials: true`, Laravel CORS credentials enabled, and `FRONTEND_URL` set to the exact frontend origin. The guest bookmark cookie is issued as Secure in production. If you later use unrelated custom domains for the frontend and API, reassess cookie settings; cross-site cookies generally require `SameSite=None` and `Secure`, and browser third-party-cookie restrictions may still apply.

### Database migration and first deployment

1. Provision the external MySQL database and confirm it accepts connections from Render.
2. Set the production environment variables in the backend service.
3. Deploy the backend and confirm `/api/health` responds successfully.
4. Before running migrations against any database that already contains data, take a backup and inspect the migration plan.
5. For a brand-new empty production database only, open the backend service Shell and run:

   ```bash
   php artisan migrate --force
   ```

Do not run `migrate:fresh`, `db:wipe`, or destructive SQL against a database containing bookmarks or other user data. Migrations are intentionally not run automatically by the container startup command.

### Deployment notes

- Render free web services can spin down when idle, so they are suitable for an initial deployment test, not a dependable production launch.
- Configure the frontend API URL at build time; changing it requires a new frontend build/deploy.
- Keep `.env`, database credentials, API tokens, and `APP_KEY` out of source control.
- Test bookmark creation, reload, retrieval, and deletion in a real browser after deployment. Also test audio, tafsir, search, CORS, and cookie behavior over HTTPS.
- This guide prepares the repository for deployment; it does not mean that a Render service or production database has already been created.
