# Bizim Skor Şampiyonlar Ligi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an isolated 2026/27 Champions League prediction competition with 18 matchweek-one fixtures, server-enforced locking, private predictions, and a season-long ranking.

**Architecture:** Keep the existing Süper Lig tables and scoreboards untouched. Add dedicated Champions League fixture, prediction, and result tables behind token-validated `SECURITY DEFINER` RPCs, plus a focused browser utility and two themed sections wired into the existing single-page app.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js built-in test runner, Supabase Postgres/RPC/RLS, Vercel, GitHub.

**Spec:** `docs/superpowers/specs/2026-08-29-champions-league-design.md`

## Global Constraints

- Use the existing `players` records and `friend_league_sessions` token; do not create a second account system.
- Store all kickoff timestamps as `timestamptz`; render them in `Europe/Istanbul`.
- Lock all 18 matchweek-one predictions at `2026-09-08T16:45:00Z` (8 September 2026, 19.45 Türkiye time).
- Score a correct 1-X-2 outcome as 1 point and add 3 points for an exact score, for 4 total.
- Hide another player's score as `*-*` until that fixture has a recorded result.
- Keep Champions League points out of Süper Lig General, Sezu, and Friend League rankings.
- Use a dark navy/electric-blue CSS-only night theme only inside the two Champions League sections.
- Do not add or resume push notifications.
- Reject incomplete weekly submissions and score values outside integer range 0-20.
- Do not deploy until the full regression suite and live mobile verification pass.

---

## File Map

- Create `champions-league-utils.js`: pure lock, validation, scoring, ranking, visibility, and date-grouping functions usable by browser and Node tests.
- Create `test/champions-league-utils.test.js`: behavior tests for the pure functions.
- Create `supabase/migrations/20260829_champions_league.sql`: isolated tables, indexes, RLS/grants, RPCs, and the exact 18-fixture seed.
- Create `test/champions-league-database-contract.test.js`: static security, fixture, lock, and isolation contract checks for the migration.
- Modify `index.html`: two tabs/sections, scoped theme, RPC integration, saving/editing, ranking, masked participant predictions, and realtime refresh.
- Create `test/champions-league-ui.test.js`: HTML wiring and isolation regression tests.

---

### Task 1: Pure Champions League Rules

**Files:**
- Create: `test/champions-league-utils.test.js`
- Create: `champions-league-utils.js`

**Interfaces:**
- Produces: `isWeekLocked(fixtures, now): boolean`
- Produces: `validateWeeklyScores(fixtures, scores): Array<{fixture_id:number,home_score:number,away_score:number}>`
- Produces: `scorePrediction(prediction, result): {points:number,exact:number,correct:number,symbol:string}`
- Produces: `rankSeason(rows): Array<Row & {rank:number}>`
- Produces: `visibleScore(prediction, result, isCurrentPlayer): string`
- Produces: `groupFixturesByTurkeyDate(fixtures): Array<{dateKey:string,label:string,fixtures:Array}>`

- [ ] **Step 1: Write failing rule tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const CL=require('../champions-league-utils');

const fixtures=[
  {id:1,kickoff:'2026-09-08T16:45:00Z'},
  {id:2,kickoff:'2026-09-10T19:00:00Z'}
];

test('ilk maç başlayınca haftanın tamamı kilitlenir',()=>{
  assert.equal(CL.isWeekLocked(fixtures,new Date('2026-09-08T16:44:59Z')),false);
  assert.equal(CL.isWeekLocked(fixtures,new Date('2026-09-08T16:45:00Z')),true);
});

test('haftanın tüm skorlarını ve 0-20 sınırını doğrular',()=>{
  assert.deepEqual(CL.validateWeeklyScores(fixtures,[
    {fixture_id:1,home_score:2,away_score:1},
    {fixture_id:2,home_score:0,away_score:0}
  ]).map(x=>x.fixture_id),[1,2]);
  assert.throws(()=>CL.validateWeeklyScores(fixtures,[{fixture_id:1,home_score:21,away_score:0}]),/Tüm maçlar|0-20/);
});

test('tam skor 4, yalnız yön 1 puandır',()=>{
  assert.equal(CL.scorePrediction({home_score:2,away_score:1},{home_score:2,away_score:1}).points,4);
  assert.equal(CL.scorePrediction({home_score:3,away_score:0},{home_score:1,away_score:0}).points,1);
});

test('rakip tahmini sonuçtan önce gizlidir',()=>{
  assert.equal(CL.visibleScore({home_score:2,away_score:1},null,false),'*-*');
  assert.equal(CL.visibleScore({home_score:2,away_score:1},null,true),'2-1');
});

