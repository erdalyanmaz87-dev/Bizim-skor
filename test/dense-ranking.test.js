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

test('haftalık ve genel sıralama puan tam skor doğru sonuç sırasını kullanır',()=>{
  const ranked=History.buildWeeklyRanking(rows);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Ahmet',1],['Rakis',2],['Cimbom',3],['İsmail',4],['Emrah',5]
  ]);
});

test('arkadaş ligi puan tam skor doğru sonuç sırasını kullanır',()=>{
  const ranked=FriendLeagues.rankFriendLeague(rows);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['Ahmet',1],['Rakis',2],['Cimbom',3],['İsmail',4],['Emrah',5]
  ]);
});

test('üç ölçüt de eşitse derece paylaşılır ve sonraki derece atlanır',()=>{
  const ranked=History.buildWeeklyRanking([
    {name:'İpek',points:19,exact:3,correct:10},
    {name:'Rakis',points:19,exact:3,correct:10},
    {name:'Mert',points:15,exact:2,correct:9}
  ]);
  assert.deepEqual(ranked.map(row=>[row.name,row.rank]),[
    ['İpek',1],['Rakis',1],['Mert',3]
  ]);
});
