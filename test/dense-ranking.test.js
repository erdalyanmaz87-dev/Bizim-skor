const test=require('node:test');
const assert=require('node:assert/strict');

const History=require('../history-utils');
const FriendLeagues=require('../friend-leagues-utils');

const rows=[
  {name:'Ahmet',points:11,inviteCount:1,exact:2,correct:5,createdAt:'2026-08-01'},
  {name:'Rakis',points:11,inviteCount:3,exact:1,correct:7,createdAt:'2026-08-02'},
  {name:'Cimbom',points:10,inviteCount:0,exact:2,correct:4,createdAt:'2026-08-03'},
  {name:'İsmail',points:10,inviteCount:0,exact:1,correct:6,createdAt:'2026-08-04'},
  {name:'Emrah',points:9,inviteCount:5,exact:1,correct:6,createdAt:'2026-08-05'}
];

test('haftalık ve genel sıralama 8. madde eşitlik sırasını uygular',()=>{
  const ranked=History.buildWeeklyRanking(rows);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Rakis',1],['Ahmet',2],['Cimbom',3],['İsmail',4],['Emrah',5]
  ]);
});

test('düşük puanlı oyuncu daha fazla davetle yüksek puanlının önüne geçemez',()=>{
  const ranked=History.buildWeeklyRanking([
    {name:'Yüksek',points:12,inviteCount:0,exact:0,correct:0,createdAt:'2026-08-02'},
    {name:'Davetçi',points:11,inviteCount:99,exact:9,correct:9,createdAt:'2026-08-01'}
  ]);
  assert.deepEqual(ranked.map(row=>row.name),['Yüksek','Davetçi']);
});

test('eşit puan ve davette tam skor sonra doğru sonuç sonra eski kayıt belirler',()=>{
  const ranked=History.buildWeeklyRanking([
    {name:'A',points:10,inviteCount:2,exact:1,correct:9,createdAt:'2026-08-01'},
    {name:'B',points:10,inviteCount:2,exact:2,correct:3,createdAt:'2026-08-03'},
    {name:'C',points:10,inviteCount:2,exact:2,correct:5,createdAt:'2026-08-04'},
    {name:'D',points:10,inviteCount:2,exact:2,correct:5,createdAt:'2026-07-31'}
  ]);
  assert.deepEqual(ranked.map(row=>row.name),['D','C','B','A']);
});

test('arkadaş ligi yardımcısı aynı kuralı uygular',()=>{
  const ranked=FriendLeagues.rankFriendLeague(rows);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Rakis',1],['Ahmet',2],['Cimbom',3],['İsmail',4],['Emrah',5]
  ]);
});
