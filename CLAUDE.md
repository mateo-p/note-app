# Notes App — CLAUDE.md

This is a monorepo containing a Next.js frontend and a Django REST API backend for a personal note-taking application.

---

## Monorepo Structure

```
notes-app/
├── docker-compose.yml       # Spins up db + backend + frontend
├── .gitignore
├── CLAUDE.md                # This file
├── frontend/                # Next.js 15, App Router, TypeScript, Tailwind
└── backend/                 # Django 4.2, DRF, PostgreSQL, SimpleJWT
```

---

## Running the Project

**Everything runs through Docker Compose.**

```bash
# First time setup
cp backend/.env.example backend/.env

# Start all services (db → backend → frontend)
docker compose up --build

# Subsequent starts
docker compose up
```

Services:
- `http://localhost:3000` — Next.js frontend
- `http://localhost:8000` — Django API
- `localhost:5432` — PostgreSQL (user: notesapp, password: notesapp, db: notesapp)

Django migrations run automatically on backend container start.

---

## Backend (`backend/`)

### Stack
- **Django 4.2** + **Django REST Framework**
- **djangorestframework-simplejwt** — JWT auth stored in httpOnly cookies
- **psycopg2-binary** — PostgreSQL driver
- **django-cors-headers** — CORS for local dev

### Settings structure
```
config/settings/
├── base.py         # Shared settings (imported by all envs)
├── development.py  # DEBUG=True, CORS open to localhost:3000
├── production.py   # DEBUG=False, HTTPS cookies, HSTS, strict CORS
└── test.py         # SQLite in-memory, fast password hasher
```
Default settings module: `config.settings.development` (set in `manage.py`, `wsgi.py`, and `asgi.py`).
Override in production via `DJANGO_SETTINGS_MODULE` env var.

### Apps
```
apps/
├── common/     # BaseModel abstract model (UUID PK, created_at, updated_at)
├── users/      # Custom User model (email-based), auth views, cookie JWT
└── notes/      # Category + Note models, CRUD API
```

### Auth flow
- `POST /api/auth/signup/` and `POST /api/auth/login/` set two httpOnly cookies:
  - `access_token` (60 min lifetime)
  - `refresh_token` (7 day lifetime, rotates on refresh)
- `CookieJWTAuthentication` (`apps/users/authentication.py`) reads the access token from the cookie instead of the `Authorization` header.
- `POST /api/auth/refresh/` reads the refresh cookie and issues a new pair. Old refresh tokens are blacklisted after rotation (`token_blacklist` app).
- `POST /api/auth/logout/` deletes both cookies.

### Models

**User** (`apps/users/models.py`)
- `id` UUID PK
- `email` unique, used as USERNAME_FIELD
- `password` (hashed by Django)
- `created_at`

**Category** (`apps/notes/models.py`) — global, fixed, seeded via migration
- `id` auto int
- `name` unique
- `color` hex string e.g. `#E8956D`

Seed data (`apps/notes/migrations/0002_seed_categories.py`):
| Name | Color |
|------|-------|
| Random Thoughts | `#E8956D` |
| School | `#7BBFBB` |
| Personal | `#F5D79E` |
| Drama | `#B8D4B0` |

**Note** (`apps/notes/models.py`)
- `id` UUID PK
- `title` CharField (blank allowed)
- `content` TextField (blank allowed)
- `category` FK → Category (SET_NULL)
- `user` FK → User (CASCADE)
- `is_pinned` bool (default False)
- `is_archived` bool (default False)
- `created_at`, `updated_at` auto

Notes are ordered by `[-is_pinned, -updated_at]`.

DB indexes: composite `(user, is_archived, -updated_at)` and `is_pinned` — added in migration `0003`.

### API Endpoints
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

### Django conventions to follow
- New apps go in `apps/` with `name = 'apps.<appname>'` in `AppConfig`. Inherit from `BaseModel` for UUID PK + timestamps.
- All views are class-based (APIView or generics).
- Serializers live in `serializers.py`. `NoteSerializer` handles both reads and writes via `category` (read-only nested) and `category_id` (write-only FK).
- Permissions: default is `IsAuthenticated` globally. Only add `permission_classes = [AllowAny]` on public endpoints — do not repeat `IsAuthenticated` on views unnecessarily.
- Use `Q` objects for `OR` filter conditions — never use the `|` operator on querysets.
- Never put business logic in views — keep views thin, move logic to model methods or service functions.
- Add new migrations with `docker compose exec backend python manage.py makemigrations`.

