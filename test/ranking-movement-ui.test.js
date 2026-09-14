const test=require('node:test');
const assert=require('node:assert/strict');

global.document={getElementById:id=>id==='weeklyRankingTitle'?{textContent:'🏆 2. Hafta Sıralaması'}:null};
const ui=require('../ranking-movement-ui.js');

test('farklı turnuvaların haftalık sıralama anlık görüntülerini birbirinden ayırır',()=>{
  const superKey=ui.contextKey({id:'weeklyRankingBoard'},'weekly');
  const championsKey=ui.contextKey({id:'championsWeeklyRankingBoard'},'weekly');
  const nationsKey=ui.contextKey({id:'nationsWeeklyRankingBoard'},'weekly');
  assert.equal(new Set([superKey,championsKey,nationsKey]).size,3);
});

test('oyundaki genel haftalık kupa ve arkadaş ligi sıralamalarını kapsar',()=>{
  assert.deepEqual(ui.rankingTargets().map(([id])=>id),[
    'generalBoard','weeklyRankingBoard','championsRankingBoard','championsWeeklyRankingBoard',
    'nationsRankingBoard','nationsWeeklyRankingBoard','friendLeagueRanking'
  ]);
});

test('arkadaş ligi anlık görüntülerini seçilen lige göre ayırır',()=>{
  global.document.getElementById=()=>null;
  const first=ui.contextKey({id:'friendLeagueRanking',dataset:{rankingContext:'lig-1'}},'friend');
  const second=ui.contextKey({id:'friendLeagueRanking',dataset:{rankingContext:'lig-2'}},'friend');
  assert.notEqual(first,second);
});

test('aynı hareket rozeti zaten görünüyorsa DOMu yeniden değiştirmez',()=>{
  let removed=0,inserted=0;
  const existing={textContent:'▲ 2',classList:{contains:name=>name==='bs-rank-up'},remove:()=>removed++};
  const rankNode={querySelector:()=>existing,insertAdjacentHTML:()=>inserted++};
  const changed=ui.reconcileBadge(rankNode,{direction:'up',amount:2},{badge:()=>'<span>▲ 2</span>'});
  assert.equal(changed,false);
  assert.equal(removed,0);
  assert.equal(inserted,0);
});
