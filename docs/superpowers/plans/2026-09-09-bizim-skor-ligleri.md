# Bizim Skor Ligleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mevcut Süper Lig, Şampiyonlar Ligi, Uluslar Ligi, arkadaş ligleri ve genel sıralamaları bozmadan; tüm resmi tahmin turlarından normalize performans üreten, 4 haftalık dönemlerle çalışan ve oyuncuları 5 kademeli tek ortak lig sisteminde yükselten/düşüren Bizim Skor Ligleri özelliğini eklemek.

**Architecture:** Lig sistemi mevcut yarışmaların puan tablolarını değiştirmeyen ayrı bir katman olacak. Veritabanında dönem, tur performansı, üyelik ve geçmiş tabloları tutulacak; istemci yalnızca yeni RPC'lerden veri okuyacak. Arayüz mevcut `index.html` içindeki Sıralamalar yapısına küçük bir `Ligim` sekmesi ve ana sayfadaki kişisel durum alanına kompakt bir lig özeti ekleyecek.

**Tech Stack:** Supabase Postgres/RPC, vanilla JavaScript, HTML/CSS, Node `node:test` tabanlı mevcut test yapısı, Vercel statik dağıtımı.

**Spec:** `docs/superpowers/specs/2026-09-09-bizim-skor-ligleri-design.md`

## Global Constraints

- Yeni ana menü oluşturulmayacak; kullanıcı arayüzünde kısa ad `Ligim`, sistem adı `Bizim Skor Ligleri` olacak.
- 5 lig: Şampiyonlar, Elit, Altın, Gümüş, Bronz.
- Lig dönemi 4 hafta.
- Lig sistemine dahil olmak için dönem içinde en az 2 ayrı tahmin turu gerekir.
- Katılmadığı tur oyuncuya 0 puan yazmaz.
- Yeni oyuncu Bronz Lig'den başlar.
- Yükselme/düşme kontenjanları dönem başında sabitlenir ve dönem boyunca değişmez.
- Mevcut Süper Lig, CL, Uluslar Ligi, arkadaş ligi, canlı skor, bildirim ve davet akışlarına davranış değişikliği yapılmayacak.
- Production'a kullanıcı onayı olmadan deploy edilmeyecek.

---

### Task 1: Lig matematiği için izole istemci modülü

**Files:**
- Create: `league-system-utils.js`
- Create: `test/league-system-utils.test.js`

**Interfaces:**
- Produces: `normalizePerformance(rank, participantCount) -> number|null`
- Produces: `allocateLeagueCapacities(activeCount) -> {champions,elite,gold,silver,bronze}`
- Produces: `promotionSlots(capacities) -> {champions_elite,elite_gold,gold_silver,silver_bronze}`
- Produces: `isLeagueEligible(validRoundCount) -> boolean`
- Produces: `describeLeagueStatus({rank,size,promotionSlots,relegationSlots,leagueCode}) -> object`

- [ ] **Step 1: Write failing unit tests**

```js
const test=require('node:test');
const assert=require('node:assert/strict');
const League=require('../league-system-utils');

test('69 kişi içinde ilk sırayı 100 performansa çevirir',()=>{
  assert.equal(League.normalizePerformance(1,69),100);
});

test('katılmadığı turu sıfır puan olarak üretmez',()=>{
  assert.equal(League.normalizePerformance(null,69),null);
});

test('iki turdan az oyuncuyu lig için uygun saymaz',()=>{
  assert.equal(League.isLeagueEligible(1),false);
  assert.equal(League.isLeagueEligible(2),true);
});

test('63 oyuncuyu 5 lige tam dağıtır',()=>{
  const c=League.allocateLeagueCapacities(63);
  assert.deepEqual(c,{champions:6,elite:9,gold:13,silver:16,bronze:19});
  assert.equal(Object.values(c).reduce((a,b)=>a+b,0),63);
});

test('komşu lig kontenjanlarını kapasiteyi koruyacak şekilde üretir',()=>{
  assert.deepEqual(League.promotionSlots({champions:6,elite:9,gold:13,silver:16,bronze:19}),{
    champions_elite:2,
    elite_gold:3,
    gold_silver:4,
    silver_bronze:5
  });
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test test/league-system-utils.test.js`

