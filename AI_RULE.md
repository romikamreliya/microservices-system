# AI_RULE.md

> Coding standards & rules for AI assistants writing code in this repo.
> Read **AI_CONTEXT.md** first for architecture. When in doubt, mirror the surrounding code.

---

## 0. Golden rules

1. **CommonJS only.** `require` / `module.exports`. Never `import` / `export` in `.js`.
2. **Import shared code from the barrel** `@app/shared` — never deep-require `shared/**` internals from a service.
3. **Never build SQL with string concatenation.** Use Prisma, or mysql2 `?` placeholders. No exceptions.
4. **All HTTP responses go through `utils.response.send`.** No raw `res.json` / `res.send` in controllers.
5. **Every controller handler is wrapped in `try/catch`** and returns an `INTERNAL_SERVER_ERROR` response on throw.
6. **Match the existing style** in the file/folder you touch over any general convention.

---

## 1. Module & export conventions

- **Stateful classes** (models, controllers, routes, configs) export a **singleton instance**:
  ```js
  class UserModel extends database.baseModel { /* ... */ }
  module.exports = new UserModel();
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
| Files (service) | `name.controllers.js`, `name.model.js`, `api.routes.js` | `test.controllers.js` |
| Classes | `PascalCase` | `ResponseUtils`, `UserModel` |
| Controller handler methods | `PascalCase` verbs | `Get`, `Create`, `Update`, `Delete`, `UploadImg` |
| Other methods / functions | `camelCase` | `authenticateToken`, `getConfig` |
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
- Validate with AJV **before** any DB work; return `VALIDATION_ERROR` with `errorMsg` on failure.
- Existence checks return `NOT_FOUND`; success returns the matching `RES_CODES` type + `data`.
- Do not leak raw errors to the client — log if useful, respond with a generic type.

---

## 4. Routes pattern

- Class wrapping `express.Router`, exported as a singleton; `getRoutes()` returns the router.
- Mount handlers with `.bind()`: `this.testController.Get.bind(this.testController)`.
- Apply per-route authorization via `middlewares.auth.authorize({ "<module>": ["<action>"] })`.
- Group under a resource sub-path (`this.routes.use("/user", Router)`).
- Services mount routes under the version matcher `/^\/(v1|v2)/`.

---

## 5. Database rules

### Prefer the ORM (`baseModel`) for standard CRUD
- New models extend `database.baseModel`, pass `{ table, columns, primaryKey, limit }`, export a singleton.
- `table` must match the Prisma model delegate name in `schema.prisma`.
- Use `paginate({ page, limit, filters, order, select, pagination })` for list endpoints.
- Any new persisted field needs a matching `schema.prisma` change + Prisma migration, and should be
  added to the model's `columns` (so `clean()` keeps it).

### Raw SQL via `database.mysql` — only when the ORM is a poor fit
- Use the promise API: `await database.mysql.promise().query(sql, params)` / `.execute(sql, params)`.
- **Always** parameterize with `?`. Values live in the params array, never in the SQL string.
- Destructure results: `const [rows] = await database.mysql.promise().query(...)`.
- Do not hand-build `IN (...)` by concatenation — pass an array with `.query("... IN (?)", [arr])`.

---

## 6. Validation rules

- All external input is validated with `utils.ajv` before use.
- Define schemas with `prop(type, options)`; compile once with `ajvCheck(schema, { required })`.
- Use the registered custom formats (`customEmail`, `customPhone`, `customWebsite`, `customDate`, `customTime`)
  instead of ad-hoc regex where one fits.
- Surface the first error via `errorMsg({ error: validate.errors[0] })`.

---

## 7. Errors & logging

- Throw `new utils.appError({ message, type })` for expected, typed failures; `type` must be a
  `RES_CODES` key. The global error handler translates it into a response.
- Let unexpected errors reach `middlewares.error.globalErrorHandler` (mounted last in each service).
- Log with `utils.logger` (`info` / `warn` / `error` / `debug`). Do not add new `console.log` for
  production logging (existing request-logger console output is the exception, not the pattern to copy).

---

## 8. Security rules

- Keep `helmet`, `cors`, and body size limits from `config/app.config.js` intact.
- Never log secrets, tokens, or passwords.
- Read secrets from env (`accessTokenKey`, `refressTokenKey`, DB creds) — never hardcode.
- Enforce auth on protected routes via `authenticateToken` + `authorize(...)`.
- Uploads: reuse `utils.upload` (image whitelist + 5MB cap); don't bypass its filter.

---

## 9. Adding things (checklists)

**New endpoint**
1. Controller method (validate → model/db → `response.send`) in the service's `controllers/`.
2. Register the route in `routes/api.routes.js` with `.bind()` and an `authorize(...)` guard.
3. Add any new message keys to `shared/language/en/message.js`.

**New shared utility / middleware**
1. Create `shared/utils/<name>.utils.js` or `shared/middleware/<name>.middleware.js` in the house style.
2. Export it from the barrel [shared/index.js](shared/index.js) under the right namespace.

**New service**
1. Add it to [config/services.js](config/services.js) (name, path, port) — PM2 + gateway pick it up.
2. Mirror an existing service's `index.js` bootstrap (dotenv → services → app.config → routes → error handler).
3. Add a gateway proxy route in `api-gateway/index.js` and a `dev:<svc>` script in `package.json`.

---

## 10. Don'ts

- ❌ No ESM syntax, no TypeScript in runtime `.js`.
- ❌ No deep imports into `shared/**` from services — use `@app/shared`.
- ❌ No string-interpolated SQL, ever.
- ❌ No raw `res.json` / `res.status().send()` in controllers — use `utils.response.send`.
- ❌ No swallowing errors silently in a `catch` without a typed response.
- ❌ Don't rely on the stubbed `authorize()` for real permission enforcement — implement it if a task needs RBAC.
- ❌ Don't reintroduce the removed seeder scripts / `DB_TYPE` switch as if they exist (see AI_CONTEXT §14).
