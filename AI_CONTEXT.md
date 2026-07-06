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
| Raw SQL | `mysql2` connection pool |
| Auth | `jsonwebtoken` (JWT HS256) + custom AES-256-GCM tokens + HMAC refresh tokens |
| Validation | `ajv` (custom keywords + schema helpers) |
| Logging | `winston` (file + console) |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Uploads | `multer` (disk storage) |
| i18n | file-based message catalogs per language |
| Config | `dotenv` |
| Process manager | PM2 (`ecosystem.config.js`) |

---

## 3. Services & ports

Defined in [config/services.js](config/services.js):

| Service | Entry | Port | Role |
|---|---|---|---|
| `api-gateway` | `api-gateway/index.js` | 7000 | Reverse proxy / single entry point |
| `auth-service` | `services/auth/index.js` | 7001 | Authentication endpoints |
| `user-service` | `services/users/index.js` | 7002 | User CRUD + uploads |

**Gateway routing:** `/auth/*` → auth-service, `/users/*` → user-service. The gateway
re-serializes JSON bodies for proxied requests and passes `multipart/form-data` through untouched.

---

## 4. Folder structure

```
Microservice-sys/
├── api-gateway/            # Reverse proxy entry point
│   └── index.js
├── services/
│   ├── auth/               # Auth microservice
│   │   ├── controllers/    # *.controllers.js  (class, singleton export)
│   │   ├── routes/         # api.routes.js      (class-based Router)
│   │   └── index.js        # bootstraps Express + http server
│   └── users/
│       ├── controllers/
│       ├── model/          # *.model.js         (extends shared baseModel)
│       ├── routes/
│       └── index.js
├── shared/                 # @app/shared — consumed by all services
│   ├── index.js            # BARREL: single export surface
│   ├── constants/
│   ├── database/
│   │   ├── connection.js   # Prisma / SQLite client
│   │   ├── baseModel.js    # Base ORM class (CRUD + paginate + sanitize)
│   │   └── mysql.js        # mysql2 raw-SQL connection pool
│   ├── language/en/message.js
│   ├── middleware/         # *.middleware.js    (static-method classes)
│   └── utils/              # *.utils.js
├── config/
│   ├── app.config.js       # Express app: helmet/cors/body-parser (singleton)
│   └── services.js         # service registry (names, paths, ports)
├── prisma/
│   ├── schema.prisma       # provider = sqlite, model User
│   ├── generated/          # generated Prisma client (output = ./generated)
│   └── migrations/
├── crt/                    # localhost TLS cert/key
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
| `middlewares` | `auth`, `error`, `rateLimit`, `requestLogger` |
| `utils` | `ajv`, `date`, `helper`, `i18n`, `logger`, `memory`, `response`, `token`, `appError`, `upload` |

---

## 6. Database layer

Two complementary access paths coexist, both surfaced through `database` on the barrel:

### 6a. ORM path — Prisma + `baseModel` (primary)

- [shared/database/connection.js](shared/database/connection.js) builds a Prisma client with the
  better-sqlite3 adapter from `DATABASE_URL` (a SQLite `file:` URL). Exported as the client singleton.
- [shared/database/baseModel.js](shared/database/baseModel.js) is the base class for all models.
  Methods: `get`, `find`, `findOne`, `insert`, `update`, `delete`, `count`, `paginate({...})`.
  `clean()` / `sanitize()` strip unknown columns and reject obvious SQL-injection strings before writes.
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

`table` must equal the Prisma model delegate name (e.g. `User`). This is the default path — prefer it
for standard CRUD.

### 6b. Raw SQL path — mysql2 pool (`database.mysql`)

[shared/database/mysql.js](shared/database/mysql.js) exports a **`mysql2` connection pool** created
from `DATABASE_URL` (expects a `mysql://user:pass@host:3306/db` connection string). Use it when a
query is clearer/faster as raw SQL than through the ORM. The pool is lazy — no connection opens until
the first query.

Run **parameterized** queries with `?` placeholders. Use the promise wrapper for async/await:

```js
const { database } = require("@app/shared");

// SELECT
const [rows] = await database.mysql.promise().query(
  "SELECT id, name, email FROM users WHERE email = ?", [email]
);

// Prepared statement
const [rows2] = await database.mysql.promise().execute(
  "SELECT * FROM users WHERE id = ?", [id]
);
```

**Safety rule (non-negotiable):** every dynamic value must go through a `?` placeholder. Never
string-concatenate or template-interpolate user input into SQL.

> Note: `mysql.js` reads `DATABASE_URL`, not the discrete `DB_HOST/DB_PORT/...` vars in `.env.example`,
> and `DB_TYPE` is currently not read by any code. See §14.

---

## 7. Request lifecycle

```
client → api-gateway (7000)
       → http-proxy-middleware → target service (7001/7002)
       → app.config middlewares (helmet, cors, body-parser)
       → route matcher /^\/(v1|v2)/
       → [auth.authenticateToken]          (user-service mounts it globally; auth-service does not)
       → route → [auth.authorize({...})]    (per-route permission gate — see §9)
       → controller (validate → model / db → response.send)
       → error.globalErrorHandler (tail middleware)
```

