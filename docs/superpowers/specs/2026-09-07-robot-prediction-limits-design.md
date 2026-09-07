# Stored Robot Predictions and 2/3 Limit Design

## Goal
Robot predictions are generated once per fixture, stored in Supabase, reused consistently for every player, and never default all matches to 1-1. Bulk robot fill may cover at most two-thirds of a matchweek; the remaining third stays available for player-entered predictions. Week 6 Super Lig match statistics must use the same snapshot + dynamic-results model already used by week 5.

## Behavior
- Every fixture has one stored robot score for its competition/week.
- Single-match Robotun Önerisi reads that stored score.
- Robot-applied predictions per player/week may never exceed `floor(total_fixtures * 2 / 3)`.
- Bulk fill selects randomly among currently empty matches and fills only the remaining robot allowance.
- Existing player-entered scores are never overwritten.
- For 9 Super Lig matches the maximum is 6; for 18 Champions League matches the maximum is 12; other fixture counts use the same 2/3 formula.
- `robot_applied` remains the source of truth for counting how many player predictions came from the robot.

## Stored Suggestions
Create `robot_match_predictions` keyed by competition + fixture id. Rows include season, week, fixed home/away score, generation timestamp and source. Client UI fetches the stored row rather than recalculating locally. Missing suggestions show an unavailable message instead of silently returning 1-1.

## Match Statistics
Create `match_statistics_snapshots` rows for all Super Lig week 6 fixtures using the existing payload shape. The existing `get_match_statistics` RPC will continue merging prior completed results and dynamically calculated standings, so week 6 uses the same UI and data flow as week 5 without additional provider requests.

## Safety
Do not modify existing player predictions, results, rankings, friend leagues or Champions League scoring. Existing week 5 predictions remain untouched. Production changes are limited to robot suggestion storage/lookup, robot application limits, and week 6 statistics snapshots.
