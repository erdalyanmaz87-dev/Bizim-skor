# Live Score Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add five-minute live score updates, per-match exact-predictor tickers, silent goal emphasis, and twice-confirmed automatic final-result entry for Süper Lig and Champions League fixtures.

**Architecture:** A Supabase Cron job invokes a protected Edge Function every five minutes. The function first asks Postgres whether a tracked match is in its active window, consumes at most one API-Football live-fixtures request per run, stores provider data in isolated RLS tables, and confirms a final score twice before calling a private result-writing function. The browser reads a sanitized RPC and renders live cards; it never receives the provider key or raw provider response.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Supabase Postgres/RLS/RPC/Realtime, Supabase Edge Functions (Deno), Supabase Cron + Vault, API-Football v3.

**Spec:** `docs/superpowers/specs/2026-08-30-live-score-automation-design.md`

## Global Constraints

- Poll at most once every five minutes and only when a mapped fixture is inside its active window.
- One provider request must cover every simultaneously live match.
- Stop external calls at 95 provider requests per Europe/Istanbul calendar day.
- Keep provider credentials, raw responses, mapping controls, and audit data inaccessible to browser roles.
- Never reveal predictor names before the matching fixture kickoff.
- Never score from a live cache row; score only after two matching terminal-status observations.
- `manual_override` always wins and automation must never overwrite it.
- Keep Süper Lig, Champions League, Sezu, general, and friend-league calculations isolated.
- No sound, push notification, betting data, event statistics, or paid upgrade.
- Start in observation mode; enable automatic result writing only after one real match is manually verified.

## File Map

- Create `live-score-ui.js`: browser-only normalization, staleness, goal-transition, and card markup helpers.
- Create `test/live-score-ui.test.js`: deterministic UI helper tests.
- Create `supabase/functions/live-score-sync/core.mjs`: provider-response normalization and final-confirmation state machine with no network or database dependencies.
- Create `test/live-score-sync-core.test.mjs`: Node tests for the shared Edge Function core.
- Create `supabase/functions/live-score-sync/index.ts`: authenticated scheduler handler, quota guard, API-Football call, cache update, and finalization orchestration.
- Create `supabase/migrations/20260830_live_score_automation.sql`: isolated tables, RLS, grants, sanitized RPC, internal functions, Vault/Cron wiring.
- Create `test/live-score-migration-contract.test.js`: SQL security and isolation contract tests.
- Create `test/live-score-edge-contract.test.js`: Edge Function secret, request-count, and fail-closed contract tests.
- Modify `daily-matches-utils.js`: accept sanitized live state without changing date selection behavior.
- Modify `test/daily-matches-utils.test.js`: live-state merging tests.
- Modify `index.html`: load live-score helpers, render cards/tickers, subscribe to cache changes, and apply silent goal emphasis.
- Modify `test/daily-matches-ui.test.js`: DOM contract tests for live labels, ticker, stale state, and no audio.

---

### Task 1: Establish an isolated execution worktree from production

**Files:**
- Read: `docs/superpowers/specs/2026-08-30-live-score-automation-design.md`
- Read: `docs/superpowers/plans/2026-08-30-live-score-automation.md`

**Interfaces:**
- Consumes: latest remote `main` that contains Champions League history and current production UI.
- Produces: clean `feature/live-score-automation` worktree with a passing baseline.

- [ ] **Step 1: Fetch and inspect the latest production commit**

Run:

```bash
git fetch origin main
git log -1 --oneline origin/main
git status --short
```

Expected: remote production commit is visible and user-owned changes are identified before any worktree operation.

- [ ] **Step 2: Create the isolated worktree using the required skill**

Invoke `superpowers:using-git-worktrees`, then create `feature/live-score-automation` from `origin/main`. Do not reuse a stale Champions League or friend-leagues worktree.

- [ ] **Step 3: Run the untouched baseline tests**

Run:

```bash
node --test test/*.test.js test/*.test.mjs
```

Expected: all existing tests pass. If the shell leaves the unmatched `.mjs` glob literal, run `node --test test/*.test.js` for the baseline and record the count.

---

### Task 2: Build deterministic browser live-score helpers

**Files:**
- Create: `live-score-ui.js`
- Create: `test/live-score-ui.test.js`