- **Routes**: class wrappers around `express.Router`, exported as singletons, mounted under a
  sub-path (e.g. `/user`). Handlers are bound: `this.ctrl.Method.bind(this.ctrl)`.
- **Controllers**: singleton classes. Each handler: build `payload` → AJV validate →
  call model / `database.mysql` → return via `utils.response.send`.

---

## 8. Response & i18n contract

All responses go through [utils.response.send](shared/utils/response.utils.js):

```js
utils.response.send({ req, res, type: "SUCCESS", data });          // success
utils.response.send({ req, res, type: "VALIDATION_ERROR", key });  // error w/ message key
```

- `type` is a key in `RES_CODES` → maps to HTTP status + success flag.
- Message text resolved by [i18n.utils](shared/utils/i18n.utils.js) from
  `shared/language/<lang>/message.js` via `req.lang` (falls back to `default_language`).
- Envelope: `{ success, code, message, data }` (error responses omit `data`).

---

## 9. Auth & tokens

- [shared/utils/token.utils.js](shared/utils/token.utils.js) — `TokenService` (static methods):
  JWT access (HS256, 15m, secret `accessTokenKey`), AES-256-GCM custom tokens (24h),
  HMAC refresh tokens (7d, secret `refressTokenKey`). Verify methods return `{ ok, data?, error? }`.
- [middlewares.auth](shared/middleware/auth.middleware.js):
  - `authenticateToken` — reads `Bearer` token, verifies JWT, sets `req.currentUser`.
  - `authorize(permissions)` — factory returning a guard. **The permission-matching logic is
    currently commented out (passthrough after the auth check).** Treat as a stub, not working RBAC.

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

## 11. Other utilities

| Util | Role |
|---|---|
| `utils.logger` | Winston singleton — `info/warn/error/debug`, dated log files under `./logs`, console in dev/DEBUG. |
| `utils.upload` | `multer` disk-storage **class** — image-only (jpg/png/webp, 5MB); `getUploadMiddleware()`, `deleteFile`, `getFileInfo`. Instantiate: `new utils.upload()`. |
| `utils.appError` | `AppError({ message, type })` — `type` maps to a `RES_CODES` key; handled by the global error handler. |
| `utils.date` | Large date helper **singleton** (format/add/diff/compare). |
| `utils.helper` | Small helpers (e.g. `getVersion`). |
| `utils.memory` | Process-memory sampling / optional monitor. |
| `middlewares.rateLimit` | `express-rate-limit` default limiter (10/min, skips successful). |
| `middlewares.requestLogger` | Logs `--> / <--` request/response lines with duration. |
| `middlewares.error` | `globalErrorHandler` — handles `AppError`, logs unexpected, returns 500. |

---

## 12. Config & environment

- [config/app.config.js](config/app.config.js) — singleton `AppConfig` wiring helmet (CSP/HSTS),
  cors (origins from `ALLOWED_ORIGINS`), body-parser (10mb), static `/public`. Services reuse `appConfig.app`.
- Env keys (see [.env.example](.env.example)): `DATABASE_URL`, `DB_TYPE` (+ discrete `DB_*`),
  `ALLOWED_ORIGINS`, `accessTokenKey`, `refressTokenKey`, mail settings, upload `path`,
  `default_language`, `HTTPS_ENABLED`, `ENABLE_MEMORY_MONITORING`.

---

## 13. Scripts & workflows

From root [package.json](package.json):

```bash
npm run dev:gateway   # node api-gateway/index.js
npm run dev:auth      # node services/auth/index.js
npm run dev:users     # node services/users/index.js
npm run migrate       # node prisma/script.js   (see §14 — currently broken)
```

- Prisma schema/migrations use the Prisma CLI via [prisma.config.ts](prisma.config.ts).
- PM2: `pm2 start ecosystem.config.js` runs all three services in fork mode.

---

## 14. Known gaps (accurate as of this revision — do not document as working)

- **`authorize()` RBAC is stubbed** — permission matching is commented out; any authenticated user passes.
- **`npm run migrate` is broken** — `prisma/script.js` `require`s `../src/infra/database/connection`,
  a path that does not exist in the tree. `prisma/seeder/` is empty.
- **Old README seeder pipeline is gone** — `scripts/`, `prisma/seeders/`, and the `npm run seed*`
  commands described in `README.md` are not present. Ignore those instructions.
- **DB config is not fully wired** — `DB_TYPE` is defined in `.env.example` but read nowhere in code;
  `mysql.js` uses `DATABASE_URL` (a `mysql://` string) rather than the discrete
  `DB_HOST/DB_PORT/DB_DATABASE/DB_USER/DB_PASSWORD` vars. Prisma and mysql2 both read `DATABASE_URL`,
  so only one engine's URL format can be active at a time.
- **`mysql2` version pins differ** — root `^3.22.5` vs `shared/package.json` `^3.17.2`; installed is 3.22.5.
