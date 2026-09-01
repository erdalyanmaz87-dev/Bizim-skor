const test=require('node:test');
const assert=require('node:assert/strict');

const History=require('../history-utils');
const FriendLeagues=require('../friend-leagues-utils');
const fs=require('node:fs');

const rows=[
  {name:'Ahmet',points:11,exact:2,correct:5,createdAt:'2026-08-01'},
  {name:'Rakis',points:11,exact:1,correct:7,createdAt:'2026-08-02'},
  {name:'Cimbom',points:10,exact:2,correct:4,createdAt:'2026-08-03'},
  {name:'İsmail',points:10,exact:1,correct:6,createdAt:'2026-08-04'},
  {name:'Emrah',points:9,exact:1,correct:6,createdAt:'2026-08-05'}
];

test('haftalık ve genel sıralama yalnız puana göre yoğun sıra verir',()=>{
  const ranked=History.buildWeeklyRanking(rows);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Ahmet',1],['Rakis',1],['Cimbom',2],['İsmail',2],['Emrah',3]
  ]);
});

test('kurallar ilk üç ve sonraki sıralama ayrımını açıklar',()=>{
  const html=fs.readFileSync('index.html','utf8');
  assert.match(html,/İlk üç derece içinde aynı puanı alan oyuncular aynı sırayı paylaşır/);
  assert.match(html,/İlk üç dereceden sonra sıralama 4, 5, 6/);
  assert.match(html,/tam skor, doğru sonuç ve oyuna daha önce kayıt olma zamanı/);
});

test('arkadaş ligi yalnız puana göre yoğun sıra verir',()=>{
  const ranked=FriendLeagues.rankFriendLeague(rows);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Ahmet',1],['Rakis',1],['Cimbom',2],['İsmail',2],['Emrah',3]
  ]);
});

test('aynı puan dereceyi paylaşır ve sonraki farklı puan ikinci olur',()=>{
  const ranked=History.buildWeeklyRanking([
    {name:'İpek',points:19,exact:3,correct:10},
    {name:'Rakis',points:19,exact:3,correct:10},
    {name:'Mert',points:15,exact:2,correct:9}
  ]);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['İpek',1],['Rakis',1],['Mert',2]
  ]);
});

test('ilk üç dereceden sonra oyuncular 4, 5, 6 diye tek tek sıralanır',()=>{
  const ranked=History.buildWeeklyRanking([
    ...rows,
    {name:'Zeki',points:8,exact:0,correct:8,createdAt:'2026-08-08'},
    {name:'Ayşe',points:8,exact:0,correct:8,createdAt:'2026-08-06'},
    {name:'Bora',points:8,exact:0,correct:8,createdAt:'2026-08-07'}
  ]);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Ahmet',1],['Rakis',1],['Cimbom',2],['İsmail',2],['Emrah',3],
    ['Ayşe',4],['Bora',5],['Zeki',6]
  ]);
});