test('sezon sıralaması puan tam skor ve doğru sonuca göre yapılır',()=>{
  const rows=CL.rankSeason([
    {name:'Ali',points:5,exact:1,correct:2},
    {name:'Veli',points:5,exact:0,correct:5}
  ]);
  assert.deepEqual(rows.map(x=>[x.name,x.rank]),[['Ali',1],['Veli',2]]);
});
```

- [ ] **Step 2: Run the tests and confirm the expected failure**

Run: `node --test test/champions-league-utils.test.js`

Expected: FAIL because `../champions-league-utils` does not exist.

- [ ] **Step 3: Implement the UMD utility**

Create `champions-league-utils.js` with a UMD wrapper named `BizimSkorChampionsLeague`. Implement lock time as the minimum fixture kickoff, validate that submitted fixture IDs exactly equal the weekly fixture IDs and scores are integers 0-20, reuse the existing 1+3 scoring semantics, use competition ranking with equal `{points,exact,correct}` rows sharing rank, and format date labels with:

```js
new Intl.DateTimeFormat('tr-TR',{
  timeZone:'Europe/Istanbul',day:'numeric',month:'long',year:'numeric',weekday:'long'
})
```

- [ ] **Step 4: Run the focused tests**

Run: `node --test test/champions-league-utils.test.js`

Expected: all Champions League utility tests PASS.

- [ ] **Step 5: Commit the rule unit**

```bash
git add champions-league-utils.js test/champions-league-utils.test.js
git commit -m "feat: add Champions League prediction rules"
```

---

### Task 2: Isolated Database and Exact Fixture Seed

**Files:**
- Create: `test/champions-league-database-contract.test.js`
- Create: `supabase/migrations/20260829_champions_league.sql`

**Interfaces:**
- Consumes: `public.friend_session_player(p_token text) -> text`
- Produces: `public.get_champions_league_week(p_token text,p_season text,p_week integer)`
- Produces: `public.save_champions_league_predictions(p_token text,p_season text,p_week integer,p_predictions jsonb) -> boolean`
- Produces: `public.get_champions_league_ranking(p_token text,p_season text)`
- Produces: `public.get_champions_league_week_predictions(p_token text,p_season text,p_week integer)`

- [ ] **Step 1: Write a failing migration contract test**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const file=path.join(__dirname,'../supabase/migrations/20260829_champions_league.sql');

test('Şampiyonlar Ligi ayrı ve RLS korumalı tablolardadır',()=>{
  const sql=fs.readFileSync(file,'utf8');
  for(const table of ['champions_league_fixtures','champions_league_predictions','champions_league_results']){
    assert.match(sql,new RegExp(`create table public\\.${table}`,'i'));
    assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`,'i'));
  }
  assert.match(sql,/friend_session_player\(p_token\)/i);
  assert.match(sql,/set search_path = ''/i);
  assert.match(sql,/2026-09-08 16:45:00\+00/i);
  assert.doesNotMatch(sql,/alter table public\.(fixtures|predictions|results)/i);
});
```

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node --test test/champions-league-database-contract.test.js`

Expected: FAIL because the migration file is missing.

- [ ] **Step 3: Create isolated tables and constraints**

Create the migration with:

```sql
create table public.champions_league_fixtures (
  id bigint generated by default as identity primary key,
  season text not null,
  week integer not null check (week > 0),
  home_team text not null,
  away_team text not null,
  kickoff timestamptz not null,
  unique (season, week, home_team, away_team)
);

create table public.champions_league_predictions (
  player_name text not null references public.players(name) on update cascade,
  fixture_id bigint not null references public.champions_league_fixtures(id) on delete cascade,
  home_score smallint not null check (home_score between 0 and 20),
  away_score smallint not null check (away_score between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (player_name, fixture_id)
);

create table public.champions_league_results (
  fixture_id bigint primary key references public.champions_league_fixtures(id) on delete cascade,
  home_score smallint not null check (home_score between 0 and 20),
  away_score smallint not null check (away_score between 0 and 20),
  updated_at timestamptz not null default now()
);
```

Add indexes on `(season,week,kickoff)`, prediction `fixture_id`, and result `fixture_id`. Enable RLS on all three tables; revoke all table privileges from `anon` and `authenticated`; grant table access only to `service_role`.

- [ ] **Step 4: Seed the exact 18 fixtures idempotently**

Insert the spec fixture list with `on conflict (season,week,home_team,away_team) do update set kickoff=excluded.kickoff`. Use `2026/27`, week `1`, and UTC times: `16:45:00+00` for 19.45 Türkiye and `19:00:00+00` for 22.00 Türkiye. Assert in the contract test that the migration contains 18 fixture tuples and the Turkish clubs `Sporting CP/Galatasaray` and `Fenerbahçe/Roma`.

- [ ] **Step 5: Add token-validated RPCs**

