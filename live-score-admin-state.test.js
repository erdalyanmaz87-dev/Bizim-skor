const test=require('node:test');
const assert=require('node:assert/strict');
const live=require('./live-score-ui.js');

test('ilk yarı dakikası kaydedilince geçen süre eklenir ama 45 dakikayı geçmez',()=>{
  const savedAt='2026-09-08T18:00:00.000Z';
  assert.equal(live.projectAdminElapsed({elapsed:3,savedAt,now:'2026-09-08T18:10:59.000Z'}),13);
  assert.equal(live.projectAdminElapsed({elapsed:44,savedAt,now:'2026-09-08T18:05:00.000Z'}),45);
});

test('ikinci yarı dakikası 90 dakikada durur',()=>{
  const savedAt='2026-09-08T19:00:00.000Z';
  assert.equal(live.projectAdminElapsed({elapsed:53,savedAt,now:'2026-09-08T19:07:10.000Z'}),60);
  assert.equal(live.projectAdminElapsed({elapsed:88,savedAt,now:'2026-09-08T19:10:00.000Z'}),90);
});

test('maç taslakları fixture id bazında birbirinden bağımsız tutulur',()=>{
  const drafts=live.createAdminDraftMap([
    {fixture_id:1,home_score:2,away_score:1,elapsed:67,fetched_at:'2026-09-08T19:00:00Z'},
    {fixture_id:2,home_score:0,away_score:0,elapsed:12,fetched_at:'2026-09-08T19:01:00Z'}
  ]);
  live.updateAdminDraft(drafts,1,{home:3,away:1,elapsed:70,savedAt:'2026-09-08T19:03:00Z'});
  assert.deepEqual(drafts.get('1'),{home:3,away:1,elapsed:70,savedAt:'2026-09-08T19:03:00Z'});
  assert.deepEqual(drafts.get('2'),{home:0,away:0,elapsed:12,savedAt:'2026-09-08T19:01:00Z'});
});

test('oyuncunun canlı skor kartında manuel dakika kaydetme zamanından itibaren ilerler',()=>{
  const html=live.renderLiveMatchMarkup(
    {competition:'super_lig',id:7,home_team:'A',away_team:'B'},
    {status:'1H',elapsed:3,home_score:0,away_score:0,fetched_at:'2026-09-08T18:00:00.000Z'},
    new Date('2026-09-08T18:10:59.000Z')
  );
  assert.match(html,/13’/);
});
