const test=require('node:test');
const assert=require('node:assert/strict');

let CL={};
try{CL=require('../champions-league-utils')}catch{}

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

test('boş skor kutusunu sıfır olarak kabul etmez',()=>{
  assert.throws(()=>CL.validateWeeklyScores(fixtures,[
    {fixture_id:1,home_score:'',away_score:'1'},
    {fixture_id:2,home_score:'0',away_score:'0'}
  ]),/Tüm maçlar/);
});

test('tam skor 4, yalnız yön 1 puandır',()=>{
  assert.equal(CL.scorePrediction({home_score:2,away_score:1},{home_score:2,away_score:1}).points,4);
  assert.equal(CL.scorePrediction({home_score:3,away_score:0},{home_score:1,away_score:0}).points,1);
});

test('rakip tahmini sonuçtan önce gizlidir',()=>{
  assert.equal(CL.visibleScore({home_score:2,away_score:1},null,false),'*-*');
  assert.equal(CL.visibleScore({home_score:2,away_score:1},null,true),'2-1');
});

test('sezon sıralaması yalnız puana göre yoğun sıra verir',()=>{
  const rows=CL.rankSeason([
    {name:'Ali',points:5,exact:1,correct:2},
    {name:'Veli',points:5,exact:0,correct:5},
    {name:'Ayşe',points:5,exact:1,correct:2},
    {name:'Zeki',points:4,exact:3,correct:6}
  ]);
  assert.deepEqual(rows.map(x=>[x.name,x.rank]),[['Ali',1],['Ayşe',1],['Veli',1],['Zeki',2]]);
});

test('fikstürü Türkiye tarihine göre gruplar',()=>{
  const groups=CL.groupFixturesByTurkeyDate([
    {id:1,kickoff:'2026-09-08T16:45:00Z'},
    {id:2,kickoff:'2026-09-09T19:00:00Z'}
  ]);
  assert.equal(groups.length,2);
  assert.equal(groups[0].dateKey,'2026-09-08');
  assert.match(groups[0].label,/8 Eylül 2026 Salı/);
});
