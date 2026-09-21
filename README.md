# Quran Companion

Quran Companion is a full-stack web application scaffold with a React/Vite frontend and a Laravel REST API backend.

## Project Structure

```text
frontend/  React, Vite, Tailwind CSS, Axios
backend/   Laravel REST API, MySQL configuration, Quran API service skeleton
```

## Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure MySQL in `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=quran_companion
DB_USERNAME=root
DB_PASSWORD=
```

Run Laravel:

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

Health check:

```text
http://localhost:8000/api/health
```

## Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env` from `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

Run React:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Environment Variables

Backend:

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
QURAN_API_BASE_URL=https://api.alquran.cloud/v1
QURAN_API_TIMEOUT=10
```

Frontend:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```
