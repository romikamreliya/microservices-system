# AI_RULE.md

> Coding standards & rules for AI assistants writing code in this repo.
> Read **AI_CONTEXT.md** first for architecture. When in doubt, mirror the surrounding code.

---

## 0. Golden rules

1. **CommonJS only.** `require` / `module.exports`. Never `import` / `export` in `.js`.
2. **Import shared code from the barrel** `@app/shared` — never deep-require `shared/**` internals from a service.
3. **Never build SQL with string concatenation.** Use Prisma, or mysql2 `?` placeholders. No exceptions.
4. **All HTTP responses go through `utils.response.send`** with a **defined `RES_CODES` type** (an unknown type returns 500). No raw `res.json` / `res.send` in controllers.
5. **Every controller handler is wrapped in `try/catch`** and returns an `INTERNAL_SERVER_ERROR` response on throw.
6. **Match the existing style** in the file/folder you touch over any general convention.

---

## 1. Module & export conventions

- **Stateful classes** (models, controllers, routes, configs) export a **singleton instance**:
  ```js
  class UserController { /* ... */ }
  module.exports = new UserController();
  ```
- **Stateless utility / middleware classes** use **static methods** and export the **class**:
  ```js
  class TokenService { static createJwtAccessToken(payload) { /* ... */ } }
  module.exports = TokenService;
  ```
- One primary export per file. Register any new shared module in [shared/index.js](shared/index.js).

---

## 2. Naming conventions

| Thing | Convention | Example |
|---|---|---|
| Files (shared) | `name.<layer>.js` | `auth.middleware.js`, `response.utils.js` |
| Files (service) | `name.controllers.js`, `name.model.js`, `api.routes.js` | `user.controllers.js`, `auth.controllers.js` |
| Classes | `PascalCase`, domain-named | `UserController`, `AuthController`, `ResponseUtils` |
| Controller handler methods | `PascalCase` verbs | `Get`, `Create`, `Update`, `Delete`, `UploadImg` |
| Other methods / functions | `camelCase` | `authenticateToken`, `gracefulShutdown` |
| Static constants | `UPPER_SNAKE` maps / `camelCase` groups | `RES_CODES`, `constants.role` |
| Variables | `camelCase` | `payload`, `findData` |
| Response `type` / message keys | `UPPER_SNAKE` | `SUCCESS`, `VALIDATION_ERROR`, `NOT_FOUND` |

---

## 3. Controller pattern (follow exactly)

```js
async Create(req, res) {
  try {
    const payload = { name: req.body?.name || "", email: req.body?.email || "" };

    const validate = utils.ajv.ajvCheck({
      name:  utils.ajv.prop("string", { minLength: 3 }),
      email: utils.ajv.prop("string", { minLength: 3, format: "customEmail" }),
    }, { required: ["name", "email"] });

    if (!validate(payload)) {
      return utils.response.send({ req, res, type: "VALIDATION_ERROR",
        key: utils.ajv.errorMsg({ error: validate.errors[0] }) });
    }

    const result = await usersModel.insert(payload);
    return utils.response.send({ req, res, type: "CREATED", data: result });
  } catch (error) {
    return utils.response.send({ req, res, type: "INTERNAL_SERVER_ERROR" });
  }
}
```

Rules:
- Build a whitelisted `payload` from `req.body` / `req.query` with safe defaults (`?.` + `||`).
- Validate with AJV **before** any DB work; return `VALIDATION_ERROR` on failure.
- Existence checks return `NOT_FOUND`; success returns the matching `RES_CODES` type + `data`.
- **`await` every async DB call** (models return promises).
- Do not leak raw errors to the client — respond with a generic type.

---

## 4. Routes pattern

- Class wrapping `express.Router`, exported as a singleton; `getRoutes()` returns the router.
- Reference the controller singleton (`this.userController`) and bind handlers: `.Get.bind(this.userController)`.
- Apply per-route authorization via `middlewares.auth.authorize({ "<module>": ["<action>"] })`
  (note: this guard is currently a stub — see §7).
- Group under a resource sub-path (`this.routes.use("/user", Router)`).
- Services mount routes under the version matcher `/^\/(v1|v2)/`.

---

## 5. Database rules

