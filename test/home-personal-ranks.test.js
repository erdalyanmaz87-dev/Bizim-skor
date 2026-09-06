const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const generalRanking=require('../general-ranking-weekly-total.js');

const html=fs.readFileSync('index.html','utf8');

test('ana sayfadaki haftalık kişisel sıra sonuçlanan son haftayı kullanır',()=>{
  assert.match(html,/current-ranking-week\.js/);
  assert.match(html,/latestScoredWeek/);
  assert.match(html,/personalWeekRankLabel/);
});

test('4. hafta tamamlanana kadar Sezu sırası gösterilir',()=>{
  assert.match(html,/week4Complete=/);
  assert.match(html,/specialLabel\.textContent='Sezu sıram'/);
  assert.match(html,/\.in\('week',\[3,4\]\)/);
});

test('4. hafta tamamlanınca kişisel kart Şampiyonlar Ligi sırasına dönüşür',()=>{
  assert.match(html,/specialLabel\.textContent='Şampiyonlar Ligi sıram'/);
  assert.match(html,/get_champions_league_ranking/);
  assert.match(html,/league_rank/);
});

test('genel sıra kartı merkezi sıralamanın league_rank değerini gösterir',async()=>{
  const calls=[];
  const client={rpc:async name=>{
    calls.push(name);
    return{data:[
      {player_name:'Qwe1s0qwe',total_points:15,exact_scores:1,correct_results:11,league_rank:14},
      {player_name:'Erdal',total_points:13,exact_scores:0,correct_results:13,league_rank:18}
    ],error:null};
  }};

  const rank=await generalRanking.loadPersonalRank({client,playerName:' erdal '});

  assert.equal(rank,'18.');
  assert.deepEqual(calls,['get_super_league_general_ranking']);
});
