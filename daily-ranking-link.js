(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorDailyRanking=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const leagues={super_lig:{label:'Süper Lig'},champions_league:{label:'Şampiyonlar Ligi',prefix:'champions_league'},nations_league:{label:'Uluslar Ligi',prefix:'nations_league'}};
function targets(matches){const seen=new Set();return(matches||[]).filter(m=>{const key=m.competition||'super_lig';if(!leagues[key]||seen.has(key))return false;seen.add(key);return true}).map(m=>({competition:m.competition||'super_lig',id:Number(m.fixture_id??m.id)}));}
function heading(day,safe){const items=targets(day.matches),title=`<h2>⚽ ${safe(day.label)}</h2>`;if(!items.length)return title;const links=items.map(t=>`<button type="button" class="bs-daily-ranking-link" data-daily-ranking="${t.competition}" data-fixture-id="${t.id}">🔴 Canlı Puan Durumu${items.length>1?' · '+leagues[t.competition].label:''}</button>`).join('');return `<div class="bs-daily-heading">${title}<div class="bs-daily-ranking-actions">${links}</div></div>`;}
async function fixtureContext(target){
 if(!leagues[target.competition]||!Number.isSafeInteger(target.id)||target.id<=0)throw new Error('Maç bilgisi bulunamadı.');
 if(target.competition==='super_lig'){const q=await root.sb.from('fixtures').select('week,season').eq('id',target.id).single();if(q.error)throw q.error;if(q.data?.week)return q.data;}
 else{
  const token=root.localStorage?.getItem('bizimSkorFriendToken');if(!token)throw new Error('Önce oyuncu hesabına giriş yap.');
  const prefix=leagues[target.competition].prefix,args={p_token:token,p_season:'2026/27'};
  const q=await root.sb.rpc('get_'+prefix+'_available_weeks',args);if(q.error)throw q.error;
  const weeks=[...new Set((q.data||[]).map(r=>Number(r.week)).filter(w=>Number.isInteger(w)&&w>0))].sort((a,b)=>b-a);
  for(const week of weeks){const row=await root.sb.rpc('get_'+prefix+'_week',{...args,p_week:week});if(row.error)throw row.error;if((row.data||[]).some(f=>Number(f.fixture_id??f.id)===target.id))return{week,season:args.p_season};}
 }
 throw new Error('Bu maçın haftası bulunamadı. Lütfen tekrar dene.');
}
async function open(target){
 const context=await fixtureContext(target),strip=root.BizimSkorWeeklyRankingStrip;if(!strip)throw new Error('Sıralama hazırlanıyor. Lütfen tekrar dene.');
 await strip.setup();
 if(!root.BizimSkorScreenNavigationRuntime?.open('weeklyRankings',context))throw new Error('Sıralama ekranı açılamadı.');
 if(target.competition==='champions_league')await strip.refreshChampionsWeeks();
 if(target.competition==='nations_league')await strip.refreshNationsWeeks();
 strip.setCompetition(target.competition,false);
 if(target.competition==='super_lig'){const select=root.document.getElementById('weeklyRankingWeekSelect');if(select)select.value=String(context.week);await root.loadWeeklyRanking(Number(context.week));}
 else if(target.competition==='champions_league')await strip.loadChampionsWeeklyRanking(Number(context.week));
 else await strip.loadNationsWeeklyRanking(Number(context.week));
}
function mount(){const doc=root.document;if(!doc)return;const style=doc.createElement('style');style.textContent='.bs-daily-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}.daily-card .bs-daily-heading h2{margin:0;flex:1;min-width:0}.bs-daily-ranking-actions{display:flex;flex-direction:column;align-items:flex-end;gap:5px}.daily-card .bs-daily-ranking-link{width:auto;min-height:40px;padding:7px 9px;border:1px solid #fca5a5;border-radius:10px;background:#fff1f2;color:#b91c1c;font-size:12px;font-weight:800;line-height:1.3;cursor:pointer}.bs-daily-ranking-link:focus-visible{outline:3px solid #2563eb;outline-offset:2px}html[data-theme="dark"] .daily-card .bs-daily-ranking-link{background:#451a1a;color:#fecaca;border-color:#991b1b}@media(max-width:390px){.daily-card .bs-daily-heading h2{font-size:16px}.daily-card .bs-daily-ranking-link{font-size:11px;max-width:155px}}';doc.head.appendChild(style);
 doc.addEventListener('click',async event=>{const button=event.target?.closest?.('[data-daily-ranking]');if(!button||button.disabled)return;button.disabled=true;try{await open({competition:button.dataset.dailyRanking,id:Number(button.dataset.fixtureId)});}catch(error){root.alert?.(error.message||'Canlı sıralama açılamadı. Lütfen tekrar dene.');}finally{button.disabled=false;}});
}
return{targets,heading,fixtureContext,open,mount};
});