Expected: FAIL because `league-system-utils.js` does not exist.

- [ ] **Step 3: Implement minimal pure functions**

```js
function normalizePerformance(rank,participantCount){
  if(!Number.isInteger(rank)||!Number.isInteger(participantCount)||rank<1||participantCount<2||rank>participantCount)return null;
  return Math.round((100*(1-((rank-1)/participantCount)))*100)/100;
}

function isLeagueEligible(validRoundCount){
  return Number(validRoundCount)>=2;
}

function allocateLeagueCapacities(activeCount){
  const n=Math.max(0,Math.trunc(Number(activeCount)||0));
  if(!n)return{champions:0,elite:0,gold:0,silver:0,bronze:0};
  const champions=Math.round(n*0.10);
  const elite=Math.round(n*0.15);
  const gold=Math.round(n*0.20);
  const silver=Math.round(n*0.25);
  const bronze=n-champions-elite-gold-silver;
  return{champions,elite,gold,silver,bronze};
}

function promotionSlots(c){
  return{
    champions_elite:Math.max(1,Math.round(c.champions*0.25)),
    elite_gold:Math.max(1,Math.round(c.elite*0.33)),
    gold_silver:Math.max(1,Math.round(c.gold*0.31)),
    silver_bronze:Math.max(1,Math.round(c.silver*0.31))
  };
}
```

Implement `describeLeagueStatus` with four states: `promotion`, `safe`, `relegation`, `championship`.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --test test/league-system-utils.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add league-system-utils.js test/league-system-utils.test.js
git commit -m "feat: add Bizim Skor league math utilities"
```

---

### Task 2: Veritabanı şeması ve dönem kilidi

**Files:**
- Create: `supabase/migrations/20260909190000_bizim_skor_leagues.sql`

**Interfaces:**
- Produces tables: `league_periods`, `league_round_performance`, `league_memberships`, `league_history`
- Produces RPC: `get_current_league_period()`
- Produces SQL helper: `league_normalized_performance(rank integer, participant_count integer)`
- Produces SQL helper: `league_allocate_capacities(active_count integer)` returning JSONB

- [ ] **Step 1: Add migration with tables and constraints**

Use UUID/identity keys following repository conventions. Required unique constraints:

```sql
unique(period_id, player_id, competition, round_key)
unique(period_id, player_id)
unique(period_id, player_id, from_league, to_league)
```

`league_periods` must store locked JSON values:

```sql
locked_capacities jsonb not null default '{}'::jsonb,
locked_promotion_slots jsonb not null default '{}'::jsonb,
status text not null check (status in ('open','closed'))
```

- [ ] **Step 2: Add SQL normalization function**

```sql
create or replace function public.league_normalized_performance(
  p_rank integer,
  p_participant_count integer
) returns numeric
language sql immutable
as $$
  select case
    when p_rank is null or p_participant_count < 2 or p_rank < 1 or p_rank > p_participant_count then null
    else round((100 * (1 - ((p_rank - 1)::numeric / p_participant_count::numeric)))::numeric, 2)
  end;
$$;
```

- [ ] **Step 3: Add capacity allocator**

Allocator must guarantee `champions + elite + gold + silver + bronze = active_count` for 0, 1, 2, 10, 63, 69, 100.

- [ ] **Step 4: Add read-safe RLS / grants matching current public RPC pattern**

Direct table mutation from browser must not be granted. Browser reads league data through RPCs added in later tasks.

- [ ] **Step 5: Apply on development branch/database only and verify schema**

Run migration in non-production environment. Verify:

```sql
select league_normalized_performance(1,69);
select league_allocate_capacities(63);
```

Expected first result: `100.00`.
Expected capacities total: `63`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260909190000_bizim_skor_leagues.sql
git commit -m "feat: add Bizim Skor league database model"
```

---

### Task 3: Resmi tahmin turlarından lig performansı üretme

