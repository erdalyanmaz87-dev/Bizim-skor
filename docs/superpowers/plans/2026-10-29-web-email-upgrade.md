# Web Email Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Existing web players attach a verified email and 8+ character password, usable on web and Android.
**Architecture:** Separate Auth client; retain legacy game sessions; reuse deployed account bridge. Add private status and admin RPCs without rewriting gameplay.
**Tech Stack:** Vanilla JavaScript, Supabase Auth/Postgres, Node test runner, Playwright.
**Spec:** docs/superpowers/specs/2026-10-29-web-email-upgrade-design.md

## Global Constraints
Preserve stable player ids and gameplay; password 8–256 characters; never persist passwords; verified server identity controls completion; dismissible reminder each opening; no new player creation in linking.

## Review Focus
- Account switch during verification cannot attach another player.
- Wrong already-linked email cannot replace game session.
- Restored login status and dismissals survive only intended lifecycle.
- Failed network/OTP does not hide reminder or lose gameplay.
- Admin status never exposes emails or credentials to ordinary players.

### Task 1: Account controller and server status
**Files:** web-account-core.js, test/web-account-core.test.js, supabase/web-account-upgrade.sql.
**Interfaces:** create({authClient,gameClient,gateway,storage,deviceId,onLogin}); status(), signup(email,password,repeat), verify(code), attach(), login(identifier,password), recover(email), reset(code,password,repeat).
- [x] Write failing controller tests for validation, OTP and identity preservation, wrong mapping and recovery.
- [x] Run node --test test/web-account-core.test.js and observe expected failure.
- [x] Implement controller and additive token-scoped status/admin SQL.
- [x] Run controller tests and transactional SQL assertions.

### Task 2: Home reminder and web login
**Files:** web-account-ui.js, web-account-ui.css, index.html, admin-statistics-dashboard.js.
**Interfaces:** bootstrap from server-validated game session; retain existing login/register actions; augment login to accept new password for identifiers.
- [x] Add behavior/browser tests for opening/dismissal/reopening, verified completion, mobile layout and admin status.
- [x] Implement home card, modal and auth integration without changing gameplay.
- [x] Run Node regression suite and Playwright browser checks.
- [x] Commit branch and deploy preview; verify source and assets.

## Verification record
- 15 focused Node tests pass.
- Desktop and 390px mobile Chromium browser flow pass with synthetic providers; real email delivery is not exercised.
- Additive SQL tested in an isolated in-memory PostgreSQL (PGlite): ownership, invalid/expired tokens, admin-only tracking, no email disclosure, confirmation revoked/banned states and direct-table permission denial pass.
- Full suite: 637/648 pass; the same 11 failures occur on pristine main (629/640). No remaining introduced failures in that run.
- Fresh reviewer found shared Auth storage race and leftover login after logout: fixed with page-local Auth persistence disabled plus local sign-out. Legacy name policy mismatch: existing-player signup flag preserves up to 100-character names in inert metadata; new-player policy unchanged. Reload test now constructs a fresh controller.
- Production database apply was rejected by automatic approval review. No production changes were made. Gateway existing-player metadata/origin changes also await the same release approval.
- Browser test dependencies: Playwright 1.64.1, @sparticuz/chromium 153.0.0. SQL test dependency: @electric-sql/pglite 0.5.13. Use BIZIMSKOR_CHROMIUM_PACKAGE/BIZIMSKOR_CHROMIUM/BIZIMSKOR_PGLITE to point at environment-owned installations; no product runtime dependencies added.
- Preview is a marked synthetic UI demonstration and does not send mail or change real accounts.

## Authorized release
User explicitly approved production on 2026-10-29. Status SQL and gateway v2 deployed. Live transaction found the legacy support_session_player_id helper absent; replaced that dependency with a scoped digest/session/active-player join. Isolated SQL tests and real transactional mobile_link_player/status/admin assertions passed; synthetic rows rolled back and no live player mutated. Website release follows these checks.