Define all four functions as `SECURITY DEFINER SET search_path = ''`. Each starts with:

```sql
v_player := public.friend_session_player(p_token);
if v_player is null then
  raise exception 'Oturum geçersiz veya süresi dolmuş';
end if;
```

`save_champions_league_predictions` must lock by querying `min(kickoff)` for the requested season/week and comparing it with database `now()`, require the JSON array length and distinct fixture IDs to equal the fixture count, reject IDs outside the requested week, then upsert the complete set inside one transaction. Never trust a player name supplied by the browser.

`get_champions_league_week_predictions` returns current-player values immediately and returns null predicted scores for other players until a matching result exists. Filter players whose `players.is_active` is false.

`get_champions_league_ranking` computes points only from `champions_league_results`, orders by points, exact count, correct count, then Turkish player name, and applies competition rank.

Revoke function execution from `public` and `authenticated`; grant only these four token-guarded RPCs to `anon`.

- [ ] **Step 6: Run the contract and full local tests**

Run: `node --test test/champions-league-database-contract.test.js test/*.test.js test/*.test.mjs`

Expected: database contract PASS and all existing tests PASS.

- [ ] **Step 7: Apply and verify the migration**

Apply the SQL with the Supabase migration tool to project `paevhzaixlozrrggnzni`. Then verify with read-only SQL that all three tables have RLS enabled, `anon` cannot select them, only the four intended RPCs are executable by `anon`, and exactly 18 `2026/27` week-one fixtures exist. Run Supabase security and performance advisors and address any new actionable warning caused by this migration.

- [ ] **Step 8: Commit the database unit**

```bash
git add supabase/migrations/20260829_champions_league.sql test/champions-league-database-contract.test.js
git commit -m "feat: add isolated Champions League database"
```

---

### Task 3: Themed Prediction Section

**Files:**
- Create: `test/champions-league-ui.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `BizimSkorChampionsLeague` utility API from Task 1
- Consumes: `get_champions_league_week` and `save_champions_league_predictions` RPCs from Task 2
- Produces DOM IDs: `championsPred`, `championsFixtures`, `championsState`, `championsSave`

- [ ] **Step 1: Write failing HTML contract tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');

test('Şampiyonlar Ligi tahmin bölümü ayrı sekmedir',()=>{
  assert.match(html,/data-tab="championsPred"/);
  assert.match(html,/id="championsPred"/);
  assert.match(html,/champions-league-utils\.js/);
  assert.match(html,/save_champions_league_predictions/);
});

test('tema yalnız Şampiyonlar Ligi alanına uygulanır',()=>{
  assert.match(html,/\.champions-shell/);
  assert.doesNotMatch(html,/body\s*\{[^}]*#061a/i);
});
```

- [ ] **Step 2: Run the UI test and verify failure**

Run: `node --test test/champions-league-ui.test.js`

Expected: FAIL because the tab, section, script, and handlers do not exist.

- [ ] **Step 3: Add the scoped night theme and prediction markup**

Load `<script src="champions-league-utils.js"></script>` before the main app script. Add a `⭐ Şampiyonlar Ligi 1. Hafta` tab and a hidden `championsPred` section. Use a `.champions-shell` wrapper with a CSS-only radial/star field, navy gradient, electric-blue borders, white text, white score inputs, and no animation or external UEFA assets. Group the 18 match cards under date labels returned by `groupFixturesByTurkeyDate`.

- [ ] **Step 4: Wire secure load, edit, validation, and save**

Add state variables `clSeason='2026/27'`, `clWeek=1`, `clFixtures=[]`, and `clMine=[]`. `loadChampionsWeek()` obtains the existing `bizimSkorFriendToken`, calls `get_champions_league_week`, and renders either inputs, a saved summary with `Tahminleri Düzenle`, or a locked message. `saveChampionsWeek()` builds the complete 18-row JSON array, calls `validateWeeklyScores`, then calls:

```js
sb.rpc('save_champions_league_predictions',{
  p_token:token,
  p_season:clSeason,
  p_week:clWeek,
  p_predictions:rows
})
```

On success reload only the Champions League section. On an invalid/expired session, show `Önce mevcut oyuncu hesabınla giriş yap.` and do not create another login flow.

- [ ] **Step 5: Add the tab to the existing navigation controller**

Include `championsPred` in the section-hide list and call `loadChampionsWeek()` only when its tab opens. Preserve flex wrapping and confirm all existing section IDs remain in the navigation list.

- [ ] **Step 6: Run focused and regression tests**

Run: `node --check champions-league-utils.js && node --test test/champions-league-ui.test.js test/*.test.js test/*.test.mjs`

Expected: new UI tests and every existing test PASS.

- [ ] **Step 7: Commit the prediction UI unit**

