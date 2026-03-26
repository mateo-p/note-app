# Notes App

A personal note-taking app with a Next.js frontend and Django REST API backend, running entirely in Docker.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 15, App Router, TypeScript, Tailwind CSS v4 |
| Backend | Django 4.2, Django REST Framework, SimpleJWT |
| Database | PostgreSQL 15 |
| Auth | JWT stored in httpOnly cookies |

## Quick Start

```bash
# Copy env file (required — SECRET_KEY must be set)
cp backend/.env.example backend/.env
# Edit backend/.env and set a real SECRET_KEY

# Start everything
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:8000 |
| PostgreSQL | localhost:5432 |

Migrations run automatically on container start.

## Project Structure

```
notes-app/
├── docker-compose.yml
├── backend/                        # Django API
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py             # Shared settings
│   │   │   ├── development.py      # DEBUG=True, open CORS
│   │   │   ├── production.py       # HTTPS, HSTS, strict CORS
│   │   │   └── test.py             # SQLite in-memory
│   │   └── urls.py
│   └── apps/
│       ├── common/                 # BaseModel (UUID PK + timestamps)
│       ├── users/                  # Custom User, auth views, cookie JWT
│       └── notes/                  # Category + Note models, CRUD API
└── frontend/                       # Next.js app
    └── src/
        ├── middleware.ts            # Route protection
        ├── app/                     # Pages (App Router)
        ├── components/              # UI components
        └── lib/                     # API clients, types, utils
```

## API Endpoints

```
POST   /api/auth/signup/
POST   /api/auth/login/
POST   /api/auth/logout/
POST   /api/auth/refresh/
GET    /api/auth/me/

GET    /api/categories/

GET    /api/notes/          ?category=<id>&search=<str>&archived=<bool>
POST   /api/notes/
GET    /api/notes/<uuid>/
PATCH  /api/notes/<uuid>/
DELETE /api/notes/<uuid>/
```

## Auth Flow

- Login/signup set two httpOnly cookies: `access_token` (60 min) and `refresh_token` (7 days).
- `CookieJWTAuthentication` reads the access token from the cookie on every request.
- Refresh tokens are blacklisted after rotation.
- Logout clears both cookies.

## Common Commands

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Make migrations after model changes
docker compose exec backend python manage.py makemigrations

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Django shell
docker compose exec backend python manage.py shell

# Run backend tests
docker compose exec backend pytest

# TypeScript type check
docker compose exec frontend npx tsc --noEmit

# Rebuild a single service
docker compose up --build backend
```

## Environment Variables

**`backend/.env`**
```
SECRET_KEY=<required>
POSTGRES_DB=notesapp
POSTGRES_USER=notesapp
POSTGRES_PASSWORD=notesapp
POSTGRES_HOST=db
POSTGRES_PORT=5432
DJANGO_SETTINGS_MODULE=config.settings.development
```

**`frontend/.env.local`**
```
INTERNAL_API_URL=http://backend:8000
```

---

## Process Summary

The project was built following a monorepo layout with Docker Compose orchestrating all services.

**Backend** was built first — custom email-based User model, JWT auth via httpOnly cookies, and a Notes CRUD API with category filtering, search, pin, and archive. Settings were split into `base`, `development`, `production`, and `test` environments from the start to keep configuration clean.

**Frontend** followed the Next.js App Router model: server components for SSR data fetching, client components only where interactivity was needed. A Next.js rewrite proxy routes all client-side API calls through `/api/*` to avoid hardcoding the backend URL in browser code.

**Refactoring pass** came after initial implementation, addressing security gaps, ORM correctness, and dead code identified during code review.

---

## Key Design Decisions

**httpOnly cookie auth instead of localStorage JWTs**
JWTs stored in localStorage are accessible to JavaScript and vulnerable to XSS. Storing them in httpOnly cookies makes them invisible to scripts. The tradeoff is that CSRF protection needs to be considered — mitigated here by `SameSite=Lax` and Django's built-in CSRF middleware.

**Refresh token blacklisting**
With `ROTATE_REFRESH_TOKENS = True`, each refresh issues a new token pair. Without blacklisting, the old refresh token would remain valid until expiry — a stolen token could be used repeatedly. Adding `rest_framework_simplejwt.token_blacklist` ensures rotated tokens are invalidated immediately.

**Two API modules on the frontend (`api.ts` / `server-api.ts`)**
Server components and client components have fundamentally different ways of forwarding auth cookies. Server components use `next/headers` to read and forward the cookie manually; client components rely on the browser sending cookies automatically. Keeping these as separate modules prevents accidentally importing server-only code into client bundles.

**UUID primary keys**
Both `User` and `Note` use UUID PKs instead of auto-increment integers. This avoids leaking record counts, makes IDs safe to expose in URLs, and simplifies future data portability.

**Fixed global categories via seed migration**
Categories are not user-created — they're a fixed design choice. Seeding them in a data migration (`0002_seed_categories.py`) ensures every environment (dev, test, production) has consistent data without manual setup steps.

**Composite DB index on `(user, is_archived, -updated_at)`**
Every note list query filters by `user` and `is_archived` then sorts by `updated_at`. A composite index covering all three columns lets PostgreSQL satisfy the full query with a single index scan rather than filtering then sorting separately.

**`Q` objects for search instead of queryset `|`**
Using the `|` operator on two separately filtered querysets can break the preceding `select_related` chain and issue redundant queries. `Q(title__icontains=…) | Q(content__icontains=…)` keeps everything in a single query.

---

## AI Tools Used

**Claude Code**

Claude Code was used throughout the entire development and review process via its CLI.

- **Code review and analysis** — The `django-expert` skill (installed via `npx skills add`) was used to analyze the full backend. It read every file and produced a structured audit covering security, ORM correctness, dead code, and missing indexes. This surfaced issues like the broken `BLACKLIST_AFTER_ROTATION` flag and the `|` queryset bug that would have been easy to miss manually.

- **Refactoring** — After the audit, Claude Code applied all fixes directly: updated settings, rewrote the search filter, added indexes, created the migration file, and cleaned up dead code — all in a single session with no back-and-forth.

- **Documentation** — Both `CLAUDE.md` and this `README.md` were generated and kept in sync with the actual code structure by Claude Code, including updating them after the refactor to reflect what changed.

- **Skill discovery** — The `/find-skills` command was used to search for available Django skills from the open agent skills ecosystem before running the analysis, surfacing the `django-expert` skill as the most relevant option.
