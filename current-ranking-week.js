(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorCurrentRankingWeek=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
function latestScoredWeek(fixtures,results){const weekByFixture=new Map((fixtures||[]).map(f=>[Number(f.id),Number(f.week)]));const weeks=(results||[]).filter(r=>r.home_score!=null&&r.away_score!=null).map(r=>weekByFixture.get(Number(r.fixture_id))).filter(Number.isFinite);return weeks.length?Math.max(...weeks):null}
function label(week){return week?`${week}. Hafta Süper Lig Sıralaması`:'Süper Lig Sıralaması'}
return Object.freeze({latestScoredWeek,label});
});