**Interfaces:**
- Consumes: sanitized row `{fixture_id,competition,status,elapsed,home_score,away_score,fetched_at,exact_players}`.
- Produces:
  - `isLiveStatus(status): boolean`
  - `isTerminalStatus(status): boolean`
  - `isStale(fetchedAt, now, maxAgeMs=600000): boolean`
  - `detectGoal(previous, current): boolean`
  - `formatExactPredictors(names): string`
  - `renderLiveMatchMarkup(fixture, liveState, now): string`

- [ ] **Step 1: Write failing helper tests**

Create tests including:

```js
assert.equal(Live.isLiveStatus('2H'), true);
assert.equal(Live.isTerminalStatus('FT'), true);
assert.equal(Live.detectGoal({home_score:1,away_score:1},{home_score:2,away_score:1}), true);
assert.equal(Live.detectGoal({home_score:2,away_score:1},{home_score:2,away_score:1}), false);
assert.equal(Live.formatExactPredictors([]), 'Şu an tam skoru bilen yok.');
assert.equal(
  Live.formatExactPredictors(['Erdal','YEK']),
  '🎯 Şu an tam bilenler: Erdal • YEK'
);
assert.match(
  Live.renderLiveMatchMarkup(
    {id:23,home_team:'Eyüpspor',away_team:'Alanyaspor'},
    {status:'2H',elapsed:67,home_score:1,away_score:1,fetched_at:'2026-08-30T17:00:00Z',exact_players:['Erdal']},
    new Date('2026-08-30T17:04:00Z')
  ),
  /CANLI.*67.*Eyüpspor.*1.*1.*Alanyaspor.*Erdal/s
);
```

- [ ] **Step 2: Run the helper test and verify failure**

Run: `node --test test/live-score-ui.test.js`  
Expected: FAIL because `live-score-ui.js` does not exist.

- [ ] **Step 3: Implement the UMD helper module**

Use the existing module pattern:

```js
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorLiveScore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const LIVE=new Set(['1H','HT','2H','ET','BT','P']);
  const TERMINAL=new Set(['FT','AET','PEN']);
  // Return escaped markup only; never interpolate provider HTML.
  return {isLiveStatus,isTerminalStatus,isStale,detectGoal,formatExactPredictors,renderLiveMatchMarkup};
});
```

Escape team and player text using a local HTML escape function. Add `.live-stale` only after ten minutes without a successful fetch.

- [ ] **Step 4: Run the helper test**

Run: `node --test test/live-score-ui.test.js`  
Expected: PASS.

- [ ] **Step 5: Commit the isolated helper**

```bash
git add live-score-ui.js test/live-score-ui.test.js
git commit -m "feat: add live score card helpers"
```

---

### Task 3: Define the secure and isolated database contract

**Files:**
- Create: `supabase/migrations/20260830_live_score_automation.sql`
- Create: `test/live-score-migration-contract.test.js`

**Interfaces:**
- Consumes: existing `fixtures`, `results`, `predictions`, `champions_league_fixtures`, `champions_league_results`, `champions_league_predictions`, and `players` tables.
- Produces:
  - `live_fixture_links(competition,fixture_id,provider_fixture_id,enabled)`
  - `live_score_cache(competition,fixture_id,status,elapsed,home_score,away_score,fetched_at,terminal_seen_count,terminal_signature)`
  - `live_score_daily_usage(usage_date,request_count)`
  - `live_score_result_audit(...)`
  - `get_today_live_match_cards(p_now timestamptz)` sanitized RPC
  - private `record_provider_observation(...)`
  - private `finalize_live_score_result(...)`

- [ ] **Step 1: Write failing SQL contract tests**

Assert that the migration:

```js
for(const table of ['live_fixture_links','live_score_cache','live_score_daily_usage','live_score_result_audit']){
  assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
}
assert.match(sql,/revoke all on public\.live_score_cache from anon, authenticated/i);
assert.match(sql,/get_today_live_match_cards/i);
assert.match(sql,/now\(\) >= .*kickoff/i);
assert.match(sql,/terminal_seen_count/i);
assert.match(sql,/manual_override/i);
assert.doesNotMatch(sql,/alter table public\.(predictions|players|friend_leagues)/i);
```

