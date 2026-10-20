# Scoring from 20 October 2026

Only fixtures starting at or after 2026-10-20 00:00 Europe/Istanbul use version 2. Each fixture stores its version; rescheduling does not recalculate an old fixture with new rules. Future inserted fixtures receive the version from the same boundary. Previously saved predictions for upcoming fixtures also use version 2.

Version 2 awards only the highest applicable tier: exact score 10; correct result and goal difference 6; correct result and total goals 4; correct result 2; otherwise 0. Draws follow the same rule (an inexact but correct draw is 6). Opportunity fixtures double the awarded points: 20/12/8/4/0.

Legacy scoring branches remain unchanged for version 1, including historical opportunity scoring. Tie-break ordering is unchanged. General, weekly, friend leagues, profile histories, Arena and cup calculations share version-aware match points. Arena retains its existing normalized performance calculation and starts the new season without carrying old Arena performance.

## Validation

- All 6,823 already-scored predictions retain exactly the same points after the migration.
- All 93 Super Lig general ranking rows retain the same totals and positions.
- Migration assertions compared all stored Arena round performance rows unchanged and abort the migration if preservation fails.
- 140 existing fixtures use legacy rules, 70 upcoming fixtures use version 2.
- Production SQL checks returned 10/6/4/2/0, draw 6, opportunity draw 12 and opportunity exact score 20 across the supported competitions.
- Full JavaScript suite: 626 tests, 622 passed; four pre-existing failures remain (also present before this work):
  - `test/arena-eligibility-zones.test.js`: `one-round entrant remains ranked without green promotion styling and gets an explanation`.
  - `test/arena-eligibility-zones.test.js`: `final Super Lig round makes the season ineligibility explicit without counting Champions League as a tour`.
  - `test/arena-home-spotlight.test.js`: `Arena özeti ana sayfada Günün Maçlarından önce öne çıkarılır` (expects season 1).
  - `test/two-week-predictions-ui.test.js`: `iki haftalık yardımcı ve hafta seçimi yüklenir` (expects an unversioned script URL).

The previous historical totals are preserved; newly earned version 2 points are added to them. No prediction, result or completed season ranking was rewritten.
