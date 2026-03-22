# Deployment Guide — InterBR

Two services, ~15 minutes total.

- **Backend** → [Railway](https://railway.app) (Django + PostgreSQL + Redis)
- **Frontend** → [Vercel](https://vercel.com) (Next.js)

---

## Part 1 — Backend on Railway

### 1. Create a Railway account
Go to [railway.app](https://railway.app) and sign up with your GitHub account.

### 2. Create a new project
- Click **New Project → Deploy from GitHub repo**
- Select `Mathias-SantAnna/Interbr`
- Set the **Root Directory** to `backend`
- Railway will detect the `Dockerfile` automatically

### 3. Add PostgreSQL
- In your project dashboard → **New → Database → Add PostgreSQL**
- Railway automatically injects `DATABASE_URL` into your service

### 4. Add Redis
- **New → Database → Add Redis**
- Railway automatically injects `REDIS_URL` into your service

### 5. Set environment variables
In your backend service → **Variables**, add:

```
SECRET_KEY=<generate a 50-char random string>
DEBUG=False
DJANGO_SETTINGS_MODULE=config.settings.production
ALLOWED_HOSTS=<your-app>.up.railway.app
CORS_ALLOWED_ORIGINS=https://<your-vercel-app>.vercel.app
FRONTEND_URL=https://<your-vercel-app>.vercel.app
BACKEND_URL=https://<your-app>.up.railway.app
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxxx
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxxx
PORT=8000
```

> `DATABASE_URL` and `REDIS_URL` are injected automatically — do NOT add them manually.

### 6. Run migrations (one-time, after first deploy)
In Railway dashboard → your backend service → **Shell**:
```bash
python manage.py migrate --settings=config.settings.production
python manage.py collectstatic --noinput --settings=config.settings.production
python manage.py create_superuser_demo --settings=config.settings.production
```

### 7. Add a Celery worker service (optional but needed for NF-e + payments)
- **New Service → GitHub Repo → Root: backend**
- Set **Start Command**: `celery -A config worker -l info`
- Add the same environment variables as the web service

Your backend will be live at:
```
https://<your-app>.up.railway.app/api/v1/
https://<your-app>.up.railway.app/admin/
```

---

## Part 2 — Frontend on Vercel

### 1. Create a Vercel account
Go to [vercel.com](https://vercel.com) and sign up with GitHub.

### 2. Import the repository
- **New Project → Import Git Repository**
- Select `Mathias-SantAnna/Interbr`
- Set **Root Directory** to `frontend`
- Framework will be detected as **Next.js** automatically

### 3. Set environment variables
In **Project Settings → Environment Variables**:

```
NEXT_PUBLIC_API_BASE_URL=https://<your-app>.up.railway.app/api/v1
NEXT_PUBLIC_MP_PUBLIC_KEY=APP_USR-xxxx
```

### 4. Deploy
Click **Deploy**. Vercel builds and deploys in ~2 minutes.

Every `git push` to `main` will trigger an automatic redeploy on both Vercel and Railway.

Your frontend will be live at:
```
https://<your-app>.vercel.app
```

---

## Quick reference

| What | Where | URL pattern |
|------|-------|-------------|
| Frontend | Vercel | `https://<app>.vercel.app` |
| Backend API | Railway | `https://<app>.up.railway.app/api/v1/` |
| Django Admin | Railway | `https://<app>.up.railway.app/admin/` |
| PostgreSQL | Railway | managed, internal URL |
| Redis | Railway | managed, internal URL |

## Generate a SECRET_KEY

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

## Troubleshooting

**500 on first load** — You forgot to run migrations. Open the Railway shell and run:
```bash
python manage.py migrate --settings=config.settings.production
```

**CORS error in browser** — `CORS_ALLOWED_ORIGINS` in Railway variables doesn't include your Vercel URL exactly (no trailing slash).

**Payment link not generating** — The Celery worker service is not running. Check the worker service logs in Railway.

**Static files returning 404** — Run `collectstatic` in the Railway shell (see step 6 above).
