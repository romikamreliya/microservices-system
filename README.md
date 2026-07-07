# Microservice-sys

A Node.js microservices system: an **API Gateway** that reverse-proxies to independent
**Express** services, with all cross-cutting concerns in a shared workspace package (`@app/shared`).

> For a deep dive into architecture, conventions, and the database layer see
> [AI_CONTEXT.md](AI_CONTEXT.md) and [AI_RULE.md](AI_RULE.md).

## Stack

Node.js `>=24` (CommonJS) · Express 5 · `http-proxy-middleware` · Prisma 7 (SQLite) ·
`mysql2` (optional raw SQL) · JWT + AES tokens · AJV · Winston · Helmet/CORS/rate-limit · PM2.

## Services

| Service | Port | Responsibility |
|---|---|---|
| `api-gateway` | 7000 | Single entry point; proxies `/auth/*` → auth, `/users/*` → users |
| `auth-service` | 7001 | Authentication endpoints |
| `user-service` | 7002 | User CRUD + image upload |

## Project layout

```
api-gateway/      Reverse proxy
services/         auth/, users/  (controllers, routes, model, index.js)
shared/           @app/shared — database, middleware, utils, constants, language
config/           app.config.js, services.js, env.js
prisma/           schema.prisma, migrations, generated client
```

## Quick start

```bash
# 1. Install (npm workspaces)
npm install

# 2. Configure environment
cp .env.example .env
#   set at least: DATABASE_URL, accessTokenKey, refreshTokenKey

# 3. Set up the database (Prisma + SQLite by default)
npx prisma migrate dev

# 4. Run each process (separate terminals)
npm run dev:gateway   # :7000
npm run dev:auth      # :7001
npm run dev:users     # :7002
```

Or run everything under PM2:

```bash
pm2 start ecosystem.config.js
```

Each service validates required env vars at boot and exits with a clear message if any are missing.

## Endpoints

Every process exposes an unauthenticated `GET /health`.

Through the gateway (`:7000`):

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/auth/v1/user/token` | — | Dev-only helper; mints a test JWT (disabled unless `ENV=development`) |
| GET | `/users/v1/user/get` | Bearer | List users (supports `page`, `limit`, `pagination`, `search`) |
| POST | `/users/v1/user/create` | Bearer | Create user (`name`, `email`) |
| PUT | `/users/v1/user/update` | Bearer | Update user (`id`, …) |
| DELETE | `/users/v1/user/delete` | Bearer | Delete user (`id`) |
| POST | `/users/v1/user/upload` | Bearer | Image upload (`reviewProfile`) |

Send the token as `Authorization: Bearer <token>`. Responses use a uniform envelope
`{ success, code, message, data }`; a correlation id is returned on `X-Request-ID`.

## Database

- **Default:** Prisma + SQLite. `DATABASE_URL="file:./dev.db"`. Models extend the shared
  `baseModel` (CRUD + pagination).
- **Optional raw SQL:** `mysql2` pool exposed as `database.mysql`, configured via the discrete
  `DB_HOST/DB_PORT/DB_DATABASE/DB_USER/DB_PASSWORD` variables. Use parameterized (`?`) queries;
  a `transaction(cb)` helper is provided.

## Scripts

```bash
npm run dev:gateway   # start the API gateway
npm run dev:auth      # start the auth service
npm run dev:users     # start the user service
npx prisma migrate dev   # create/apply migrations and regenerate the client
```
