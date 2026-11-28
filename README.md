# Siraj | سراج

**Siraj** is a Quran reading and study web application. It helps readers explore the Quran, read translations and tafsir, listen to recitations, search for ayahs, and save verses to return to later.

**سراج** تطبيق لقراءة القرآن الكريم وتدبّره، يتيح تصفّح السور والآيات، والاطلاع على الترجمات والتفسير، والاستماع إلى التلاوات، والبحث في الآيات، وحفظ الآيات للرجوع إليها لاحقًا.

## Live Application

- **Frontend:** https://siraj-frontend-mzfh.onrender.com
- **Backend API:** https://siraj-urg4.onrender.com
- **API health check:** https://siraj-urg4.onrender.com/api/health

The live services are hosted on Render. Availability and response time may vary depending on the hosting plan.

## Features

- Browse all Quran surahs and read their ayahs.
- Read Quran translations.
- View **Mukhtasar Tafsir** in Arabic and English where available.
- Listen to recitations and choose a preferred reciter.
- Search the Quran for words and phrases.
- Save and remove ayahs using guest bookmarks, without requiring an account.
- Choose Arabic or English for the interface.
- Switch between light and dark appearance.

## Technology Stack

| Part | Technologies |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Axios, React Router |
| Backend | Laravel 13, PHP 8.4, REST API |
| Database | MySQL |
| Hosting | Render (Static Site + Docker Web Service) |

## Project Structure

```text
frontend/  React application
backend/   Laravel API
```

## Local Development

### Requirements

- PHP 8.4 or a compatible supported PHP version
- Composer
- Node.js and npm
- MySQL

### 1. Backend setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure the database connection and frontend origin in `backend/.env`:

```env
APP_NAME="Siraj"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=quran_companion
DB_USERNAME=root
DB_PASSWORD=

FRONTEND_URL=http://localhost:5173
```

Run the database migrations:

```bash
php artisan migrate
```

Start the API:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

The API health endpoint is available at http://localhost:8000/api/health.

### 2. Frontend setup

In a separate terminal:

```bash
cd frontend
npm ci
```

Create `frontend/.env` using `frontend/.env.example` as a reference:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Start the frontend development server:

```bash
npm run dev
```

Open http://localhost:5173.

## Deployment

The application is deployed as two services on Render.

### Frontend — Static Site

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Environment Variable | `VITE_API_BASE_URL=https://siraj-urg4.onrender.com/api` |

The frontend uses client-side routing. Configure a rewrite rule on Render:

| Source | Destination | Status |
|---|---|---|
| `/*` | `/index.html` | `200` |

### Backend — Docker Web Service

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Docker |
| Dockerfile Path | `./Dockerfile` |
| Health Check Path | `/api/health` |

The Docker image is based on PHP 8.4 with Apache and the MySQL PDO extension. Apache listens on the port supplied by Render.

### Backend environment

Set production environment variables in the Render dashboard. Do not commit production credentials or secret values.

At minimum, configure:

- `APP_NAME=Siraj`
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_KEY` — generate a unique Laravel key and store it only in Render.
- `APP_URL` — the backend service URL.
- `FRONTEND_URL` — the exact frontend origin.
- `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` — credentials for the production MySQL database.
- `SESSION_DRIVER`, `CACHE_STORE`, `QUEUE_CONNECTION`, and logging settings appropriate to the deployment.
- Quran API settings: `QURAN_API_BASE_URL`, `QURAN_API_TIMEOUT`, `QURAN_DEFAULT_TRANSLATION`, and `QURAN_DEFAULT_AUDIO`.
- Mukhtasar Tafsir settings: `MOKHTASR_API_BASE_URL`, `MOKHTASR_API_CONNECT_TIMEOUT`, `MOKHTASR_API_TIMEOUT`, `MOKHTASR_CACHE_DAYS`, `MOKHTASR_ARABIC_BOOK_ID`, and `MOKHTASR_ENGLISH_BOOK_ID`.
- `MOKHTASR_API_TOKEN` only when required by the configured tafsir API access.

Use the values in `backend/.env.example` as a starting point, then set production-specific values in Render. Never copy local database credentials or secret keys into the repository.

### Database and migrations

The deployed API uses an external MySQL database. Keep production data separate from local development data.

For a new, empty production database, run migrations from the backend service shell:

```bash
php artisan migrate --force
```

Before running migrations on a database that already contains data, take a backup and review the pending migrations. **Never run `migrate:fresh`, `db:wipe`, or destructive SQL against a database containing user bookmarks or other data.**

Migrations are not run automatically when the container starts.

## Guest Bookmarks and Cookies

Bookmarks are associated with a guest token stored in a browser cookie; users do not need to create an account.

The frontend and backend are hosted on different origins. The API must allow credentialed CORS requests from the exact frontend origin, and the frontend must send requests with credentials enabled. In production, the guest bookmark cookie is issued with `Secure` and `SameSite=None` so it can be sent with cross-origin API requests. Browser privacy settings may still affect third-party cookie behavior when the frontend and API use unrelated sites.

## External Services

- [AlQuran Cloud API](https://alquran.cloud/api) — Quran text, translations, and recitation data.
- [Mukhtasar Tafsir API](https://admin.mokhtasr.com/api/v1) — Arabic and English tafsir content.
- [Render](https://render.com) — application hosting.

## Security Notes

- Keep `.env` files, database passwords, API tokens, and Laravel `APP_KEY` out of source control.
- Keep `APP_DEBUG=false` in production.
- Use HTTPS for deployed frontend and API services.
- Back up the production database before making schema changes.
- Do not expose production credentials in issues, logs, screenshots, or chat messages.

---

**Siraj | سراج**  
A place to read, listen, reflect, and return to the words of the Quran.