**Files:**
- Modify: `supabase/migrations/20260909190000_bizim_skor_leagues.sql` only if still unshipped on dev; otherwise create `supabase/migrations/20260909193000_bizim_skor_league_rounds.sql`
- Test via SQL verification queries documented in migration comments

**Interfaces:**
- Produces RPC: `refresh_league_round(p_period_id bigint, p_competition text, p_round_key text)`
- Consumes existing competition rankings/results without modifying them.

- [ ] **Step 1: Define competition adapters**

Supported competition codes:

```text
super_lig
champions_league
nations_league
```

For each adapter, derive only players who actually submitted predictions for the requested round and compute that round's ranking from the existing scoring result source.

- [ ] **Step 2: Insert/update normalized performance idempotently**

Use `insert ... on conflict (...) do update` keyed by `(period_id, player_id, competition, round_key)`.

Persist:
- participant_count
- rank
- performance_score
- exact_score_count

- [ ] **Step 3: Verify missing competitions do not create zero rows**

A player who did not enter a CL round must have **no row** for that CL `round_key`, not a performance row with `0`.

- [ ] **Step 4: Verify one round cannot be duplicated**

Call refresh twice and assert row counts are identical.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260909193000_bizim_skor_league_rounds.sql
git commit -m "feat: calculate league performance from prediction rounds"
```

---

### Task 4: Lig üyeliği, sıralama ve sabit kontenjanlar

**Files:**
- Create: `supabase/migrations/20260909200000_bizim_skor_league_memberships.sql`

**Interfaces:**
- Produces RPC: `refresh_league_memberships(p_period_id bigint)`
- Produces RPC: `get_my_league_summary(p_token text)`
- Produces RPC: `get_league_table(p_token text, p_league_code text default null)`

- [ ] **Step 1: Aggregate valid round counts and averages**

A membership becomes eligible only when:

```sql
count(distinct competition || ':' || round_key) >= 2
```

Performance score is `avg(performance_score)` over existing round rows only.

- [ ] **Step 2: Place new eligible players in Bronz**

If no previous closed-period history exists for the player, use `bronze` as `league_code` and `starting_league_code`.

- [ ] **Step 3: Preserve period-start locked capacities**

Once `locked_capacities` and `locked_promotion_slots` are set for an open period, `refresh_league_memberships` must not rewrite them.

- [ ] **Step 4: Rank only inside each player's current league**

Use window ordering:

```sql
order by performance_score desc,
         valid_round_count desc,
         exact_score_count desc,
         player_id asc
```

- [ ] **Step 5: Verify 69-player late join behavior**

Scenario:
1. Period starts with 40 Bronz players and 10 promotion slots.
2. Add 20 new eligible Bronz players during the period.
3. `locked_promotion_slots` remains 10 for the current period.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260909200000_bizim_skor_league_memberships.sql
git commit -m "feat: add league membership and stable promotion zones"
```

---

### Task 5: İdempotent dönem kapanışı ve yükselme/düşme

**Files:**
- Create: `supabase/migrations/20260909203000_bizim_skor_league_period_close.sql`

**Interfaces:**
- Produces RPC: `close_league_period(p_period_id bigint)`

- [ ] **Step 1: Lock close operation**

Use transaction/advisory lock or row lock so two calls cannot close the same period simultaneously.

- [ ] **Step 2: Apply mirrored exchanges**

For each boundary, number promoted must equal number relegated:

```text
champions <-> elite
elite <-> gold
gold <-> silver
silver <-> bronze
```

- [ ] **Step 3: Persist history before opening next period**

Write `from_league`, `to_league`, final rank and performance to `league_history`.

- [ ] **Step 4: Mark period closed and reject second close**

Second invocation must be a no-op or return already-closed status, never duplicate movements.

- [ ] **Step 5: SQL verification**

