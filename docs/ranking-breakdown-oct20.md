# Compact score breakdown — 20 October 2026

Current/new weekly and general standings for Super Lig, Champions League and Nations League, plus friend leagues, retain rank/player/points and show four compact category columns: exact, outcome+goal difference, outcome+total goals, outcome only. Each scored prediction contributes to its highest category. Opportunity games count as one hit in the relevant category, with doubled points.

The original exact-score counter remains across all periods. New difference/total/result-only counters cover scoring_version=2 fixtures. The fixed legend explains the date boundary, counts and ×2 opportunity rule. Historical-only weekly tables retain their original columns. Arena's normalized performance table and profile/result percentages are unchanged.

`get_scoring_breakdown` is a read-only aggregate RPC. It does not return unplayed predictions, requires non-null scores and kickoff in the past, and validates membership and score_start_week for friend leagues. It does not modify scoring or ranking functions.

## Validation

- Before/after Super Lig general standings fingerprint identical: `44ddeb7a8c19079147b0de450e2efcc8`.
- SQL checks: SL week 8 uses legacy display; SL week 9, CL week 3 and NL week 5 use new display. Private league without valid membership denied.
- Browser against local app and live public RPC: 93 player rows, seven columns; 320/390/430px widths fit without horizontal overflow. Legend position stays fixed during scrolling; last player remains above legend at the bottom.
- Browser category fixture confirms legacy layout unchanged and rank, points and original exact count preserved when adding exclusive new categories.
- Node suite: 629 tests, 625 pass. Four existing failures remain in arena-eligibility-zones (two), arena-home-spotlight (old season text), and two-week-predictions-ui (old unversioned script URL). New category tests and cache-loader test pass.

## Frozen column headings

Column headings now use sticky positioning inside the screen scroller for all nine table-based standings (including legacy weeks) and Arena's grid. The Nations League overflow wrapper is released so it cannot trap sticky positioning. Opaque light/dark header backgrounds keep scrolling players from showing through. Browser checks confirm fixed heading position in all ten contexts and both themes; scoring and row values are unchanged.

## Preventive scroll performance update

An intermittent freeze was reported and then stopped reproducing on the user's device. No specific browser freeze cause is claimed. Scoped preventive changes keep the UI and scoring intact:

- Ignore unrelated body mutations when deciding whether to recheck standings layout; still respond to table replacements, ancestor visibility changes and moved/new boards.
- Avoid repeating identical legend DOM/style writes.
- Reuse an unchanged adjacent ranking toolbar; rebuild when login, player-row availability, visibility or placement changes.

Browser fixture: eight unrelated screen changes previously caused 16 standings layout reads, now zero. Repeated positions 900 → 2400 → 0 → 3000 → 0 succeed; hiding/reopening and replacing table rows still restores the seven columns and legend. Frozen headers pass all ten contexts in both themes. New toolbar identity regression and focused tests pass. Full suite: 630 tests, 626 pass, same four pre-existing failures documented above.
