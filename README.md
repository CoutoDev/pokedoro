# Pokédoro

A Pomodoro timer that rewards focus with a wild-caught Pokémon. Every completed focus session or break catches a Gen 1 Pokémon (species 1–151), weighted by rarity and phase, and adds it to a persistent collection.

Pokédoro is a full-stack Bun monolith: one `Bun.serve()` process serves the React SPA and a JSON API, backed by SQLite through Drizzle ORM.

## Getting started

```bash
bun install
cp .env.example .env   # set RESEND_API_KEY, OTP_FROM_EMAIL, OTP_SECRET (see below)
bun run db:migrate
bun dev                # http://localhost:3000, hot reload
```

Sign-in uses passwordless email OTP. Without `RESEND_API_KEY` set, the server logs OTP codes to the console instead of emailing them — fine for local development.

### Other commands

```bash
bun start              # production server (NODE_ENV=production)
bun run build          # production build to dist/
bun test               # run the test suite (coverage runs automatically)
bunx tsc --noEmit      # typecheck
bun run db:generate    # generate a Drizzle migration from schema.ts changes
```

### Environment variables

| Var | Purpose |
|---|---|
| `DATABASE_PATH` | SQLite file path. Defaults to `./pokedoro.db`. |
| `RESEND_API_KEY` | Sends OTP emails via Resend. Unset in dev falls back to console-logged codes; required in production. |
| `OTP_FROM_EMAIL` | From-address for OTP emails; must be a verified Resend sender/domain in production. |
| `OTP_SECRET` | HMAC pepper for stored OTP hashes. Required in production; generate with `openssl rand -hex 32`. |

## Architecture and engineering concepts

- **Enforced trust boundary.** `src/` splits into `client`, `server`, and `shared`. `client` never imports from `server`; both import from `shared`. This keeps server-only secrets and database access out of the bundle the browser receives.
- **Contract-first shared schemas.** Zod schemas in `shared/schemas/` define each API request/response shape once. Server handlers validate incoming requests against them; the client validates persisted/synced state against the same schemas before trusting it. One definition, so the two sides can't drift.
- **Feature-folder architecture.** Client code groups by bounded context (`features/timer`, `features/auth`, `features/pokemon`), not by technical layer. Each stateful feature follows the same Context + Reducer shape: a pure reducer for state transitions, and side effects (timers, persistence, network sync) isolated in colocated hooks.
- **Idempotent writes.** Completing a Pomodoro cycle and catching a Pokémon happen in one database transaction, keyed by a client-generated `cycleId` with a `UNIQUE` constraint. A retried request returns the existing result instead of creating a duplicate — safe against network retries and React's double-invocation in development.
- **Passwordless auth, minimal secrets at rest.** Sign-in uses emailed one-time codes. Only a SHA-256 hash of the session token and an HMAC-peppered hash of the OTP are stored; nothing recoverable from a database dump.
- **Swappable rate limiting.** Rate limiting sits behind a `RateLimiter` interface. The current implementation is in-memory and per-instance — a deliberate seam for swapping in a shared store (e.g. Redis) if the app ever runs more than one server instance.
- **Test-driven, coverage-enforced.** Client features, UI components, and the API client carry colocated tests held to 100% function/line coverage; pure utility functions are tested for behavior without being coverage-gated.

See `CLAUDE.md` for the full architecture reference, including the route table, component patterns, and testing conventions.
