# Soccer's API score integration

The existing five-minute `live-score-sync` cron now uses Soccer's API when `SOCCERSAPI_TOKEN` is configured. The key stays in Supabase Secrets. The frontend and predictions are unchanged.

Supported competitions: Super Lig 3515, Champions League 539, Nations League 366. Existing fixtures are matched by competition, both team names (with explicit aliases), and kickoff within 30 minutes. Ambiguous matches are ignored. The API shifts numeric timestamps with its `utc` parameter; the adapter removes the declared offset.

The job skips provider calls when there are no active, unfinished fixtures. Daily quota reservations are atomic, limited to 90 calls with six requests held in reserve, and reconciled against `meta.requests_left`. The normal poll interval is at least five minutes. Match tracking ends four hours after kickoff. A missing/delayed feed leaves the manual score controls available.

Regular-time final scores require two identical observations. Manual finalized results are preserved. Extra-time and penalty finals, abandoned, suspended, awarded, unknown and missing-score records are not automatically finalized; those require manual review.

An authenticated POST with `{"preview":true,"day":"tomorrow"}` tests matching without writing links, live scores or results. It consumes provider requests and records quota usage. All requests require the existing cron authentication.

## Verification on 2026-10-19

- Provider credentials and access to all three leagues: HTTP 200.
- Production preview: all 9 upcoming Champions League fixtures matched (9/9).
- Normal production invocation: HTTP 200, `no_active_fixture`, no provider call.
- Database rollback test: Nations League requires two observations, persists the final result with Soccer's API audit source, refuses quota exhaustion; all test changes rolled back.
- Score-related test group: 36 passing tests after adding the third provider test.
- Full suite: 622 tests, 618 passed, 4 existing failures reproduced at unchanged main `73d48c4`:
  - `test/arena-eligibility-zones.test.js`: one-round entrant explanation / provisional green styling.
  - `test/arena-eligibility-zones.test.js`: final-round ineligibility explanation.
  - `test/arena-home-spotlight.test.js`: stale first-season expectation.
  - `test/two-week-predictions-ui.test.js`: stale unversioned script expectation.

The provider was not observed during a running real match at deployment time. Football Center statistics and automatic creation of new fixture rounds are outside this change.
