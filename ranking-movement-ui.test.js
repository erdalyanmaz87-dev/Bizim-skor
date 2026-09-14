const test=require('node:test');
const assert=require('node:assert/strict');
global.document={getElementById:id=>id==='weeklyRankingTitle'?{textContent:'🏆 5. Hafta Sıralaması'}:null};
const ui=require('./ranking-movement-ui.js');
test('tum ana siralama hedeflerini kapsar',()=>{assert.deepEqual(ui.rankingTargets().map(([id])=>id),['generalBoard','weeklyRankingBoard','championsRankingBoard','championsWeeklyRankingBoard','nationsRankingBoard','nationsWeeklyRankingBoard','friendLeagueRanking'])});
test('super hafta anahtari bootstrap anahtariyla aynidir',()=>{const B=require('./ranking-movement-bootstrap');assert.equal(ui.contextKey({id:'weeklyRankingBoard'},'weekly'),B.superWeeklyKey('2026/27',5))});
test('arkadas ligi anahtari lig id ile ayrilir',()=>{global.document.getElementById=()=>null;assert.notEqual(ui.contextKey({dataset:{rankingContext:'a'}},'friend'),ui.contextKey({dataset:{rankingContext:'b'}},'friend'))});
test('ayni rozet tekrar eklenmez',()=>{let inserted=0;const existing={textContent:'▲ 2',classList:{contains:n=>n==='bs-rank-up'},remove(){}};const node={querySelector:()=>existing,insertAdjacentHTML:()=>inserted++};assert.equal(ui.reconcileBadge(node,{direction:'up',amount:2},{badge:()=>''}),false);assert.equal(inserted,0)});