- [ ] **Step 2: Run the SQL contract test and verify failure**

Run: `node --test test/live-score-migration-contract.test.js`  
Expected: FAIL because the migration is absent.

- [ ] **Step 3: Write the migration**

Use a composite competition reference rather than a cross-table foreign key:

```sql
create table public.live_fixture_links (
  competition text not null check (competition in ('super_lig','champions_league')),
  fixture_id bigint not null,
  provider_fixture_id bigint not null unique,
  enabled boolean not null default true,
  primary key (competition, fixture_id)
);

create table public.live_score_cache (
  competition text not null,
  fixture_id bigint not null,
  status text not null,
  elapsed smallint,
  home_score smallint,
  away_score smallint,
  fetched_at timestamptz not null,
  terminal_seen_count smallint not null default 0,
  terminal_signature text,
  primary key (competition, fixture_id),
  foreign key (competition, fixture_id)
    references public.live_fixture_links(competition, fixture_id) on delete cascade
);
```

Implement the remaining two tables, constraints, indexes, RLS, revocations, and functions. `get_today_live_match_cards` must union the two fixture families, expose only sanitized cache columns, and calculate `exact_players` only when `p_now >= kickoff` and `players.is_active=true`. Grant only this RPC to `anon`; revoke all private function execution from `PUBLIC`, `anon`, and `authenticated`.

`finalize_live_score_result` must refuse to run unless `terminal_seen_count >= 2`, use a transaction-scoped advisory lock, check the audit table for `manual_override`, write to the competition-specific result table, and insert an audit record containing old/new scores and `source='api_football'`.

- [ ] **Step 4: Run SQL contract and all existing tests**

Run:

```bash
node --test test/live-score-migration-contract.test.js
node --test test/*.test.js
```

Expected: PASS; existing gameplay tests remain unchanged.

- [ ] **Step 5: Commit the database contract**

```bash
git add supabase/migrations/20260830_live_score_automation.sql test/live-score-migration-contract.test.js
git commit -m "feat: add secure live score database contract"
```

---

### Task 4: Implement and test the provider state machine

**Files:**
- Create: `supabase/functions/live-score-sync/core.mjs`
- Create: `test/live-score-sync-core.test.mjs`

**Interfaces:**
- Consumes: API-Football fixture objects and prior cache state.
- Produces:
  - `normalizeApiFootballFixture(raw): NormalizedFixture`
  - `terminalSignature(row): string`
  - `nextTerminalState(previous, observation): {terminal_seen_count:number,terminal_signature:string,should_finalize:boolean}`
  - `shouldPoll({active_fixture_count,request_count,last_requested_at,now}): boolean`

- [ ] **Step 1: Write failing provider-core tests**

Include exact cases:

```js
assert.deepEqual(
  nextTerminalState(null,{status:'FT',home_score:2,away_score:1}),
  {terminal_seen_count:1,terminal_signature:'FT:2:1',should_finalize:false}
);
assert.deepEqual(
  nextTerminalState(
    {terminal_seen_count:1,terminal_signature:'FT:2:1'},
    {status:'FT',home_score:2,away_score:1}
  ),
  {terminal_seen_count:2,terminal_signature:'FT:2:1',should_finalize:true}
);
assert.equal(shouldPoll({active_fixture_count:1,request_count:95,last_requested_at:null,now}),false);
assert.equal(shouldPoll({active_fixture_count:0,request_count:0,last_requested_at:null,now}),false);
```

Add changed-score, `PST`, `CANC`, missing-score, five-minute throttling, and malformed-provider tests.

- [ ] **Step 2: Run the core test and verify failure**

Run: `node --test test/live-score-sync-core.test.mjs`  
Expected: FAIL because the module is absent.

- [ ] **Step 3: Implement the pure state machine**

Terminal statuses are exactly `FT`, `AET`, and `PEN`. A changed terminal signature resets the count to one. Non-terminal, postponed, cancelled, interrupted, or scoreless observations set `should_finalize=false`. Reject scores outside integer range 0–20.

- [ ] **Step 4: Run the provider-core tests**

Run: `node --test test/live-score-sync-core.test.mjs`  
Expected: PASS.

