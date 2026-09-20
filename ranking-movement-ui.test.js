const test=require('node:test');
const assert=require('node:assert/strict');
global.document={getElementById:id=>id==='weeklyRankingTitle'?{textContent:'🏆 5. Hafta Sıralaması'}:null};
const ui=require('./ranking-movement-ui.js');
test('tum ana siralama hedeflerini kapsar',()=>{assert.deepEqual(ui.rankingTargets().map(([id])=>id),['generalBoard','weeklyRankingBoard','championsRankingBoard','championsWeeklyRankingBoard','nationsRankingBoard','nationsWeeklyRankingBoard','friendLeagueRanking'])});
test('super hafta anahtari bootstrap anahtariyla aynidir',()=>{const B=require('./ranking-movement-bootstrap');assert.equal(ui.contextKey({id:'weeklyRankingBoard'},'weekly'),B.superWeeklyKey('2026/27',5))});
test('arkadas ligi anahtari lig id ile ayrilir',()=>{global.document.getElementById=()=>null;assert.notEqual(ui.contextKey({dataset:{rankingContext:'a'}},'friend'),ui.contextKey({dataset:{rankingContext:'b'}},'friend'))});
test('ayni yon oku tekrar eklenmez',()=>{let inserted=0;const existing={textContent:'▲',classList:{contains:n=>n==='bs-rank-up'},remove(){}};const node={classList:{add(){}},querySelector:()=>existing,insertAdjacentHTML:()=>inserted++};assert.equal(ui.reconcileBadge(node,{direction:'up'},{badge:()=>''}),false);assert.equal(inserted,0)});
test('hareket varsa sira hucresini ortalama sinifi ekler',()=>{const classes=[];const node={classList:{add:n=>classes.push(n)},querySelector:()=>null,insertAdjacentHTML(){}};ui.reconcileBadge(node,{direction:'down'},{badge:()=>'<span></span>'});assert.deepEqual(classes,['bs-rank-cell'])});
