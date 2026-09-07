# Robot Prediction Storage and Limits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Store one stable robot score per fixture, cap robot-applied player predictions at two-thirds of each matchweek, and populate Super Lig week 6 statistics using the existing week 5 model.

**Architecture:** Supabase owns canonical robot suggestions in a new table. UI reads canonical suggestions and uses a pure client helper for allowance/random empty selection; existing `robot_applied` flags count usage. Week 6 statistics reuse `match_statistics_snapshots` and the existing `get_match_statistics` RPC.

**Tech Stack:** Supabase PostgreSQL/RLS/RPC, vanilla JavaScript, existing Bizim Skor prediction UI.

**Spec:** `docs/superpowers/specs/2026-09-07-robot-prediction-limits-design.md`

## Global Constraints
- Never overwrite a player-entered score.
- Maximum robot-applied predictions is `floor(total fixtures * 2 / 3)`.
- Stored robot scores are stable and shared by all players.
- Missing stored robot data must not silently become 1-1.
- Week 6 statistics use the same payload/UI contract as week 5.
- Do not alter rankings, results, friend leagues, or existing predictions.

---

### Task 1: Canonical robot suggestion storage
**Files:**
- Database migration: `robot_match_predictions`
- Modify: `robot-prediction-utils.js`
- Test: `robot-prediction-utils.test.js`

**Interfaces:**
- Produces table rows keyed by `(competition, fixture_id)` with `home_score`, `away_score`.
- Produces `robotLimit(totalFixtures)` and random empty-match selection helpers.

- [ ] Write failing tests for 9→6, 18→12, 15→10, existing robot usage reducing allowance, and no overwrite.
- [ ] Run tests and confirm failure.
- [ ] Create canonical robot table with public read policy and protected writes.
- [ ] Seed stable suggestions for current Super Lig week 6 and Champions League week 1 from available form/standing evidence.
- [ ] Implement pure limit/random-selection helpers.
- [ ] Run tests and confirm pass.

### Task 2: Use stored suggestions in UI
**Files:**
- Modify: `robot-prediction-ui.js`
- Modify as needed: Champions League prediction UI integration.

**Interfaces:**
- Consumes canonical suggestion rows.
- Uses `robot_applied` counts to enforce remaining allowance.

- [ ] Write failing tests for single suggestion lookup, bulk random selection, 2/3 cap, and unavailable suggestion behavior.
- [ ] Run tests and confirm failure.
- [ ] Replace local on-click score generation with stored suggestion lookup.
- [ ] Bulk fill only random empty fixtures up to remaining allowance.
- [ ] Ensure single-match use also respects the same weekly maximum.
- [ ] Persist `robot_applied=true` only for robot-filled predictions.
- [ ] Run tests and confirm pass.

### Task 3: Week 6 statistics snapshots
**Files:**
- Database data migration: `match_statistics_snapshots` week 6 rows.

**Interfaces:**
- Consumed by existing `get_match_statistics(bigint)` RPC and `match-statistics-ui.js`.

- [ ] Build all nine week 6 snapshot payloads with home/away rank, points, form, recent matches and empty/available H2H in the same shape as week 5.
- [ ] Insert/upsert snapshots without changing older weeks.
- [ ] Query `get_match_statistics` for all nine fixtures and verify none returns null and both teams contain rank/form data.

### Task 4: Production verification
**Files:** none.

- [ ] Verify week 5 prediction row count and values remain unchanged.
- [ ] Verify exactly 9 Super Lig week 6 canonical robot suggestions and 18 Champions League week 1 suggestions exist.
- [ ] Verify suggestion score distribution is not uniformly 1-1.
- [ ] Verify all 9 week 6 statistics RPC calls return populated payloads.
- [ ] Verify Vercel deployment status is successful for final frontend commit.
