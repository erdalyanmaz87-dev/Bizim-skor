# Match Statistics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add cached, quota-safe Süper Lig match statistics to the prediction screen without losing draft predictions.

**Architecture:** A server-only Supabase Edge Function prepares one snapshot per upcoming fixture from one season query, per-fixture H2H queries, and the existing Football Center standings cache. A standalone browser module injects statistics buttons and reads snapshots through a read-only RPC/table path.

**Tech Stack:** Static HTML/JavaScript, Node test runner, Supabase Postgres/RLS, Supabase Edge Functions (Deno), API-Football.

**Spec:** `docs/superpowers/specs/2026-09-05-match-statistics-design.md`

## Global Constraints

- Player button taps must consume zero API-Football requests.
- A normal nine-match week may consume at most 10 provider requests.
- Existing snapshots must survive failed refreshes.
- Draft scores, selected week, and scroll position must survive opening and closing statistics.
- API and service-role secrets must never reach browser code.

---

### Task 1: Statistics normalization core

**Files:**
- Create: `supabase/functions/match-statistics-sync/core.mjs`
- Test: `test/match-statistics-sync-core.test.mjs`

**Interfaces:**
- Produces `matchProviderFixture`, `teamRecentMatches`, `formSequence`, `normalizeHeadToHead`, `weeklyRequestBudget`, and `buildFixtureSnapshot`.

- [ ] Write literal fixture tests for mapping, chronological cutoff, five-match limit, form direction, H2H normalization, and a ten-request nine-match budget.
- [ ] Run the focused test and verify it fails because the module is missing.
- [ ] Implement the smallest pure functions satisfying the tests.
- [ ] Run the focused test and verify it passes.

### Task 2: Secure cache schema and refresh policy

**Files:**
- Create: `supabase/migrations/20260905173000_match_statistics_snapshots.sql`
- Test: `test/match-statistics-database-contract.test.js`

**Interfaces:**
- Produces `public.match_statistics_snapshots`, `public.match_statistics_sync_runs`, `public.match_statistics_week_due(timestamptz)`, and `public.get_match_statistics(bigint)`.

- [ ] Write a database contract test for RLS, read-only anonymous access, service-only writes, unique weekly runs, matchless-day due checks, and request cap enforcement.
- [ ] Run the focused test and verify it fails because the migration is missing.
- [ ] Add the migration with explicit grants and RLS policies.
- [ ] Run the focused test and verify it passes.

### Task 3: Quota-safe Edge Function

**Files:**
- Create: `supabase/functions/match-statistics-sync/index.ts`
- Test: `test/match-statistics-edge-contract.test.js`

**Interfaces:**
- Consumes Task 1 core helpers and Task 2 database functions/tables.
- Produces an authenticated POST sync endpoint returning `{status, requests, saved, failures}`.

- [ ] Write a contract test proving the key stays server-side, budget is reserved once before provider calls, standings are reused, and snapshots are upserted.
- [ ] Run the focused test and verify it fails because the function is missing.
- [ ] Implement the authenticated Edge Function with no automatic retry loop.
- [ ] Run the focused test and verify it passes.

### Task 4: Prediction statistics overlay

**Files:**
- Create: `match-statistics-ui.js`
- Test: `match-statistics-ui.test.js`
- Modify: `ui-integration-loader.js`
- Modify: `ui-integration-loader.test.js`

**Interfaces:**
- Consumes `window.BizimSkorPredictionContext()` and `sb.rpc('get_match_statistics', {p_fixture_id})`.
- Produces `window.BizimSkorMatchStatistics` and fixture-specific buttons/overlay.

- [ ] Write tests for escaped rendering, Turkish date/score markup, context exposure, button injection contract, and draft/scroll restoration.
- [ ] Run the focused tests and verify they fail for the missing module/context.
- [ ] Implement the standalone module and dynamic prediction-context getter.
- [ ] Run the focused tests and verify they pass.

### Task 5: Integration and deployment verification

**Files:**
- Modify only files from Tasks 1–4.

- [ ] Run all Node tests and record any unrelated pre-existing failures separately.
- [ ] Run JavaScript syntax checks for changed browser files and Deno-compatible module tests for the Edge core.
- [ ] Apply the database migration and verify table/function behavior with read-only SQL.
- [ ] Deploy the Edge Function without triggering a provider refresh during an active matchday.
- [ ] Publish the browser files and verify the production deployment is healthy.

