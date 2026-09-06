# Invite Growth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add unique personal invitations, monthly/season invite rankings, monthly champion badge, and Lacivert Premium weekly result sharing without disturbing existing scoring or friend leagues.

**Architecture:** Keep invite attribution as an additive subsystem. Parse an invite token at entry, persist attribution only when a first-time player is created, optionally join the referenced friend league, aggregate valid invite records for leaderboards, and derive result-card presentation data from existing score/ranking data plus the player invite URL.

**Tech Stack:** Existing vanilla JavaScript UI/util modules, Supabase SQL/RPC patterns already in repository, Node built-in test runner, Vercel Preview.

**Spec:** `docs/superpowers/specs/2026-09-06-invite-growth-design.md`

## Global Constraints
- Bizim Skor remains free; no paid membership.
- A newly registered player can count for at most one inviter.
- Self-invites do not count.
- Game invite only registers; league invite registers and joins the selected friend league.
- Existing prediction, scoring, league and user data behavior must remain intact.
- Result card visual direction is A — Lacivert Premium.
- Production deployment requires explicit user approval after Preview verification.

---

### Task 1: Invite link contract and attribution rules

**Files:**
- Create: `invite-growth-utils.js`
- Create: `invite-growth-utils.test.js`

**Interfaces:**
- Produces: `buildInviteLink(baseUrl, inviterId, leagueId?)`, `parseInviteParams(url)`, `isValidInviteAttribution(inviterId, newPlayerId, existingAttribution)`.

- [ ] Write tests covering game invite, league invite, duplicate attribution and self-invite.
- [ ] Run `node --test invite-growth-utils.test.js` and verify failure before implementation.
- [ ] Implement minimal pure functions with URLSearchParams and strict ID comparison.
- [ ] Run the test and verify all cases pass.
- [ ] Commit the task.

### Task 2: Persistent invite attribution

**Files:**
- Create: `supabase-invite-growth.sql`
- Create: `supabase-invite-growth.test.js`

**Interfaces:**
- Produces: an additive invite-attribution table with a unique invited-player constraint and RPC/query contracts for registration attribution and aggregates.
- Consumes: existing player/user identifiers and friend-league identifiers.

- [ ] Write contract tests asserting uniqueness, inviter != invited protection, created timestamp, optional league reference and safe idempotent attribution.
- [ ] Run contract tests and verify failure.
- [ ] Add SQL table/index/RLS/RPC definitions without modifying existing scoring tables.
- [ ] Run contract tests and verify pass.
- [ ] Commit the task.

### Task 3: Registration and friend-league invite integration

**Files:**
- Create: `invite-registration.js`
- Create: `invite-registration.test.js`
- Modify only the existing registration/bootstrap integration point discovered during implementation.

**Interfaces:**
- Produces: `consumePendingInvite({ newPlayerId, invite, api })`.
- Consumes: parsed invite parameters and existing friend-league join API.

- [ ] Test game invite attribution, league invite attribution + league join, duplicate-safe retry, and self-invite rejection.
- [ ] Run tests and verify failure.
- [ ] Implement integration so attribution occurs only after successful first registration; league join occurs only for valid league invite.
- [ ] Run tests plus existing friend-league tests.
- [ ] Commit the task.

### Task 4: Monthly and season invite leaderboards

**Files:**
- Create: `invite-leaderboard.js`
- Create: `invite-leaderboard.test.js`
- Create: `invite-leaderboard-ui.js`

**Interfaces:**
- Produces: `buildInviteLeaderboard(rows, period)` and Lacivert Premium leaderboard markup for `monthly` and `season` views.

- [ ] Test monthly boundary filtering, season aggregation, descending counts and deterministic ties.
- [ ] Run tests and verify failure.
- [ ] Implement aggregation and UI tabs “Aylık” / “Sezonluk”.
- [ ] Run tests and verify pass.
- [ ] Commit the task.

### Task 5: Davet Şampiyonu badge and home announcement

**Files:**
- Create: `invite-champion.js`
- Create: `invite-champion.test.js`
- Create: `invite-champion-ui.js`

**Interfaces:**
- Produces: `selectMonthlyInviteChampion(monthlyLeaderboard)` and badge/announcement render helpers.

- [ ] Test champion selection, empty month behavior and tie behavior consistent with leaderboard ordering.
- [ ] Run tests and verify failure.
- [ ] Implement gold “Davet Şampiyonu” badge and compact home announcement using existing announcement insertion patterns.
- [ ] Run tests and verify pass.
- [ ] Commit the task.

### Task 6: Lacivert Premium weekly result card

**Files:**
- Create: `weekly-result-card.js`
- Create: `weekly-result-card.test.js`
- Create: `weekly-result-card.css`

**Interfaces:**
- Produces: `buildWeeklyResultCardModel({ player, week, stats, weeklyRank, overallRank, previousOverallRank, inviteUrl })`, renderer, and WhatsApp share payload.

- [ ] Test all required card fields and up/down/same movement calculation.
- [ ] Test that WhatsApp share payload contains the personal invite URL.
- [ ] Run tests and verify failure.
- [ ] Implement the Lacivert Premium card renderer with username, week, points, exact scores, correct results, weekly rank, overall rank and movement.
- [ ] Run tests and verify pass.
- [ ] Commit the task.

### Task 7: Regression, Preview and approval gate

**Files:**
- Modify only integration/bootstrap files required to expose invite/share screens.

**Interfaces:**
- Consumes all prior task modules.

- [ ] Run the complete repository test suite with `node --test` and fix regressions before deployment.
- [ ] Compare feature branch with rollback baseline `cc466ba18d69144173841bde5dd4e460b4bf91b1` and verify no unrelated production behavior changed.
- [ ] Deploy the feature branch to Vercel Preview only.
- [ ] Browser-check registration invite, league invite, monthly/season tabs, champion badge, result card and WhatsApp share on mobile viewport.
- [ ] Present Preview URL and verification results to Erdal.
- [ ] STOP. Do not promote/merge/deploy to production until Erdal explicitly says to take it live.