### Prefer the ORM (`baseModel`) for standard CRUD
- New models extend `database.baseModel`, pass `{ table, columns, primaryKey, limit }`, export a singleton.
- `table` must match the Prisma model delegate name in `schema.prisma`.
- Use `paginate({ page, limit, filters, order, select, pagination })` for list endpoints.
- Any new persisted field needs a `schema.prisma` change + `npx prisma migrate dev`, and should be
  added to the model's `columns` (so `clean()` keeps it on writes).

### Raw SQL via `database.mysql` — only when the ORM is a poor fit
- Use `await database.mysql.query(sql, params)` / `.execute(sql, params)`; destructure `const [rows] = ...`.
- **Always** parameterize with `?`. Values live in the params array, never in the SQL string.
- Use `database.mysql.transaction(async (conn) => { ... })` for multi-statement atomicity.
- Configure via discrete `DB_*` env vars (not `DATABASE_URL`, which belongs to Prisma).

---

## 6. Validation rules

- All external input is validated with `utils.ajv` before use.
- Define schemas with `prop(type, options)`; compile with `ajvCheck(schema, { required })`.
- Use registered custom formats (`customEmail`, `customPhone`, …) instead of ad-hoc regex where one fits.
- Surface the first error via `errorMsg({ error: validate.errors[0] })`.

---

## 7. Auth, errors & logging

- Protect routes with `authenticateToken` (sets `req.currentUser`) + `authorize(...)`.
  **`authorize()` is currently a passthrough stub** — if a task needs real RBAC, implement the
  commented permission check and ensure tokens carry a `permissions` claim.
- Throw `new utils.appError({ message, type })` for expected, typed failures; `type` must be a
  `RES_CODES` key. Let unexpected errors reach `middlewares.error.globalErrorHandler` (mounted last).
- Log with `utils.logger` (`info` / `warn` / `error` / `debug`) — including boot/lifecycle logs.
  The request logger's `console` output is the intentional exception; don't add new `console.log`.
- Never log secrets — the request logger already redacts sensitive fields; keep that list current.

---

## 8. Security rules

- Keep `helmet`, `cors`, body-size limits, request-id, and rate limiting intact.
- Read secrets from env (`accessTokenKey`, `refreshTokenKey`, `tokenEncryptionKey`, DB creds) — never hardcode.
- Never commit TLS private keys or real credentials (use placeholders in `.env.example`).
- Uploads: reuse `utils.upload` (image whitelist + 5MB cap); don't bypass its filter.
- Any endpoint that mints tokens/credentials must be gated (e.g. `ENV=development`) or credential-checked.

---

## 9. Adding things (checklists)

**New endpoint**
1. Controller method (validate → model/db → `response.send`) in the service's `controllers/`.
2. Register the route in `routes/api.routes.js` with `.bind()` and an `authorize(...)` guard.
3. Add any new message keys to `shared/language/en/message.js` and use a defined `RES_CODES` type.

**New shared utility / middleware**
1. Create `shared/utils/<name>.utils.js` or `shared/middleware/<name>.middleware.js` in the house style.
2. Export it from the barrel [shared/index.js](shared/index.js) under the right namespace.

**New service**
1. Add it to [config/services.js](config/services.js) (name, path, port) — PM2 + gateway pick it up.
2. Mirror an existing `index.js`: `dotenv` → `require("../../config/env").validate()` → `config/services`
   → `config/app.config` → routes → error handler, and `appConfig.listen(this.server, this.PORT)`.
3. Add a gateway proxy route in `api-gateway/index.js` and a `dev:<svc>` script in `package.json`.

---

## 10. Don'ts

- ❌ No ESM syntax, no TypeScript in runtime `.js`.
- ❌ No deep imports into `shared/**` from services — use `@app/shared`.
- ❌ No string-interpolated SQL, ever.
- ❌ No raw `res.json` / `res.status().send()` in controllers — use `utils.response.send` with a defined type.
- ❌ No unawaited async DB calls.
- ❌ Don't rely on the stubbed `authorize()` for real permission enforcement.
- ❌ Don't reintroduce the removed seeder scripts, the `DB_TYPE` switch, or a SQL-injection blocklist
  (see AI_CONTEXT §14) as if they exist / are needed.