---

## Frontend (`frontend/`)

### Stack
- **Next.js 15**, App Router, TypeScript
- **Tailwind CSS v4**
- Server Components for data fetching, Client Components for interactivity

### Key files
```
src/
├── middleware.ts         # Protects all routes; redirects to /login if no access_token cookie
├── app/
│   ├── layout.tsx        # Root layout (fonts, global CSS)
│   ├── page.tsx          # Dashboard (server component — fetches notes + categories SSR)
│   ├── login/page.tsx
│   └── signup/page.tsx
├── components/
│   ├── auth/AuthForm.tsx         # Login + signup form (client component)
│   └── notes/
│       ├── Dashboard.tsx         # Main notes view (client component)
│       ├── NoteCard.tsx          # Individual note card
│       ├── NoteEditor.tsx        # Full-screen note editor with auto-save
│       ├── CategorySidebar.tsx   # Left sidebar filter
│       └── EmptyState.tsx        # Shown when no notes exist
└── lib/
    ├── types.ts           # Shared TypeScript interfaces
    ├── api.ts             # Client-safe fetch wrapper (used in client components)
    └── server-api.ts      # Server-only fetch wrapper (used in server components only)
```

### API calling convention — IMPORTANT
There are two separate API modules. Use the right one:

| Context | Module | How it works |
|---|---|---|
| Client components (`"use client"`) | `lib/api.ts` | Calls `/api/*` (proxied by Next.js to Django). Browser sends cookies automatically. |
| Server components / page.tsx | `lib/server-api.ts` | Calls Django directly via `INTERNAL_API_URL`. Forwards cookies from `next/headers`. |

**Never import `lib/server-api.ts` in a client component** — it uses `next/headers` which is server-only.

### Routing and auth
- `src/middleware.ts` intercepts every request.
- If no `access_token` cookie → redirect to `/login`.
- If authenticated and on `/login` or `/signup` → redirect to `/`.
- The home page (`/`) is a dynamic server component that fetches data on each request.

### Next.js proxy
`next.config.ts` rewrites `/api/*` → `INTERNAL_API_URL/api/*` (defaults to `http://localhost:8000`).
This means client components always call `/api/...` — no hardcoded backend URL in client code.

### Frontend conventions to follow
- Pages in `app/` are server components by default — only add `"use client"` when you need hooks or browser APIs.
- Data mutations (create, update, delete) happen client-side via `lib/api.ts` and update local state immediately (optimistic where appropriate), then call `router.refresh()` to re-sync server state.
- All API errors are typed as `{ detail?: string }` — surface them in the UI, never swallow silently.
- Styles use inline `style` props with tokens from `lib/theme.ts` for colors and Tailwind for layout/spacing.
- Use `type` instead of `interface` for all TypeScript type definitions. Use intersection (`&`) instead of `extends`.
- Pure utility functions (e.g. date formatters) go in `lib/utils.ts`, not inside component files.
- Do not add new dependencies without a clear reason.

### Design tokens
```
Background:   #F2EAD3  (warm cream)
Text:         #5C4A1E  (dark brown)
Muted text:   #9C8564
Border:       #C9B89A
Fonts:        'Playfair Display' (headings/titles), 'Lato' (body)

Category colors:
  Random Thoughts  #E8956D  (salmon)
  School           #7BBFBB  (teal)
  Personal         #F5D79E  (yellow)
  Drama            #B8D4B0  (green)
```

---

## Environment Variables

### Backend (`backend/.env`)
```
SECRET_KEY=<required — raises ValueError if missing>
POSTGRES_DB=notesapp
POSTGRES_USER=notesapp
POSTGRES_PASSWORD=notesapp
POSTGRES_HOST=db
POSTGRES_PORT=5432
DJANGO_SETTINGS_MODULE=config.settings.development
```

### Backend production extras
```
ALLOWED_HOSTS=yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
DJANGO_SETTINGS_MODULE=config.settings.production
```

### Frontend (`frontend/.env.local`)
```
INTERNAL_API_URL=http://backend:8000
```

---

## Common Commands

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create a superuser
docker compose exec backend python manage.py createsuperuser

# Make new migrations after model changes
docker compose exec backend python manage.py makemigrations

# Django shell
docker compose exec backend python manage.py shell

# Next.js type check
docker compose exec frontend npx tsc --noEmit

# Rebuild a single service
docker compose up --build backend
```