- [ ] **Step 5: Commit the provider core**

```bash
git add supabase/functions/live-score-sync/core.mjs test/live-score-sync-core.test.mjs
git commit -m "feat: add live score provider state machine"
```

---

### Task 5: Add the protected five-minute sync Edge Function

**Files:**
- Create: `supabase/functions/live-score-sync/index.ts`
- Create: `test/live-score-edge-contract.test.js`

**Interfaces:**
- Consumes: `API_FOOTBALL_KEY`, `LIVE_SCORE_CRON_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and Task 4 core functions.
- Produces: POST handler returning `{polled:boolean,updated:number,finalized:number,reason?:string}`.

- [ ] **Step 1: Write failing Edge Function contract tests**

Assert source contains:

```js
assert.match(source,/LIVE_SCORE_CRON_SECRET/);
assert.match(source,/API_FOOTBALL_KEY/);
assert.match(source,/request_count\s*>=\s*95/);
assert.match(source,/active_fixture_count/);
assert.match(source,/https:\/\/v3\.football\.api-sports\.io\/fixtures\?live=all/);
assert.doesNotMatch(source,/console\.log\([^)]*API_FOOTBALL_KEY/);
```

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node --test test/live-score-edge-contract.test.js`  
Expected: FAIL because `index.ts` is absent.

- [ ] **Step 3: Implement the fail-closed handler**

Required sequence:

```ts
if (req.method !== 'POST') return json(405, {error:'method_not_allowed'});
if (!timingSafeEqual(req.headers.get('x-cron-secret'), cronSecret))
  return json(401, {error:'unauthorized'});

const gate = await supabase.rpc('get_live_score_poll_gate');
if (gate.active_fixture_count === 0) return json(200,{polled:false,reason:'no_active_fixture'});
if (gate.request_count >= 95) return json(200,{polled:false,reason:'daily_quota_guard'});
if (!gate.five_minutes_elapsed) return json(200,{polled:false,reason:'throttled'});
```

Call `fixtures?live=all` exactly once, normalize only provider fixture IDs present in `live_fixture_links`, record each observation through the private RPC, and call finalization only where the returned state says `should_finalize=true`. Use `try/catch` to return a generic failure without changing cached data. Never log secrets or raw headers.

- [ ] **Step 4: Run Edge and core contract tests**

Run:

