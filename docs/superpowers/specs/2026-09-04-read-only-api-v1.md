# Bizim Skor Read-Only API v1 Design

## Goal
Expose selected Bizim Skor data through a read-only API without changing the existing game UI, prediction flow, scoring flow, notifications, or existing database records.

## Safety boundary
- No INSERT, UPDATE, DELETE, UPSERT, RPC mutation, or admin write action in v1.
- Existing frontend files are not modified for API v1.
- Sensitive player fields are never returned: `pin_hash`, `device_id`, `force_pin_once`.
- API errors must fail closed and return JSON; they must not affect the game UI.
- Production rollout happens only after API tests pass and the API is verified independently.

## Architecture
API v1 is implemented as an isolated Supabase Edge Function named `bizim-skor-api`. It reads from the same Supabase project as the game but exposes only an allow-listed set of fields and routes. The web game continues using its existing code paths unchanged. A Vercel `/api` proxy can be added later if we want a `bizim-skor-live.vercel.app/api/...` public address, but that proxy is not required for the first safe release.

## Initial routes
- `GET /health` — API health/version, no database access.
- `GET /fixtures?week=N` — Süper Lig fixtures with optional week filter.
- `GET /results?week=N` — Süper Lig results joined to fixture information.
- `GET /champions/fixtures?week=N` — Champions League fixtures.
- `GET /champions/results?week=N` — Champions League results joined to fixtures.

## Deferred routes
Ranking endpoints are deferred until the exact scoring/ranking logic is extracted and tested against the current game so the API cannot disagree with the live UI. Player/private prediction endpoints and all write endpoints are explicitly out of scope for v1.

## Response conventions
Every success response is JSON with `ok: true`, `data`, and `meta`. Every error is JSON with `ok: false` and an `error` object. Unknown routes return 404. Unsupported methods return 405.

## Security
The function is read-only by implementation. Only public match data is returned. No secret player fields are selected. CORS is limited to GET/OPTIONS behavior. If a public unauthenticated endpoint is later required, a custom API key/rate-limit layer should be added before broad external distribution.
