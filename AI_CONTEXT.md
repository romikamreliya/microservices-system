# AI_CONTEXT.md

> Primary architecture & context reference for AI coding assistants working in this repo.
> Pair with **AI_RULE.md** (coding standards & rules). Keep both in sync with the code.

---

## 1. What this project is

A **Node.js microservices system** built as an **npm workspaces monorepo**. An API Gateway
reverse-proxies requests to independent Express services. All cross-cutting concerns
(database, auth, validation, logging, i18n, uploads, responses) live in one shared package,
`@app/shared`, consumed by every service.

- **Runtime:** Node.js `>= 24`, **CommonJS** (`require` / `module.exports`).
- Not ESM — do **not** use `import` / `export` in runtime `.js` files.

---

## 2. Technology stack

| Concern | Choice |
|---|---|
| HTTP framework | Express 5 |
| Gateway routing | `http-proxy-middleware` |
| ORM | Prisma 7 + `@prisma/adapter-better-sqlite3` (SQLite) |
| Raw SQL | `mysql2` promise pool |
| Auth | `jsonwebtoken` (JWT HS256) + custom AES-256-GCM tokens + HMAC refresh tokens |
| Validation | `ajv` (custom keywords + schema helpers) |
| Logging | `winston` (file + console) |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Uploads | `multer` (disk storage) |
| i18n | file-based message catalogs per language |
| Config / env | `dotenv` + a fail-fast validator (`config/env.js`) |
| Process manager | PM2 (`ecosystem.config.js`) |

---

## 3. Services & ports

Defined in [config/services.js](config/services.js):

| Service | Entry | Port | Role |
|---|---|---|---|
| `api-gateway` | `api-gateway/index.js` | 7000 | Reverse proxy / single entry point + edge rate limiting |
| `auth-service` | `services/auth/index.js` | 7001 | Authentication endpoints |
| `user-service` | `services/users/index.js` | 7002 | User CRUD + uploads |

**Gateway routing:** `/auth/*` → auth-service, `/users/*` → user-service. The gateway
re-serializes JSON bodies, passes `multipart/form-data` through untouched, and forwards the
`X-Request-ID` correlation header downstream.

---

## 4. Folder structure

```
Microservice-sys/
├── api-gateway/            # Reverse proxy entry point
│   └── index.js
├── services/
│   ├── auth/
│   │   ├── controllers/    # auth.controllers.js  (AuthController, singleton)
│   │   ├── routes/         # api.routes.js         (class-based Router)
│   │   └── index.js        # bootstraps Express + http server
│   └── users/
│       ├── controllers/    # user.controllers.js   (UserController, singleton)
│       ├── model/          # users.model.js        (extends shared baseModel)
│       ├── routes/
│       └── index.js
├── shared/                 # @app/shared — consumed by all services
│   ├── index.js            # BARREL: single export surface
│   ├── constants/
│   ├── database/
│   │   ├── connection.js   # Prisma / SQLite client
│   │   ├── baseModel.js    # Base ORM class (CRUD + paginate + sanitize) + this.mysql
│   │   └── mysql.js        # mysql2 promise pool + transaction() helper
│   ├── language/en/message.js
│   ├── middleware/         # *.middleware.js  (static-method classes)
│   └── utils/              # *.utils.js
├── config/
│   ├── app.config.js       # Express app + health + graceful shutdown + listen()
│   ├── services.js         # service registry (names, paths, ports)
│   └── env.js              # fail-fast env validation (no @app/shared dependency)
├── prisma/
│   ├── schema.prisma       # provider = sqlite, model User (with timestamps + name index)
│   ├── generated/          # generated Prisma client (output = ./generated)
│   └── migrations/
├── crt/                    # localhost TLS cert (private key is gitignored)
├── ecosystem.config.js     # PM2 apps derived from config/services.js
├── prisma.config.ts        # Prisma CLI config (DATABASE_URL datasource)
└── .env.example
```

---

## 5. The shared package (`@app/shared`)

Everything is re-exported through the barrel [shared/index.js](shared/index.js). **Always import
from the barrel**; never reach into internal shared files directly from a service.

```js
const { constants, database, language, middlewares, utils } = require("@app/shared");
```

| Namespace | Members |
|---|---|
| `constants` | `constants` (roles, pagination, regex) |
| `database` | `baseModel`, `mysql` |
| `language.en` | `message` |
| `middlewares` | `auth`, `error`, `rateLimit`, `requestId`, `requestLogger` |
| `utils` | `ajv`, `date`, `helper`, `i18n`, `logger`, `memory`, `response`, `token`, `appError`, `upload` |

---

## 6. Database layer

Two complementary access paths coexist, both surfaced through `database` on the barrel and both
available on any model instance (`this.db` = Prisma, `this.mysql` = mysql2 pool).

### 6a. ORM path — Prisma + `baseModel` (primary)

