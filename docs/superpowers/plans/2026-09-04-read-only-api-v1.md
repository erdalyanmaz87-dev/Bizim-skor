# Bizim Skor Read-Only API v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe, independently testable read-only API for public match data without changing the existing game.

**Architecture:** Add one isolated Supabase Edge Function with explicit GET routes and allow-listed database fields. Keep every existing frontend and game write flow untouched; validate API behavior independently before any production exposure.

**Tech Stack:** Supabase Edge Functions (Deno/TypeScript), Supabase JS client, Node/Deno-style unit tests where practical.

**Spec:** `docs/superpowers/specs/2026-09-04-read-only-api-v1.md`

## Global Constraints
- No existing frontend/game file changes in v1.
- No database mutation operations.
- Never expose `pin_hash`, `device_id`, or `force_pin_once`.
- Ranking routes are deferred until scoring parity is separately verified.
- Unknown routes 404; unsupported methods 405.

---

### Task 1: Define and test API router behavior
- [ ] Add a failing router test covering `/health`, fixture routes, result routes, Champions routes, invalid week, 404, and 405.
- [ ] Run the test and confirm it fails before implementation.
- [ ] Add minimal route parsing/validation code.
- [ ] Run the router tests and confirm they pass.
- [ ] Commit the test and implementation on the feature branch.

### Task 2: Implement read-only data adapters
- [ ] Add failing tests proving each route selects only the required public match fields and never requests player secrets.
- [ ] Run the tests and confirm failure.
- [ ] Implement Supabase SELECT-only adapters for fixtures/results and Champions fixtures/results.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 3: Build the Edge Function entrypoint
- [ ] Add failing request/response tests for GET, OPTIONS, 404, 405, and JSON error handling.
- [ ] Run and confirm failure.
- [ ] Implement the `bizim-skor-api` Edge Function entrypoint using the tested router/adapters.
- [ ] Run tests and confirm pass.
- [ ] Commit.

### Task 4: Non-production verification
- [ ] Review the feature branch diff and confirm no existing game/UI file changed.
- [ ] Run all API tests.
- [ ] Run existing repository tests that can execute in the available environment.
- [ ] Verify the function against representative current fixture/result data without mutations.
- [ ] Report results before production rollout.

### Task 5: Controlled production rollout
- [ ] Deploy only the isolated Edge Function after Task 4 passes.
- [ ] Verify `/health` and each read route in production.
- [ ] Re-check that the existing Vercel game deployment remains healthy and unchanged.
- [ ] Document API base URL and example calls for the owner.