```bash
git add index.html test/champions-league-ui.test.js
git commit -m "feat: add Champions League prediction screen"
```

---

### Task 4: Independent Season Ranking and Masked Predictions

**Files:**
- Modify: `test/champions-league-ui.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes: `get_champions_league_ranking` and `get_champions_league_week_predictions` RPCs
- Produces DOM IDs: `championsRanking`, `championsParticipants`

- [ ] **Step 1: Extend the UI test with failing ranking assertions**

```js
test('Şampiyonlar Ligi sıralaması bağımsız sekmedir',()=>{
  assert.match(html,/data-tab="championsRanking"/);
  assert.match(html,/id="championsRanking"/);
  assert.match(html,/get_champions_league_ranking/);
  assert.match(html,/get_champions_league_week_predictions/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test test/champions-league-ui.test.js`

Expected: FAIL because ranking DOM and RPC calls are absent.

- [ ] **Step 3: Add the themed ranking section**

Add `🏆 Şampiyonlar Ligi Sıralaması` as a separate tab and a hidden `.champions-shell` section. Render columns `Sıra`, `Oyuncu`, `Puan`, `🎯`, `⚽`; style only ranks 1-3 gold, silver, and bronze. Below it render matchweek-one participant predictions returned by the server; null predicted scores render as `*-*` and completed values render normally.

- [ ] **Step 4: Add ranking refresh behavior**

Implement `loadChampionsRanking()` to call both RPCs with the current token, season, and week. Call it on tab open and subscribe to realtime changes for `champions_league_results`; a result event refreshes the ranking only if that section is active. Do not add Champions League rows to `scoreRows`, `loadGeneralBoard`, `loadSezuBoard`, or Friend League RPCs.

- [ ] **Step 5: Add explicit isolation assertions**

Extend the UI/database contract tests to assert that existing queries still use only `fixtures`, `predictions`, and `results`, while Champions League queries use only the prefixed tables/RPCs. Assert the migration contains no `alter`, `insert`, `update`, or `delete` against the three Süper Lig tables.

- [ ] **Step 6: Run the complete suite**

Run: `node --check champions-league-utils.js && node --test test/*.test.js test/*.test.mjs`

Expected: all tests PASS with no syntax errors.

- [ ] **Step 7: Commit the ranking unit**

```bash
git add index.html test/champions-league-ui.test.js test/champions-league-database-contract.test.js
git commit -m "feat: add Champions League season ranking"
```

---

### Task 5: End-to-End Verification and Production Release

**Files:**
- Modify only if verification finds a Champions League defect: `index.html`, `champions-league-utils.js`, or their focused tests.

**Interfaces:**
- Consumes the completed UI, RPCs, and exact fixture seed.
- Produces a verified GitHub `main` commit and READY Vercel production deployment.

- [ ] **Step 1: Re-run clean verification**

Run:

```bash
git diff --check
node --check champions-league-utils.js
node --test test/*.test.js test/*.test.mjs
```

Expected: no whitespace errors, syntax PASS, all tests PASS.

- [ ] **Step 2: Perform two-session database checks without exposing private predictions**

Use two authorized test player sessions. Confirm player A can save and edit all 18 scores before the lock, player B cannot see A's unresolved scores, an invalid token is rejected, and the RPC reports the server-derived lock time. Roll back or remove only explicitly created test predictions after verification; never alter real player predictions.

- [ ] **Step 3: Perform mobile browser verification**

At an iPhone-width viewport verify: both new tabs wrap without horizontal scrolling; the navy/electric-blue theme is confined to the two sections; all 18 matches appear under the correct three dates; inputs remain legible; saved summary/edit works; ranking loads; Süper Lig, Sezu, General, Friend Leagues, History, Results, Rules, and Chat still open.

- [ ] **Step 4: Review the completed change**

Inspect the final diff specifically for prediction privacy, server lock enforcement, accidental table mixing, direct table grants, token leakage, and unscoped CSS. Fix any issue with a failing regression test first, rerun Step 1, and commit the verified fix.

- [ ] **Step 5: Publish through the protected GitHub flow**

Push/create a feature branch, compare it with `main`, open a non-draft pull request listing the 18 fixtures and verification results, and squash-merge only after tests pass. Do not include `.superpowers/` or `.worktrees/`.

- [ ] **Step 6: Verify Vercel production**

Confirm the deployment for the merged commit is `READY` and `target=production`. Fetch `/`, `/champions-league-utils.js`, and the production page in a mobile browser. Verify both Champions League tabs and the existing `Bugünün Maçları` card are present.

- [ ] **Step 7: Report the release**

State that the feature is live, the prediction deadline is 8 September 2026 at 19.45 Türkiye time, the 18 fixtures were verified, Champions League ranking is independent, notifications remain paused, and provide the final passing test count.
