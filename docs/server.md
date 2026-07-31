# Server: routes, auth, persistence

> Extracted from `CLAUDE.md` (kept in sync there — this is a readable excerpt, not a separate source of truth). See also [Architecture](./architecture.md) for the `shared/schemas` contracts these handlers validate against.

`server/index.ts` is the composition root: the route table below, the request body-size cap, HMR config, and the periodic auth-record purge scheduler (`server/lib/cleanup.ts`, every 15 minutes).

| Route | Handler | Notes |
|---|---|---|
| `POST /api/auth/request-otp` | `server/api/auth/requestOtp.ts` | Parses email, rate-limits (per-email + per-IP), calls `requestOtpForEmail` |
| `POST /api/auth/verify-otp` | `server/api/auth/verifyOtp.ts` | Parses email+code, rate-limits (per-IP), calls `verifyOtpAndSignIn` |
| `GET /api/auth/me` | `server/api/auth/me.ts` | Resolves the session cookie to a user |
| `POST /api/auth/logout` | `server/api/auth/logout.ts` | CSRF-checked; destroys the session, clears the cookie |
| `POST /api/cycles` | `server/api/cycles.ts` | CSRF + session checked; records a completed Pomodoro cycle and its Pokémon catch atomically |
| `GET /api/pokemon-catches` | `server/api/pokemonCatches.ts` | Session checked; groups catches by species (count + most recent `caughtAt`), sorted by species ID |
| `GET`/`PUT` `/api/timer-state` | `server/api/timerState.ts` | Session checked (PUT also CSRF-checked); syncs `PomodoroCycle` JSON per user |
| `/*` | `src/client/index.html` | SPA fallback |

**Auth flow (passwordless email OTP)**: the two genuinely complex flows live in `server/auth/service.ts` as plain-data use cases — `requestOtpForEmail(email)` and `verifyOtpAndSignIn(email, code)` — extracted from their HTTP handlers, which shrink to parse → rate-limit/CSRF → call service → serialize. `verifyOtpAndSignIn` atomically claims an OTP attempt (a single `UPDATE ... WHERE attempts < OTP_MAX_ATTEMPTS` statement — see its comment for why this must not be a separate read+write), registers a new user on first sign-in, and returns a discriminated outcome (`expired_or_not_found` / `too_many_attempts` / `invalid_code` / `user_creation_failed` / `success`) that the handler maps to a status code and body. Only the session token's SHA-256 hash and an HMAC-peppered OTP hash are ever stored — nothing recoverable from a DB dump.

**`server/lib/rateLimit.ts`** wraps its state behind a `RateLimiter` interface (`InMemoryRateLimiter` implements it); `consumeRateLimit`/`resetRateLimits`/`getClientIp` are the stable call-site API. The in-memory implementation is per-instance and loses state on restart — it's the component to replace with a shared-store (e.g. Redis) implementation the day this app runs more than one server instance.

**`server/db/schema.ts`** (Drizzle, SQLite): `users`, `otp_codes`, `sessions`, `pomodoro_cycles`, `timer_states` (one JSON blob per user, keyed by `userId`, validated on write against `timerStateWireSchema`), `pokemon_catches` (`userId` FK + index, `cycleId` FK with a `UNIQUE` index enforcing at-most-one-catch-per-cycle, `speciesId`, `caughtAt`).
