const fs=require('fs');
const vm=require('vm');
const assert=require('assert');

const code=fs.readFileSync('champions-match-summary.js','utf8');
const context={window:{}};
vm.createContext(context);
vm.runInContext(code,context);
const api=context.window.BizimSkorChampionsMatchSummary;

const rows=[
  {fixture_id:101,home_team:'Galatasaray',away_team:'Arsenal',real_home:2,real_away:1,player_name:'Ali',predicted_home:2,predicted_away:1},
  {fixture_id:101,home_team:'Galatasaray',away_team:'Arsenal',real_home:2,real_away:1,player_name:'Veli',predicted_home:3,predicted_away:1},
  {fixture_id:101,home_team:'Galatasaray',away_team:'Arsenal',real_home:2,real_away:1,player_name:'Ayşe',predicted_home:1,predicted_away:1},
  {fixture_id:102,home_team:'Inter',away_team:'Barcelona',real_home:null,real_away:null,player_name:'Ali',predicted_home:1,predicted_away:0}
];

const summary=api.summarize(rows);
assert.strictEqual(summary.length,2);
assert.strictEqual(summary[0].fixtureId,101);
assert.deepStrictEqual(Array.from(summary[0].exactNames),['Ali']);
assert.strictEqual(summary[0].correctResultCount,2);
assert.strictEqual(summary[1].finished,false);

const html=api.render(summary,x=>String(x));
assert(html.includes('Galatasaray'));
assert(html.includes('2-1'));
assert(html.includes('🎯 Tam skor: Ali'));
assert(html.includes('⚽ Sonucu bilen: 2 kişi'));
assert(!html.includes('Katılımcı Tahminleri'));
assert(!html.includes('1-0'));
console.log('champions match summary tests passed');