```bash
node --test test/live-score-edge-contract.test.js
node --test test/live-score-sync-core.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the Edge Function**

```bash
git add supabase/functions/live-score-sync/index.ts test/live-score-edge-contract.test.js
git commit -m "feat: poll live football scores securely"
```

---

### Task 6: Integrate sanitized live data into “Bugünün Maçları”

**Files:**
- Modify: `daily-matches-utils.js`
- Modify: `test/daily-matches-utils.test.js`
- Modify: `index.html`
- Modify: `test/daily-matches-ui.test.js`
- Create: `live-score-ui.js` already produced by Task 2

**Interfaces:**
- Consumes: `get_today_live_match_cards` RPC and `BizimSkorLiveScore` helper.
- Produces: current-day match cards with schedule/live/final/stale states and exact-predictor ticker.

- [ ] **Step 1: Add failing daily-match merge tests**

Test that `mergeDailyMatchesWithLiveState(fixtures,rows)` joins only equal `{competition,fixture_id}` keys and never guesses by team name. Test Süper Lig ID `23` and Champions League ID `23` remain distinct.

- [ ] **Step 2: Add failing UI contract assertions**

Assert `index.html`:

```js
assert.match(html,/live-score-ui\.js/);
assert.match(html,/get_today_live_match_cards/);
assert.match(html,/live-score-cache/i);
assert.match(html,/live-exact-ticker/);
assert.match(html,/goal-flash/);
assert.doesNotMatch(html,/<audio|new Audio\(|\.play\(/i);
```

- [ ] **Step 3: Run targeted tests and verify failure**

Run:

```bash
node --test test/daily-matches-utils.test.js test/daily-matches-ui.test.js
```

Expected: FAIL on missing live integration.

- [ ] **Step 4: Implement merge and rendering**

Load `<script src="live-score-ui.js"></script>` before the main application script. Fetch the sanitized RPC after base fixtures load. Render each fixture through `renderLiveMatchMarkup`. Keep an in-memory map of previous scores keyed by `competition:fixture_id`; add `.goal-flash` for four seconds only when `detectGoal` returns true.

Use a slow CSS-only ticker:

```css
.live-exact-ticker{overflow:hidden;white-space:nowrap}
.live-exact-ticker>span{display:inline-block;padding-left:100%;animation:liveTicker 22s linear infinite}
.goal-flash{animation:goalFlash 4s ease-out}
@media (prefers-reduced-motion:reduce){.live-exact-ticker>span,.goal-flash{animation:none}}
```

Subscribe to sanitized Realtime changes only if the cache table is safely exposed for SELECT; otherwise refresh the RPC every 60 seconds while the page is visible. The browser refresh cadence must not call API-Football and therefore must not consume provider quota.

- [ ] **Step 5: Run UI, helper, and regression tests**

Run:

```bash
node --test test/live-score-ui.test.js test/daily-matches-utils.test.js test/daily-matches-ui.test.js
node --test test/*.test.js
```

Expected: PASS with no changes to prediction visibility or scoring tests.

- [ ] **Step 6: Commit the UI integration**

```bash
git add daily-matches-utils.js live-score-ui.js index.html test/daily-matches-utils.test.js test/daily-matches-ui.test.js
git commit -m "feat: show live scores and exact predictors"
```

---

### Task 7: Apply infrastructure with automation disabled

**Files:**
- Apply: `supabase/migrations/20260830_live_score_automation.sql`
- Deploy: `supabase/functions/live-score-sync/index.ts`

**Interfaces:**
- Consumes: user-created API-Football free account key; the key is entered directly into Supabase secrets and never pasted into chat or committed.
- Produces: scheduled observation-mode sync with `AUTO_FINALIZE_RESULTS=false`.

- [ ] **Step 1: User creates the free provider account**

Open the official API-Football dashboard, create a free account, and copy the API key directly into the Supabase secret UI/CLI. Do not print it in terminal output, screenshots, logs, or messages.

- [ ] **Step 2: Apply the migration and verify RLS**

Use Supabase MCP/CLI against project `paevhzaixlozrrggnzni`, then query `pg_class`, `pg_policy`, and `information_schema.routine_privileges`. Expected: all four tables have RLS; `anon` cannot select them directly; only the sanitized RPC is callable by `anon`.

- [ ] **Step 3: Configure secrets and deploy**

In the Supabase Dashboard Edge Function secrets screen, create `API_FOOTBALL_KEY` by pasting the provider key privately, create `LIVE_SCORE_CRON_SECRET` with a password-manager-generated value of at least 32 random bytes, and set `AUTO_FINALIZE_RESULTS` to the literal value `false`. Do not run a command that prints either secret.

Deploy `live-score-sync` with JWT verification enabled plus cron-secret validation in the handler. Configure Cron to invoke it every five minutes.

- [ ] **Step 4: Map the next fixtures explicitly**

For each current internal fixture, query API-Football once, compare home team, away team, competition, kickoff, and season, then insert the confirmed `provider_fixture_id`. Never bulk-map solely by fuzzy team names.

- [ ] **Step 5: Verify quota and no-match behavior**

Invoke the function outside an active window. Expected response:

```json
{"polled":false,"reason":"no_active_fixture"}
```

Verify `live_score_daily_usage.request_count` did not increase.

- [ ] **Step 6: Run Supabase security and performance advisors**

Use Supabase advisors. Fix every new warning caused by this feature; document pre-existing unrelated warnings without expanding scope.

---

### Task 8: Observe one real match before enabling finalization

**Files:**
- No code changes unless observation reveals a tested defect.

**Interfaces:**
- Consumes: deployed observation mode and an actual mapped fixture.
- Produces: recorded evidence that live score, status, quota, and exact-predictor list are correct.

- [ ] **Step 1: Compare each state with an independent visible scoreboard**

Record kickoff, first-half score, halftime, second-half score, and full-time status. Confirm the provider score is never attributed to the wrong internal fixture.

- [ ] **Step 2: Verify the five-minute and single-request limits**

For a two-hour match, expected request count is approximately 24 plus bounded setup/final checks. Simultaneous matches must not multiply provider requests.

- [ ] **Step 3: Verify privacy and ticker changes**

Before kickoff, the RPC must return no predictor names. After kickoff, compare exact-player names against a read-only prediction query for the current score.

- [ ] **Step 4: Verify twice-confirmed full time without writing results**

Expected: terminal count moves from one to two for the unchanged terminal score, but `results` and `champions_league_results` remain unchanged because `AUTO_FINALIZE_RESULTS=false`.

---

### Task 9: Enable automatic finalization and complete end-to-end verification

**Files:**
- Configuration only: `AUTO_FINALIZE_RESULTS=true`

**Interfaces:**
- Consumes: successfully completed Task 8 evidence.
- Produces: production-ready automatic final-result entry with manual fallback.

- [ ] **Step 1: Enable finalization only after explicit user confirmation**

Change `AUTO_FINALIZE_RESULTS` to `true`; do not alter the provider plan or incur a paid subscription.

- [ ] **Step 2: Use a controlled fixture simulation on a development branch**

Feed two identical `FT 2-1` observations. Expected: first writes cache only; second writes exactly one result and one audit row. Feed the observation a third time; expected: no duplicate audit or result mutation.

- [ ] **Step 3: Prove manual override protection**

Create a development-only audit row with `source='manual_override'`, then feed a conflicting terminal provider score. Expected: finalization refuses to overwrite the manual result.

- [ ] **Step 4: Run the complete local suite**

Run:

```bash
node --test test/*.test.js test/*.test.mjs
git diff --check
git status --short
```

Expected: all tests pass; only intentional feature files remain changed.

- [ ] **Step 5: Perform mobile browser verification**

At iPhone and Android widths verify: schedule cards, live score, minute, scrolling exact names, reduced-motion behavior, stale message, `MS`, and no horizontal page overflow. Recheck login, Tahmin Yap, Sezu, general ranking, friend leagues, history, Champions League prediction, and Champions League ranking.

- [ ] **Step 6: Request independent code review**

Invoke `superpowers:requesting-code-review`. Address security, quota, fixture-mapping, privacy, duplicate-finalization, and regression findings before integration.

- [ ] **Step 7: Commit any verified review fixes**

```bash
git add live-score-ui.js daily-matches-utils.js index.html supabase/functions/live-score-sync/core.mjs supabase/functions/live-score-sync/index.ts supabase/migrations/20260830_live_score_automation.sql test/live-score-ui.test.js test/live-score-sync-core.test.mjs test/live-score-edge-contract.test.js test/live-score-migration-contract.test.js test/daily-matches-utils.test.js test/daily-matches-ui.test.js
git commit -m "fix: harden live score automation"
```

---

### Task 10: Integrate and verify production deployment

**Files:**
- Integrate all committed feature files from `feature/live-score-automation`.

**Interfaces:**
- Consumes: reviewed feature branch with passing tests and observation evidence.
- Produces: live Bizim Skor release with rollback path.

- [ ] **Step 1: Use the required finishing skill**

Invoke `superpowers:finishing-a-development-branch`; compare the feature branch with the latest `origin/main` and resolve only feature-related conflicts.

- [ ] **Step 2: Re-run verification on the exact merge candidate**

Run the complete test command and `git diff --check`. Expected: PASS.

- [ ] **Step 3: Merge only after explicit production approval**

Push a feature branch/PR or use the connected GitHub workflow. Do not push directly over unrelated user changes.

- [ ] **Step 4: Verify Vercel and Supabase production state**

Confirm the Vercel deployment is READY, the live page loads the new helper, the sanitized RPC responds, the Cron job runs, and no provider secret appears in served HTML/JavaScript or deployment logs.

- [ ] **Step 5: Record rollback controls**

Immediate safe rollback is `AUTO_FINALIZE_RESULTS=false` plus disabling the Cron schedule. UI rollback is the previous Vercel deployment. Disabling automation must not delete cached scores, audit data, predictions, or results.

- [ ] **Step 6: Final handoff**

Report: deployment commit, test count, next mapped fixtures, current daily request count, observation evidence, automatic-finalization state, and manual fallback instructions.
