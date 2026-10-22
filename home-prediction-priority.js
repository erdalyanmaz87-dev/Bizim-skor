(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorHomePriority=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  function prioritizeTabs(names){const rows=[...(names||[])],pred=rows.indexOf('pred');if(pred<0)return rows;rows.splice(pred,1);const homeNow=rows.indexOf('home');rows.splice(homeNow>=0?homeNow+1:0,0,'pred');return rows}
  function ctaText(){return '⚽ TAHMİN YAP'}
  function weekStatus(week,saved,total,deadline=null){const complete=total>0&&saved>=total;return{week,complete,deadline,text:complete?`🟢 ${week}. Hafta tahminlerin tamamlandı ✓`:`🔴 ${week}. Hafta tahminini yapmadın →`}}
  function championsStatus(saved,total,deadline=null,week=2){const complete=total>0&&saved>=total;return{competition:'champions',week,complete,deadline,text:complete?`🟢 Şampiyonlar Ligi ${week}. Hafta tahminlerin tamamlandı ✓`:`🔴 Şampiyonlar Ligi ${week}. Hafta tahminini yapmadın →`}}
  function mergeStatuses(leagueStatuses,champions,nations=[]){return[...(leagueStatuses||[]),...(Array.isArray(champions)?champions:champions?[champions]:[]),...(nations||[])]}
  function statusTexts(rows){return (rows||[]).map(x=>x.text)}
  async function getStatuses(){
    let weeks=[],fixtures=[];
    try{weeks=[...(visiblePredictionWeeks||[])];fixtures=[...(allFixtures||[])]}catch(_){return[]}
    const name=localStorage.getItem('bizimSkorName');if(!name||!weeks.length)return[];
    const weekFixtures=fixtures.filter(f=>weeks.includes(Number(f.week)));
    const ids=weekFixtures.map(f=>Number(f.id));
    const [q,results]=await Promise.all([
      sb.from('predictions').select('week,fixture_id').eq('player_name',name).in('week',weeks),
      ids.length?sb.from('results').select('fixture_id,home_score,away_score').in('fixture_id',ids):Promise.resolve({data:[],error:null})
    ]);
    if(q.error)throw q.error;
    // Do not hide any round if completion cannot be verified.
    if(results.error)console.warn('super league completion check',results.error);
    const finished=new Set((results.data||[]).filter(r=>r.home_score!=null&&r.away_score!=null).map(r=>Number(r.fixture_id)));
    return weeks.map(week=>{
      const rows=weekFixtures.filter(f=>Number(f.week)===Number(week));
      if(!results.error&&rows.length&&rows.every(f=>finished.has(Number(f.id))&&(!f.kickoff||Date.parse(f.kickoff)<=Date.now())))return null;
      const total=rows.length,saved=new Set((q.data||[]).filter(p=>Number(p.week)===Number(week)).map(p=>p.fixture_id)).size;
      const deadline=rows.map(f=>f.kickoff).filter(Boolean).sort()[0]||null;
      return weekStatus(week,saved,total,deadline);
    }).filter(Boolean);
  }
  async function getChampionsStatuses(){
    const token=localStorage.getItem('bizimSkorFriendToken');if(!token)return[];
    const q=await sb.rpc('get_champions_league_available_weeks',{p_token:token,p_season:'2026/27'});
    if(q.error)throw q.error;
    const weeks=[...new Set((q.data||[]).map(x=>Number(x.week)).filter(Number.isFinite))].sort((a,b)=>a-b).slice(-2);
    const details=await Promise.all(weeks.map(async week=>{
      const result=await sb.rpc('get_champions_league_week',{p_token:token,p_season:'2026/27',p_week:week});
      if(result.error)throw result.error;
      return{week,rows:result.data||[]};
    }));
    const ids=[...new Set(details.flatMap(x=>x.rows.map(row=>Number(row.fixture_id)).filter(Number.isFinite)))];
    let finished=new Set(),resultsAvailable=false;
    if(ids.length){
      const results=await sb.from('champions_league_results').select('fixture_id,home_score,away_score').in('fixture_id',ids);
      if(!results.error){
        resultsAvailable=true;
        finished=new Set((results.data||[]).filter(x=>x.home_score!=null&&x.away_score!=null).map(x=>Number(x.fixture_id)));
      }else console.warn('champions completion check',results.error);
    }
    return details.filter(({rows})=>!rows.length||!rows.every(x=>x.real_home!=null&&x.real_away!=null&&Date.parse(x.kickoff)<=Date.now())).map(({week,rows})=>{
      const saved=rows.filter(x=>x.predicted_home!=null&&x.predicted_away!=null).length;
      const deadline=rows.map(x=>x.kickoff).filter(Boolean).sort()[0]||null;
      return championsStatus(saved,rows.length,deadline,week);
    });
  }
  async function getChampionsStatus(){return(await getChampionsStatuses()).at(-1)||null}
  async function getNationsStatuses(){try{if(root.BizimSkorNationsUI?.getStatuses)return await root.BizimSkorNationsUI.getStatuses()}catch(error){console.warn('nations prediction CTA status',error)}return[]}
  async function refresh(){const tab=document.querySelector('.tabs .tab[data-tab="pred"]');if(!tab)return;tab.innerHTML='<span class="pred-content"><span class="pred-main">⚽ TAHMİN YAP</span><span class="pred-statuses"><span class="pred-sub">Tahminlerini yapmak için dokun</span></span></span><span class="pred-arrow">›</span>';let leagueStatuses=[];try{leagueStatuses=await getStatuses()}catch(error){console.warn('league prediction CTA status',error)}let champions=null;try{champions=await getChampionsStatuses()}catch(error){console.warn('champions prediction CTA status',error)}const nations=await getNationsStatuses();const statuses=mergeStatuses(leagueStatuses,champions,nations);if(statuses.length){const box=tab.querySelector('.pred-statuses');box.innerHTML=statuses.map(status=>`<span class="pred-sub ${status.complete?'pred-done':'pred-missing'}${status.competition==='champions'?' pred-champions':''}${status.competition==='nations'?' pred-nations':''}">${status.text}</span>`).join('')}}
  function mount(){const tabs=document.querySelector('.tabs'),pred=tabs?.querySelector('.tab[data-tab="pred"]'),home=tabs?.querySelector('.tab[data-tab="home"]');if(!tabs||!pred)return;if(home&&home.nextElementSibling!==pred)tabs.insertBefore(pred,home.nextSibling);pred.classList.add('prediction-primary-tab');if(!document.getElementById('predictionPriorityStyles'))document.head.insertAdjacentHTML('beforeend','<style id="predictionPriorityStyles">.tabs .prediction-primary-tab{flex:1 1 100%;order:0;min-height:76px;padding:10px 14px;background:linear-gradient(180deg,#ffffff,#f8fafc);color:#0f172a;border:2px solid #0f172a;border-bottom-width:5px;box-shadow:0 5px 0 #cbd5e1,0 10px 20px rgba(15,23,42,.14);text-align:left;display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer;transform:translateY(0);transition:transform .12s,box-shadow .12s}.tabs .prediction-primary-tab:active{transform:translateY(3px);box-shadow:0 2px 0 #cbd5e1,0 5px 12px rgba(15,23,42,.12)}.tabs .prediction-primary-tab.active{background:linear-gradient(180deg,#fff,#eff6ff);color:#0f172a;border-color:#1d4ed8}.prediction-primary-tab .pred-content{min-width:0}.prediction-primary-tab .pred-main{display:block;font-size:19px;font-weight:900;letter-spacing:.2px}.prediction-primary-tab .pred-statuses{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.prediction-primary-tab .pred-sub{display:inline-block;padding:5px 8px;border-radius:8px;font-size:12px;font-weight:900}.prediction-primary-tab .pred-missing{background:#fee2e2;color:#b91c1c}.prediction-primary-tab .pred-done{background:#dcfce7;color:#15803d}.prediction-primary-tab .pred-champions,.prediction-primary-tab .pred-nations{flex-basis:100%;width:max-content;border:1px solid #93c5fd}.prediction-primary-tab .pred-nations.pred-missing{background:#fee2e2;color:#991b1b;border-color:#fca5a5}.prediction-primary-tab .pred-nations.pred-done{background:#dcfce7;color:#166534;border-color:#86efac}.prediction-primary-tab .pred-arrow{font-size:34px;line-height:1;font-weight:900;color:#1d4ed8}</style>');refresh();setTimeout(refresh,700);setTimeout(refresh,1800);document.addEventListener('change',e=>{if(e.target?.id==='predictionWeekSelect')setTimeout(refresh,50)});window.addEventListener('focus',refresh);window.addEventListener?.('bizimskor:session-ready',refresh);window.addEventListener?.('bizimskor:nations-ready',refresh)}
  return{prioritizeTabs,ctaText,weekStatus,championsStatus,mergeStatuses,statusTexts,getStatuses,getChampionsStatus,getChampionsStatuses,getNationsStatuses,mount,refresh};
});