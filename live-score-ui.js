(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorLiveScore=api;api.autoMountAdmin();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const LIVE=new Set(['1H','HT','2H','ET','BT','P']);
  const TERMINAL=new Set(['FT','AET','PEN']);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  })[char]);

  function isLiveStatus(status){return LIVE.has(String(status||'').toUpperCase())}
  function isTerminalStatus(status){return TERMINAL.has(String(status||'').toUpperCase())}
  function isStale(fetchedAt,now=new Date(),maxAgeMs=600000){
    const fetched=new Date(fetchedAt).getTime(),current=new Date(now).getTime();
    return !Number.isFinite(fetched)||!Number.isFinite(current)||current-fetched>maxAgeMs;
  }
  function detectGoal(previous,current){
    if(!previous||!current)return false;
    const before=Number(previous.home_score)+Number(previous.away_score);
    const after=Number(current.home_score)+Number(current.away_score);
    return Number.isFinite(before)&&Number.isFinite(after)&&after>before;
  }
  function formatExactPredictors(names){
    const clean=Array.isArray(names)?names.filter(Boolean).map(String):[];
    if(!clean.length)return 'Şu an tam skoru bilen yok.';
    const visible=clean.slice(0,5);
    const remaining=clean.length-visible.length;
    return `🎯 Şu an tam bilenler: ${visible.join(' • ')}${remaining?` • +${remaining} kişi`:''}`;
  }
  function renderLiveMatchMarkup(fixture,liveState,now=new Date()){
    if(!liveState)return '';
    const status=String(liveState.status||'').toUpperCase();
    const stale=isStale(liveState.fetched_at,now);
    const label=isTerminalStatus(status)?'MS':isLiveStatus(status)?`🔴 CANLI${liveState.elapsed!=null?` • ${esc(liveState.elapsed)}’`:''}`:esc(status);
    const predictors=formatExactPredictors(liveState.exact_players);
    return `<div class="live-match${stale?' live-stale':''}" data-live-key="${esc(fixture.competition||'super_lig')}:${esc(fixture.id)}"><div class="live-status">${label}</div><div class="live-score-row"><b>${esc(fixture.home_team)}</b><strong>${esc(liveState.home_score)} - ${esc(liveState.away_score)}</strong><b>${esc(fixture.away_team)}</b></div><div class="live-exact-ticker"><span>${esc(predictors)}</span></div>${stale?'<div class="small">Canlı veri geçici olarak güncellenemiyor.</div>':''}</div>`;
  }

  function isAdminName(name){return String(name||'').trim().toLocaleLowerCase('tr-TR')==='erdal'}
  function validateAdminScoreInput(input={}){
    const fixtureId=Number(input.fixtureId),homeScore=Number(input.home),awayScore=Number(input.away),elapsed=Number(input.elapsed);
    const integer=x=>Number.isInteger(x);
    if(!integer(fixtureId)||fixtureId<=0)return{ok:false,message:'Maç seçilmedi.'};
    if(!integer(homeScore)||homeScore<0||homeScore>20||!integer(awayScore)||awayScore<0||awayScore>20)return{ok:false,message:'Skor 0 ile 20 arasında olmalıdır.'};
    if(!integer(elapsed)||elapsed<0||elapsed>130)return{ok:false,message:'Dakika 0 ile 130 arasında olmalıdır.'};
    return{ok:true,fixtureId,homeScore,awayScore,elapsed};
  }
  function renderAdminPanelMarkup(rows=[]){
    const clean=Array.isArray(rows)?rows:[];
    if(!clean.length)return '<div id="adminLiveScorePanel" class="c" style="border:2px solid #0f172a"><h2 style="margin-top:0">⚙️ Canlı Skor Yönetimi</h2><p class="small">Bugün yönetilecek Süper Lig maçı bulunamadı.</p></div>';
    const first=clean[0],home=first.home_score??0,away=first.away_score??0,elapsed=first.elapsed??0;
    return `<div id="adminLiveScorePanel" class="c" style="border:2px solid #0f172a;background:linear-gradient(180deg,#f8fafc,#fff)"><h2 style="margin:0 0 6px">⚙️ Canlı Skor Yönetimi</h2><p class="small" style="margin-top:0">Yalnızca Erdal yönetici hesabında görünür. Kaydettiğinde skor tüm oyunculara yansır.</p><label class="small" for="adminLiveFixture">Maç</label><select id="adminLiveFixture" class="history-select" style="margin-top:4px">${clean.map((r,i)=>`<option value="${esc(r.fixture_id)}" ${i===0?'selected':''}>${esc(r.home_team)} - ${esc(r.away_team)}${isTerminalStatus(r.status)?' • MS':''}</option>`).join('')}</select><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px"><label class="small">Ev<input id="adminLiveHome" inputmode="numeric" type="number" min="0" max="20" value="${esc(home)}"></label><label class="small">Dep.<input id="adminLiveAway" inputmode="numeric" type="number" min="0" max="20" value="${esc(away)}"></label><label class="small">Dakika<input id="adminLiveElapsed" inputmode="numeric" type="number" min="0" max="130" value="${esc(elapsed)}"></label></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px"><button id="adminLiveSave" class="p">💾 Skoru Kaydet</button><button id="adminLiveFinish" class="danger">🏁 Maç Sonu (MS)</button></div><div id="adminLiveStatus" class="small" role="status" aria-live="polite" style="margin-top:8px"></div></div>`;
  }
  function turkeyDate(value){
    try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))}catch(_){return''}
  }
  function currentClient(){try{return typeof sb!=='undefined'?sb:root?.sb}catch(_){return root?.sb}}
  function currentStorage(){try{return root?.localStorage}catch(_){return null}}
  function todaySuperLigRows(rows,now=new Date()){
    const today=turkeyDate(now);
    return (rows||[]).filter(r=>String(r.competition||'')==='super_lig'&&turkeyDate(r.kickoff)===today);
  }
  async function refreshAfterAdminUpdate(finished){
    try{if(typeof loadDailyMatches==='function')await loadDailyMatches()}catch(e){console.warn('admin live daily refresh',e)}
    if(!finished)return;
    for(const fn of ['loadLive','loadGeneral','refreshPersonalRanks']){
      try{const callable=typeof root?.[fn]==='function'?root[fn]:null;if(callable)await callable()}catch(e){console.warn('admin live refresh',fn,e)}
    }
  }
  async function mountAdminPanel(){
    if(typeof document==='undefined')return false;
    const storage=currentStorage(),name=storage?.getItem('bizimSkorName'),token=storage?.getItem('bizimSkorFriendToken'),existing=document.getElementById('adminLiveScorePanel');
    if(!isAdminName(name)||!token){existing?.remove();return false}
    const anchor=document.getElementById('dailyMatches');
    if(!anchor)return false;
    const client=currentClient();if(!client?.rpc)return false;
    let q;
    try{q=await client.rpc('get_today_live_match_cards',{p_now:new Date().toISOString()})}catch(e){console.warn('admin live cards',e);return false}
    if(q?.error){console.warn('admin live cards',q.error);return false}
    const rows=todaySuperLigRows(q?.data||[]);
    existing?.remove();
    anchor.insertAdjacentHTML('afterend',renderAdminPanelMarkup(rows));
    const panel=document.getElementById('adminLiveScorePanel');if(!panel||!rows.length)return true;
    const select=document.getElementById('adminLiveFixture'),home=document.getElementById('adminLiveHome'),away=document.getElementById('adminLiveAway'),elapsed=document.getElementById('adminLiveElapsed'),status=document.getElementById('adminLiveStatus');
    const byId=new Map(rows.map(r=>[String(r.fixture_id),r]));
    function fill(){const r=byId.get(String(select.value));if(!r)return;home.value=r.home_score??0;away.value=r.away_score??0;elapsed.value=r.elapsed??0;status.textContent=isTerminalStatus(r.status)?'Bu maç MS olarak kayıtlı. Gerekirse skoru düzelterek yeniden MS kaydedebilirsin.':''}
    select.addEventListener('change',fill);
    async function submit(finished){
      const input=validateAdminScoreInput({fixtureId:select.value,home:home.value,away:away.value,elapsed:elapsed.value});
      if(!input.ok){status.textContent=input.message;return}
      if(finished&&!root.confirm('Maçı bitirmek ve sonucu kesinleştirerek puanlamayı başlatmak istiyor musun?'))return;
      const button=finished?document.getElementById('adminLiveFinish'):document.getElementById('adminLiveSave');button.disabled=true;status.textContent=finished?'Maç sonucu kesinleştiriliyor…':'Canlı skor kaydediliyor…';
      try{
        const result=await client.rpc('admin_update_live_score',{p_token:token,p_fixture_id:input.fixtureId,p_home_score:input.homeScore,p_away_score:input.awayScore,p_elapsed:input.elapsed,p_finished:finished});
        if(result.error)throw result.error;
        status.textContent=finished?'✅ Maç MS olarak kaydedildi. Puanlar sonuç üzerinden hesaplanıyor.':'✅ Skor ve dakika kaydedildi; canlı ekrana yansıdı.';
        await refreshAfterAdminUpdate(finished);
        if(finished)setTimeout(()=>mountAdminPanel(),500);
      }catch(e){status.textContent='İşlem başarısız: '+(e?.message||e)}finally{button.disabled=false}
    }
    document.getElementById('adminLiveSave').addEventListener('click',()=>submit(false));
    document.getElementById('adminLiveFinish').addEventListener('click',()=>submit(true));
    return true;
  }
  function autoMountAdmin(){
    if(typeof window==='undefined'||typeof document==='undefined')return;
    const sync=()=>mountAdminPanel().catch(e=>console.warn('admin live mount',e));
    if(document.readyState==='complete')setTimeout(sync,300);else window.addEventListener('load',()=>setTimeout(sync,500),{once:true});
    window.addEventListener('bizimskor:session-ready',()=>setTimeout(sync,100));
    setInterval(()=>{const p=document.getElementById('adminLiveScorePanel'),n=currentStorage()?.getItem('bizimSkorName');if(p&&!isAdminName(n))p.remove();else if(!p&&isAdminName(n)&&currentStorage()?.getItem('bizimSkorFriendToken'))sync()},3000);
  }
  return{isLiveStatus,isTerminalStatus,isStale,detectGoal,formatExactPredictors,renderLiveMatchMarkup,isAdminName,validateAdminScoreInput,renderAdminPanelMarkup,todaySuperLigRows,mountAdminPanel,autoMountAdmin};
});