Verify:
- league sizes after exchange equal locked capacities,
- total membership count unchanged except newly eligible players reserved for next period,
- second close creates no additional history rows.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260909203000_bizim_skor_league_period_close.sql
git commit -m "feat: close league periods with balanced promotion"
```

---

### Task 6: Ligim arayüz modülü

**Files:**
- Create: `league-system-ui.js`
- Create: `test/league-system-ui.test.js`
- Modify: `index.html`

**Interfaces:**
- Consumes RPC: `get_my_league_summary(p_token)`
- Consumes RPC: `get_league_table(p_token,p_league_code)`
- Produces global: `BizimSkorLeagues.mount()`

- [ ] **Step 1: Write UI rendering tests**

Tests must assert:
- default screen shows only user's league,
- promotion rows have `league-promotion-zone`,
- relegation rows have `league-relegation-zone`,
- current player row has `league-me`,
- ineligible user sees `Lig sistemine katılmak için 1 tahmin turu daha tamamla`,
- rules panel contains 4-week and 2-round rules.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test test/league-system-ui.test.js`

- [ ] **Step 3: Implement pure render functions**

Required functions:

```js
renderLeagueSummary(summary)
renderLeagueTable(rows,summary)
renderLeagueRules()
renderOtherLeagueChips(counts,currentLeague)
```

All user-provided names must be HTML escaped using the same strategy as existing UI modules.

- [ ] **Step 4: Integrate into existing `index.html` without adding a new top-level menu**

Add script includes:

```html
<script src="league-system-utils.js"></script>
<script src="league-system-ui.js" defer></script>
```

Inside existing ranking area, add only a compact `Ligim` selector/section. Do not remove or rename existing tabs.

In `#knownPlayer` / personal status area, add a small mount point:

```html
<div id="personalLeagueSummary"></div>
```

- [ ] **Step 5: Add scoped CSS only**

All new CSS classes must begin with `league-` to avoid affecting `.tab`, `.c`, tables or existing competition components.

- [ ] **Step 6: Run all Node tests**

Run: `node --test test/*.test.js *.test.js`

Expected: existing tests + league tests PASS.

- [ ] **Step 7: Commit**

```bash
git add league-system-ui.js league-system-utils.js test/league-system-ui.test.js index.html
git commit -m "feat: add Ligim UI without changing existing rankings"
```

---

### Task 7: Regression verification — başka yerleri bozma kontrolü

**Files:**
- No feature code unless a regression is found.

**Interfaces:**
- Verifies all existing public flows stay unchanged.

- [ ] **Step 1: Run complete repository test suite**

Run all current Node tests.

- [ ] **Step 2: Compare existing ranking RPC outputs before/after on a fixed snapshot**

Check at minimum:
- Süper Lig weekly ranking
- Süper Lig general ranking
- Champions League ranking
- Nations League ranking
- friend league ranking

Expected: outputs identical to baseline for the same stored data.

- [ ] **Step 3: Verify no live-score tables/functions were modified**

Compare migration/schema changes; league migrations must not alter `live_score_*` tables or functions.

- [ ] **Step 4: Verify no notification/invite behavior changed**

Run existing push/invite tests and confirm no changed source file outside the league integration points.

- [ ] **Step 5: Verify security advisors after dev migration**

Run Supabase security/performance advisors and address only issues introduced by new league objects.

- [ ] **Step 6: Commit only if regression-test fixtures/docs were added**

Commit message:

```text
test: verify Bizim Skor leagues do not change existing competitions
```

---

### Task 8: Development preview and user approval gate

**Files:**
- No production migration/deploy yet.

**Interfaces:**
- Produces a preview on `feature/invite-growth-v1` only.

- [ ] **Step 1: Deploy only the feature branch preview**

Confirm Vercel preview build succeeds.

- [ ] **Step 2: Seed/test a representative league period in development**

Use 63-player and late-join scenarios; do not write test data to production.

- [ ] **Step 3: Show user the preview behavior**

Confirm:
- personal league summary,
- `Ligim` table,
- promotion/relegation colors,
- other league chips,
- rules panel,
- ineligible one-round state.

- [ ] **Step 4: Stop before production**

Do not apply migrations to production and do not merge/deploy to production until Erdal explicitly approves the preview.
