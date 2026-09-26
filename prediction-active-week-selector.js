(function(root){
  const SEASON='2026/27';
  let championLoadVersion=0,nationsLoadVersion=0;
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const token=()=>root.localStorage?.getItem('bizimSkorFriendToken')||'';
  const uniqueWeeks=rows=>[...new Set((rows||[]).map(row=>Number(row.week)).filter(Number.isFinite))].sort((a,b)=>a-b);
  const openWeeks=checks=>(checks||[]).filter(item=>item.rows.length&&!item.rows.some(row=>row.is_locked)).map(item=>item.week).slice(0,2);
  const optionMarkup=weeks=>weeks.map(week=>`<option value="${week}">${week}. Hafta • Tahmine Açık</option>`).join('');

  function ensureStyles(){
    if(document.getElementById('activePredictionWeekSelectorStyles'))return;
    document.head.insertAdjacentHTML('beforeend','<style id="activePredictionWeekSelectorStyles">.active-week-picker{margin:0 0 14px;padding:14px;border-radius:16px;background:rgba(15,23,42,.34);border:1px solid rgba(148,163,184,.35)}.active-week-picker label{display:block;margin-bottom:8px;font-size:13px;font-weight:800}.active-week-picker select{width:100%;min-height:48px;border-radius:13px;padding:0 14px;font-weight:800}.champions-shell .active-week-picker select{background:#0f172a;color:#fff;border:2px solid #475569}.nations-shell .active-week-picker select{background:#fff;color:#7f1d1d;border:2px solid #fca5a5}</style>');
  }

  async function fetchChampionWeeks(){
    const pToken=token();if(!pToken)return[];
    const available=await root.sb.rpc('get_champions_league_available_weeks',{p_token:pToken,p_season:SEASON});
    if(available.error)throw available.error;
    const weeks=uniqueWeeks(available.data||[]);
    const checks=await Promise.all(weeks.map(async week=>{const q=await root.sb.rpc('get_champions_league_week',{p_token:pToken,p_season:SEASON,p_week:week});if(q.error)throw q.error;return{week,rows:q.data||[]}}));
    return openWeeks(checks);
  }

  async function fetchNationsWeeks(){
    const pToken=token();if(!pToken)return[];
    const available=await root.sb.rpc('get_nations_league_available_weeks',{p_token:pToken,p_season:SEASON});
    if(available.error)throw available.error;
    const weeks=uniqueWeeks(available.data||[]);
    const checks=await Promise.all(weeks.map(async week=>{const q=await root.sb.rpc('get_nations_league_week',{p_token:pToken,p_season:SEASON,p_week:week});if(q.error)throw q.error;return{week,rows:q.data||[]}}));
    return openWeeks(checks);
  }

  function championPicker(){
    const hero=document.querySelector('#championsPred .champions-hero');
    if(!hero)return null;
    let host=document.getElementById('championsPredictionWeekPicker');
    if(!host){host=document.createElement('div');host.id='championsPredictionWeekPicker';host.className='active-week-picker';host.innerHTML='<label for="championsPredictionWeekSelect">Tahmin haftası</label><select id="championsPredictionWeekSelect"></select>';hero.insertAdjacentElement('afterend',host)}
    return host.querySelector('select');
  }

  function nationsPicker(){
    const hero=document.querySelector('#nationsPred .nations-hero');
    if(!hero)return null;
    let host=document.getElementById('nationsPredictionWeekPicker');
    if(!host){host=document.createElement('div');host.id='nationsPredictionWeekPicker';host.className='active-week-picker';host.innerHTML='<label for="nationsPredictionWeekSelect">Tahmin haftası</label><select id="nationsPredictionWeekSelect"></select>';hero.insertAdjacentElement('afterend',host)}
    return host.querySelector('select');
  }

  function timeText(value){return new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)).replace(':','.')}
  function championInputs(rows){
    const group=root.BizimSkorChampionsLeague?.groupFixturesByTurkeyDate?.(rows)||[];
    return group.map(day=>`<div class="champions-day">${esc(day.label)}</div>`+day.fixtures.map(f=>`<div class="champions-match"><div class="t home"><span class="small">${timeText(f.kickoff)}</span><br>${esc(f.home_team)}</div><input id="clh${f.fixture_id}" inputmode="numeric" maxlength="2" value="${f.predicted_home??''}"><div>-</div><input id="cla${f.fixture_id}" inputmode="numeric" maxlength="2" value="${f.predicted_away??''}"><div class="t">${esc(f.away_team)}</div></div>`).join('')).join('')
  }

  async function loadChampionWeek(week){
    const requestedWeek=Number(week),requestVersion=++championLoadVersion;
    const pToken=token(),state=document.getElementById('championsState'),box=document.getElementById('championsFixtures'),save=document.getElementById('championsSave');
    if(!pToken||!state||!box||!save)return;
    state.innerHTML='<p class="small">Şampiyonlar Ligi fikstürü yükleniyor…</p>';
    const q=await root.sb.rpc('get_champions_league_week',{p_token:pToken,p_season:SEASON,p_week:requestedWeek});
    if(requestVersion!==championLoadVersion)return;
    if(q.error){state.innerHTML=`<div class="champions-error">${esc(q.error.message)}</div>`;box.innerHTML='';save.classList.add('hide');return}
    const rows=q.data||[],locked=rows.some(row=>row.is_locked),complete=rows.length>0&&rows.every(row=>row.predicted_home!=null&&row.predicted_away!=null);
    const title=document.querySelector('#championsPred .champions-hero b');if(title)title.textContent=`Şampiyonlar Ligi • ${requestedWeek}. Hafta`;
    if(locked){state.innerHTML=`<div class="champions-summary"><b>🔒 Şampiyonlar Ligi ${requestedWeek}. hafta tahmin süresi doldu.</b></div>`;box.innerHTML='';save.classList.add('hide');return}
    if(complete){state.innerHTML=`<div class="champions-summary"><b>✅ Şampiyonlar Ligi ${requestedWeek}. hafta tahminlerin kaydedildi</b>${rows.map(f=>`<div class="savedrow">${esc(f.home_team)} <b>${f.predicted_home}-${f.predicted_away}${f.robot_applied?' 🤖':''}</b> ${esc(f.away_team)}</div>`).join('')}<button id="championsActiveWeekEdit" class="full">Tahminleri Düzenle ✏️</button></div>`;box.innerHTML='';save.classList.add('hide');document.getElementById('championsActiveWeekEdit')?.addEventListener('click',()=>renderChampionEditor(rows,requestedWeek));return}
    renderChampionEditor(rows,requestedWeek);
  }

  function renderChampionEditor(rows,week){
    const state=document.getElementById('championsState'),box=document.getElementById('championsFixtures'),save=document.getElementById('championsSave');if(!state||!box||!save)return;
    state.innerHTML='';box.innerHTML=championInputs(rows);save.classList.remove('hide');save.textContent='Şampiyonlar Ligi Tahminlerimi Kaydet ⭐';
    save.onclick=async()=>{try{const predictions=rows.map(f=>{const h=document.getElementById('clh'+f.fixture_id),a=document.getElementById('cla'+f.fixture_id);return{fixture_id:Number(f.fixture_id),home_score:h?.value,away_score:a?.value,robot_applied:h?.dataset.robotScore===h?.value&&a?.dataset.robotScore===a?.value}});const checked=root.BizimSkorChampionsLeague.validateWeeklyScores(rows.map(f=>({...f,id:Number(f.fixture_id)})),predictions);const q=await root.sb.rpc('save_champions_league_predictions',{p_token:token(),p_season:SEASON,p_week:Number(week),p_predictions:checked});if(q.error)throw q.error;root.alert?.(`Şampiyonlar Ligi ${week}. hafta tahminlerin kaydedildi ✅`);await loadChampionWeek(week);root.BizimSkorPredictionWeekCards?.refresh?.();root.BizimSkorHomePriority?.refresh?.()}catch(error){root.alert?.(error.message)}};
    root.BizimSkorRobotUI?.decorate?.();root.BizimSkorMatchStatistics?.injectButtons?.();
  }

  async function mountChampionSelector(){
    if(!document.getElementById('championsPred')||!root.BizimSkorChampionsUI)return;
    const select=championPicker();if(!select||select.dataset.bound==='1')return;
    select.dataset.bound='1';
    try{const weeks=await fetchChampionWeeks();select.innerHTML=optionMarkup(weeks);if(!weeks.length){select.innerHTML='<option>Şu anda açık hafta yok</option>';select.disabled=true;return}select.disabled=false;select.value=String(weeks[0]);select.addEventListener('change',()=>loadChampionWeek(Number(select.value)));await loadChampionWeek(weeks[0])}catch(error){console.warn('champions active week selector',error)}
  }

  async function mountNationsSelector(){
    if(!document.getElementById('nationsPred')||!root.BizimSkorNationsUI)return;
    const select=nationsPicker();if(!select||select.dataset.bound==='1')return;
    select.dataset.bound='1';
    const requestVersion=++nationsLoadVersion;
    try{const weeks=await fetchNationsWeeks();if(requestVersion!==nationsLoadVersion)return;select.innerHTML=optionMarkup(weeks);if(!weeks.length){select.innerHTML='<option>Şu anda açık hafta yok</option>';select.disabled=true;return}select.disabled=false;select.value=String(weeks[0]);select.addEventListener('change',()=>root.BizimSkorNationsUI.loadPrediction(Number(select.value)));await root.BizimSkorNationsUI.loadPrediction(weeks[0])}catch(error){console.warn('nations active week selector',error)}
  }

  function refresh(){ensureStyles();mountChampionSelector();mountNationsSelector()}
  function mount(){if(typeof document==='undefined')return;refresh();setTimeout(refresh,700);setTimeout(refresh,1800);root.addEventListener?.('bizimskor:champions-prediction-opened',()=>setTimeout(refresh,0));root.addEventListener?.('bizimskor:nations-prediction-opened',()=>setTimeout(refresh,0));new MutationObserver(()=>{if(!document.getElementById('championsPredictionWeekSelect')||!document.getElementById('nationsPredictionWeekSelect'))refresh()}).observe(document.body,{childList:true,subtree:true})}

  root.BizimSkorActivePredictionWeekSelector=Object.freeze({uniqueWeeks,openWeeks,fetchChampionWeeks,fetchNationsWeeks,loadChampionWeek,refresh,mount});
  mount();
})(typeof globalThis!=='undefined'?globalThis:this);
