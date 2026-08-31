const test=require('node:test');
const assert=require('node:assert/strict');

const History=require('../history-utils');
const FriendLeagues=require('../friend-leagues-utils');

const rows=[
  {name:'Ahmet',points:11,exact:2,correct:5},
  {name:'Rakis',points:11,exact:1,correct:7},
  {name:'Cimbom',points:10,exact:2,correct:4},
  {name:'İsmail',points:10,exact:1,correct:6},
  {name:'Emrah',points:9,exact:1,correct:6}
];

test('haftalık ve genel sıralama yalnız puana göre yoğun sıra verir',()=>{
  const ranked=History.buildWeeklyRanking(rows);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Ahmet',1],['Rakis',1],['Cimbom',2],['İsmail',2],['Emrah',3]
  ]);
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