- [shared/database/connection.js](shared/database/connection.js) builds the Prisma client with the
  better-sqlite3 adapter from `DATABASE_URL` (a SQLite `file:` URL). Exported as the client singleton.
- [shared/database/baseModel.js](shared/database/baseModel.js) is the base class for all models.
  Methods: `get`, `find`, `findOne`, `insert`, `update`, `delete`, `count`, `paginate({...})`.
  `clean()` whitelists `columns` + `hidden`; `sanitize()` trims strings and strips null bytes
  (there is intentionally **no** SQL-injection blocklist — parameterization handles safety).
- Models extend it and export a **singleton**. Example
  [services/users/model/users.model.js](services/users/model/users.model.js):

```js
const { database } = require("@app/shared");
class UserModel extends database.baseModel {
  constructor() {
    super({ table: "User", columns: ["id", "name", "email"], primaryKey: "id", limit: 20 });
  }
}
module.exports = new UserModel();
```

`table` must equal the Prisma model delegate name (e.g. `User`).

### 6b. Raw SQL path — mysql2 pool (`database.mysql`)

[shared/database/mysql.js](shared/database/mysql.js) exports a **mysql2 promise pool**. Config comes
from the discrete `DB_HOST/DB_PORT/DB_DATABASE/DB_USER/DB_PASSWORD` vars (so it does **not** collide
with Prisma's `DATABASE_URL`), falling back to a `mysql://` `DATABASE_URL` only if `DB_HOST` is unset.
The pool is lazy — no connection until first query.

```js
const { database } = require("@app/shared");

const [rows] = await database.mysql.query(
  "SELECT id, name, email FROM users WHERE email = ?", [email]   // parameterized
);

await database.mysql.transaction(async (conn) => {
  await conn.execute("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amt, from]);
  await conn.execute("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amt, to]);
});
```

- `query` / `execute` — parameterized statements (`?` placeholders). Returns `[rows, fields]`.
- `getConnection` — a pooled connection.
- `transaction(cb)` — begin/commit/rollback/release wrapper.

**Safety rule (non-negotiable):** every dynamic value goes through a `?` placeholder. Never
concatenate or template-interpolate user input into SQL.

---

## 7. Request lifecycle

```
client → api-gateway (7000)
       → app.config middlewares: requestId → helmet → body-parser → requestLogger(skip /health,/public)
       → /health (short-circuits)   OR   rate-limit (edge) → http-proxy-middleware → service (7001/7002)
       → service app.config middlewares (same chain; reuses forwarded X-Request-ID)
       → route matcher /^\/(v1|v2)/
       → [auth.authenticateToken]           (user-service mounts it globally; auth-service does not)
       → route → [auth.authorize({...})]     (per-route gate — currently a STUB, see §9)
       → controller (validate → model / db → response.send)
       → error.globalErrorHandler (tail middleware)
```

- Bootstrapping is centralized: each entry point calls `appConfig.listen(server, port)`, which logs
  via winston and wires **graceful shutdown** (SIGTERM/SIGINT drain).
- Every process exposes an unauthenticated `GET /health`.
- **Rate limiting is applied only at the gateway edge** (keying by client IP before proxying), not on
  services behind the proxy.

---

## 8. Response & i18n contract

All responses go through [utils.response.send](shared/utils/response.utils.js):

```js
utils.response.send({ req, res, type: "SUCCESS", data });          // success
utils.response.send({ req, res, type: "VALIDATION_ERROR", key });  // error w/ message key
```

- `type` is a key in `RES_CODES` → HTTP status + success flag. Success keys include
  `SUCCESS`(200), `CREATED`(201), `UPDATED`(200), `DELETE`/`DELETED`(200). Error keys include
  `VALIDATION_ERROR`(422), `NOT_FOUND`(404), `UNAUTHORIZED`(401), `FORBIDDEN`(403),
  `INTERNAL_SERVER_ERROR`(500). **An unknown `type` falls through to a 500** — only use defined keys.
- Message text resolved by [i18n.utils](shared/utils/i18n.utils.js) from
  `shared/language/<lang>/message.js`. The language is validated against a **whitelist** of existing
  language folders (`req.lang` cannot be used to build an arbitrary require path).
- Envelope: `{ success, code, message, data }` (error responses omit `data`).
- A correlation id is returned on `X-Request-ID` and included in request logs.

---

## 9. Auth & tokens

- [shared/utils/token.utils.js](shared/utils/token.utils.js) — `TokenService` (static methods):
  JWT access (HS256, 15m, `accessTokenKey`), AES-256-GCM custom tokens (24h; key derived from
  `tokenEncryptionKey` + `tokenEncryptionSalt`, falling back to `accessTokenKey`), HMAC refresh
  tokens (7d; `refreshTokenKey`, legacy `refressTokenKey` still accepted). Verify → `{ ok, data?, error? }`.
- [middlewares.auth](shared/middleware/auth.middleware.js):
  - `authenticateToken` — reads `Bearer` token, verifies JWT, sets `req.currentUser`.
  - `authorize(permissions)` — factory returning a guard. **The permission-matching logic is a
    commented-out STUB; it currently allows any authenticated user.** Not real RBAC yet.
- `GET /auth/v1/user/token` mints a signed test token **only when `ENV=development`** (returns 404
  otherwise). The token includes a `permissions` claim; a real credential-checked login should replace it.

---

## 10. Validation (AJV)

[utils.ajv](shared/utils/ajv.utils.js) — `ValidationUtils` (static). Build schemas with `prop(type, opts)`,
compile with `ajvCheck(schema, { required })`, format failures with `errorMsg({ error })`.
Custom formats: `customEmail`, `customPhone`, `customWebsite`, `customDate`, `customTime`.

```js
const validate = utils.ajv.ajvCheck({
  name:  utils.ajv.prop("string", { minLength: 3 }),
  email: utils.ajv.prop("string", { minLength: 3, format: "customEmail" }),
}, { required: ["name", "email"] });

if (!validate(payload)) {
  return utils.response.send({ req, res, type: "VALIDATION_ERROR",
    key: utils.ajv.errorMsg({ error: validate.errors[0] }) });
}
```

---

## 11. Middleware & utilities

| Member | Role |
|---|---|
| `middlewares.requestId` | Reuses/generates `X-Request-ID`, sets `req.id`, echoes header. Mounted first. |
| `middlewares.requestLogger` | Logs `--> / <--` lines with `req.id` + duration; **redacts** password/token/etc.; `skip([...])` bypasses paths. |
| `middlewares.rateLimit` | `express-rate-limit` default limiter (10/min, skips successful). Mounted **at the gateway only**. |
| `middlewares.error` | `globalErrorHandler` — handles `AppError`, logs unexpected, returns 500. |
| `utils.logger` | Winston singleton — `info/warn/error/debug`, dated log files under `./logs`, console in dev/DEBUG. Used for boot logs. |
| `utils.upload` | `multer` disk-storage **class** — image-only (jpg/png/webp, 5MB). Instantiate: `new utils.upload()`. |
| `utils.appError` | `AppError({ message, type })` — `type` maps to a `RES_CODES` key. |
| `utils.token` / `utils.ajv` / `utils.i18n` / `utils.response` | See §8–§10. |
| `utils.date` | Date helper **singleton**. `utils.helper` — small helpers (`getVersion`). `utils.memory` — memory sampling. |

---

## 12. Config & environment

- [config/app.config.js](config/app.config.js) — singleton `AppConfig`: middleware chain, `/health`,
  `gracefulShutdown(server)`, and `listen(server, port)`. Services reuse `appConfig.app`.
- [config/env.js](config/env.js) — `validate()` runs at the top of each entry point (after
  `dotenv.config()`, **before** `@app/shared`) and exits with a clear message if required vars are
  missing. Required: `DATABASE_URL`, `accessTokenKey`, and a refresh secret (`refreshTokenKey` or legacy).
- Env keys (see [.env.example](.env.example)): `NAME`, `ENV`, `DATABASE_URL`, discrete `DB_*`,
  `ALLOWED_ORIGINS`, `accessTokenKey`, `refreshTokenKey`, `tokenEncryptionKey`, `tokenEncryptionSalt`,
  mail settings, upload `path`, `default_language`, `HTTPS_ENABLED`, `ENABLE_MEMORY_MONITORING`.

---

## 13. Scripts & workflows

From root [package.json](package.json):

```bash
npm run dev:gateway   # node api-gateway/index.js   (:7000)
npm run dev:auth      # node services/auth/index.js  (:7001)
npm run dev:users     # node services/users/index.js (:7002)
npx prisma migrate dev   # create/apply migrations + regenerate client
```

- PM2: `pm2 start ecosystem.config.js` runs all three services in fork mode.
- The `User` model has `createdAt` / `updatedAt` and an index on `name`.

---

## 14. Known gaps (accurate as of this revision — do not document as working)

- **`authorize()` RBAC is a stub** — permission matching is commented out; any authenticated user passes.
  (The dev `/token` already issues a `permissions` claim, ready for when it's enabled.)
- **`npm run migrate` is broken** — `prisma/script.js` `require`s `../src/infra/database/connection`,
  a path that does not exist. Use `npx prisma migrate dev` instead. `prisma/seeder/` is empty.
- **`DB_TYPE` is unused** — it exists in `.env.example` but no code reads it. Engine choice is implicit:
  Prisma always uses `DATABASE_URL` (SQLite); mysql2 uses the discrete `DB_*` vars.
- **HTTPS is wired but off** — every server uses plain `http`; `appConfig.crt` is a lazy getter and the
  TLS **private key is gitignored** (rotate it — it existed in history before being untracked).
