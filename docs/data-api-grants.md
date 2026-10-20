# Explicit Data API grants

Supabase's October 30, 2026 default change affects newly created tables;
existing grants remain unchanged. Table grants and row-level security are
separate checks. See https://supabase.com/docs/guides/api/securing-your-api.

The server paths currently relying on automatic table grants during a new
installation now declare their minimum permissions in their creation SQL:

| Table | Role | Direct caller | Required privileges |
| --- | --- | --- | --- |
| `live_fixture_links` | `service_role` | `live-score-sync` | SELECT, INSERT, UPDATE |
| `live_score_cache` | `service_role` | `notification-dispatch` | SELECT |
| `push_delivery_log` | `service_role` | `notification-dispatch` | SELECT, INSERT, UPDATE, DELETE |

Live observation and finalization RPCs execute as their owner; they do not
need new client table grants. Keep their existing authorization checks and
function permissions. Internal support, PIN-reset and reminder tables also
use owner-executed RPCs and must not be exposed to clients to solve a grant
error.

These edits are installation-source corrections, not a production migration.
Do not rerun the historical migrations on production: they contain setup
operations such as cron scheduling and secret creation. No live permissions,
rows, scores or policies need to change for this correction.

For every future table:

1. Enable RLS in exposed schemas.
2. Identify actual direct Data API callers and explicitly grant only their
   required operations in the same migration as table creation.
3. For browser callers, supply the appropriate RLS policies as well. BizimSkor
   uses custom session RPCs; do not assume `authenticated` represents its
   signed-in players.
4. Keep internal tables inaccessible to `anon` and `authenticated`.
5. Verify table access with automatic grants disabled in an isolated database.
   Where sequence access is required, declare it explicitly too.

This repository contains incremental migrations that depend on pre-existing
base objects. This correction does not claim that an empty-database reset of
the entire project has been verified.
