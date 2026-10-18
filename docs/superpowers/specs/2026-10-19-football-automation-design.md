# BizimSkor unattended football automation
Date: 2026-10-19 (Europe/Istanbul)

## User goal
Keep the game running when the administrator is absent. Fetch fixtures, live scores and finalized results from the existing football data provider. Each competition shows its current round and the following round. Manual fixture requests remain available.

## Verified current state
- Supabase live-score-sync v25 is invoked by pg_cron every five minutes.
- The existing shared API request reservation caps total provider calls at 100 per Istanbul calendar day.
- New future fixtures already seed stable SkorBot suggestions through database triggers.
- Prediction Status controls the Opportunity Matches menu's visible rounds.
- On 2026-10-19, an authenticated provider status check returned HTTP 200 with errors.access = "Your account is suspended, check on https://dashboard.api-football.com."
- Therefore fixture/score provider availability is BLOCKED, not operational. No unattended fixture import has been enabled.
- Existing fixture, result and player prediction data remain unchanged by this investigation.

## Round lifecycle
1. For each of super_lig, champions_league and nations_league, select the ongoing round and its next round. A newly inserted later round must not displace an unfinished current round.
2. If there is no ongoing round, select the earliest upcoming round and the following round.
3. A round stays ongoing until all scheduled matches have confirmed final results. A kickoff time alone must not archive it, and an unresolved postponed match must not be treated as a 0-0 or a completed match.
4. Ensure the following round is loaded before kickoff. At the current round's first kickoff, perform a server-side completeness check and fetch the following round if missing.
5. When the current round has fully finalized, advance the window to the next two rounds and prepare the missing following round.
6. Do not delete historical fixtures or predictions when rotating visible rounds.
7. The earlier hardcoded week-8 pin is superseded only by this lifecycle: week 8 must remain while its Trabzonspor–Beşiktaş match is unresolved.

## One visible-round policy
Use one shared server-owned policy for Prediction Status, prediction week selectors and Opportunity Matches. Keep first-kickoff ordering, competition logos and completion colors. Surface provider failures in the administrator summary instead of claiming synchronization succeeded.

## Provider synchronization
- Verify API access and season coverage before enabling imports. Preserve the 2026/27 in-game season; do not substitute a different provider season.
- Use provider fixture IDs as persistent mappings, validate league/season/round/team orientation and scheduled time, and never guess an ambiguous match.
- Existing internal fixture IDs and saved predictions must be preserved.
- Import complete upcoming rounds atomically and idempotently. Sync rescheduled kickoff times safely; never reopen prediction deadlines after play has started.
- Generate SkorBot records via existing future-fixture triggers. Animation and quick suggestion must continue using the same stored score and allowance.
- Fill only missing predictions for HAFSA, Mertshen and Mevlüt using independent score generation under the user's standing instruction.
- Choose one opportunity match for a newly imported round using a deterministic rule, preserve administrator overrides and never change an opportunity match after the round starts.

## Live scores and finalization
Reuse the existing live cache and result finalization RPCs. Include all three competitions in provider matching. Query active matches together, retrieve recently finished mapped fixtures explicitly (live=all alone can omit them), and require confirmed final observations. Do not overwrite administrator corrections with an unverified provider response.

## Scheduling, quota and recovery
Use application-owned pg_cron/Edge execution, independent of browser visits and ChatGPT sessions. Bound all retries, reserve shared API quota before each call, prioritize live scores, avoid one-request-per-player polling, and back off on provider suspension or plan errors. Retry eligibility and health checks must be durable. Keep operational logs with status, last successful sync and next retry.

## Required checks before activation
- API account reactivated and current-season fixtures returned for each configured competition.
- Dry-run mapping against existing fixtures; mismatches are reviewable and cause no data writes.
- Tests for unfinished round retention, cross-competition independence, postponed games, season rollover, duplicate cron invocations, atomic partial-fetch failure, quota exhaustion, provider errors and final-score verification.
- Verify actual scheduled job HTTP responses and resulting database writes; cron "succeeded" only means an HTTP request was enqueued.

## Next dependency
Administrator must restore provider account access at https://dashboard.api-football.com. After access returns, verify 2026/27 plan coverage and complete implementation/testing before enabling automatic imports.
