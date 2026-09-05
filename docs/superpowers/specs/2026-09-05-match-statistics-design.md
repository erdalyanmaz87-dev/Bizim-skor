# Match Statistics Design

## Goal

Add a quota-safe “Maç İstatistikleri” view to every Süper Lig prediction row so players can review current league position, both teams’ last five matches, and the last five head-to-head meetings, then return without losing entered scores or scroll position.

## User experience

- Every editable, saved, or locked Süper Lig prediction row gets a `📊 Maç İstatistikleri` button.
- The button opens a mobile-first overlay above the prediction screen.
- The overlay shows league rank/points/form for both teams, each team’s last five completed matches, the last five head-to-head matches, and the snapshot update time.
- A sticky `← Tahmine Dön` action closes the overlay and restores the same prediction row, scroll position, and unsaved score inputs.
- Missing sections display a calm availability message; stale snapshots remain visible with their update time.

## Data and quota architecture

- The browser reads only cached rows from Supabase and never calls API-Football.
- A server-only Edge Function fetches one season fixture list and at most one head-to-head response per fixture in the upcoming prediction week.
- The weekly provider budget is hard-capped at `1 + fixture_count`, with at most 10 requests for a normal nine-match week.
- Provider requests are atomically reserved before the first network call so duplicate or partial runs cannot exceed the cap.
- The current standings snapshot from Football Center supplies rank and points without another provider request.
- One snapshot is stored per internal fixture. Existing snapshots are never deleted when a refresh fails.
- A week-level successful run prevents duplicate refreshes. Automated preparation runs only on a matchless day; manual administrative runs remain available.

## Security

- API-Football and service-role keys remain inside the Edge Function.
- The snapshot table exposes read-only `SELECT` to the anonymous game client, has RLS enabled, and grants writes only to `service_role`.
- The sync function requires the existing server-side football-center secret.

## Failure behavior

- Provider, quota, or mapping failures are recorded per run.
- Successfully mapped fixtures can be saved in a partial run; old rows for failed fixtures remain untouched.
- The client shows cached data when present and a Turkish unavailable message when no snapshot exists.
- No immediate automatic retry loop is allowed.

## Verification

- Pure tests cover fixture mapping, last-five form, snapshot assembly, quota calculation, and HTML escaping.
- UI tests cover button injection, cached RPC usage, overlay rendering, and preservation of draft scores/scroll state.
- Database contract tests cover RLS, grants, unique week runs, and the maximum weekly request reservation.
- The full JavaScript test suite and syntax checks run before deployment.

