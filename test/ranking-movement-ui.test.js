const test=require('node:test');
const assert=require('node:assert/strict');

global.document={getElementById:id=>id==='weeklyRankingTitle'?{textContent:'🏆 2. Hafta Sıralaması'}:null};
const ui=require('./ranking-movement-ui.js');

test('farklı turnuvaların haftalık sıralama anlık görüntülerini birbirinden ayırır',()=>{
  const superKey=ui.contextKey({id:'weeklyRankingBoard'},'weekly');
  const championsKey=ui.contextKey({id:'championsWeeklyRankingBoard'},'weekly');
  const nationsKey=ui.contextKey({id:'nationsWeeklyRankingBoard'},'weekly');
  assert.equal(new Set([superKey,championsKey,nationsKey]).size,3);
});
