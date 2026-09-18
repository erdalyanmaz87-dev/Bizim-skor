(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorLiveScoreDashboard=api;api.autoMount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const STYLE_ID='bsLiveAdminDashboardStyles',PANEL_ID='adminLiveDashboardPanel';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp=(v,max=20)=>Math.max(0,Math.min(max,Math.floor(Number(v)||0)));
  const statusWeight=s=>{const x=String(s||'').toUpperCase();if(['1H','HT','2H','ET','BT','P'].includes(x))return 0;if(['FT','AET','PEN'].includes(x))return 2;return 1};
  const statusLabel=s=>{const x=String(s||'').toUpperCase();if(['FT','AET','PEN'].includes(x))return'🏁 MS';if(['1H','HT','2H','ET','BT','P'].includes(x))return'🔴 CANLI';return'⏳ BAŞLAMADI'};
  const keyOf=r=>`${r?.competition||'super_lig'}:${r?.fixture_id}`;

  function sortRows(rows=[]){return [...(Array.isArray(rows)?rows:[])].sort((a,b)=>statusWeight(a.status)-statusWeight(b.status)||new Date(a.kickoff)-new Date(b.kickoff)||Number(a.fixture_id)-Number(b.fixture_id))}
  function styles(){return `
  #${PANEL_ID}{border:1px solid #334155;border-radius:20px;background:linear-gradient(180deg,#0f172a,#08111f);color:#f8fafc;padding:14px;margin:12px 0;box-shadow:0 12px 34px rgba(2,6,23,.18)}
  #${PANEL_ID} h2{margin:0;font-size:20px}#${PANEL_ID} .bs-live-admin-help{margin:5px 0 12px;color:#94a3b8;font-size:12px}
  .bs-live-admin-list{display:grid;gap:10px}.bs-live-admin-card{border:1px solid #334155;border-radius:16px;background:#111827;padding:12px}.bs-live-admin-card[data-dirty="1"]{border-color:#22c55e;box-shadow:0 0 0 1px rgba(34,197,94,.18)}
  .bs-live-admin-top{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px}.bs-live-admin-comp{font-size:11px;font-weight:900;color:#93c5fd}.bs-live-admin-state{font-size:11px;font-weight:950}.bs-live-admin-state.live{color:#fca5a5}
  .bs-live-admin-match{display:grid;grid-template-columns:minmax(0,1fr) 126px minmax(0,1fr);gap:8px;align-items:center}.bs-live-admin-team{font-size:14px;font-weight:900;line-height:1.15}.bs-live-admin-team.home{text-align:right}.bs-live-admin-team.away{text-align:left}
  .bs-live-admin-score{display:grid;grid-template-columns:38px 1fr 38px;align-items:center;height:48px;border:1px solid #334155;border-radius:13px;overflow:hidden;background:#07111f}.bs-live-admin-score button{height:100%;border:0;border-radius:0;background:#172033;color:#34d399;font-size:24px;font-weight:900;padding:0}.bs-live-admin-score button:active{transform:scale(.9);background:#064e3b}.bs-live-admin-score strong{text-align:center;font-size:24px;color:#6ee7b7}
  .bs-live-admin-meta{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:10px}.bs-live-admin-minute{display:flex;align-items:center;gap:7px;color:#cbd5e1;font-size:12px}.bs-live-admin-minute input{width:72px;min-height:40px;border:1px solid #475569;border-radius:10px;background:#0b1220;color:#fff;text-align:center;font-size:16px;font-weight:900}
  .bs-live-admin-actions{display:flex;gap:6px}.bs-live-admin-actions button{min-height:40px;border-radius:10px;padding:7px 10px;font-size:12px;font-weight:900}.bs-live-admin-save{background:#0f766e;color:#fff}.bs-live-admin-finish{background:#7f1d1d;color:#fff}.bs-live-admin-status{min-height:17px;margin-top:7px;color:#a7f3d0;font-size:11px}
  .bs-live-admin-save-all{width:100%;min-height:50px;margin-top:12px;border-radius:14px;background:linear-gradient(135deg,#10b981,#22c55e);color:#052e21;font-size:15px;font-weight:950}.bs-live-admin-save-all:disabled{opacity:.5}.bs-live-admin-global-status{margin-top:7px;color:#cbd5e1;font-size:11px}
  @media(max-width:430px){.bs-live-admin-match{grid-template-columns:minmax(0,1fr) 112px minmax(0,1fr);gap:5px}.bs-live-admin-score{grid-template-columns:34px 1fr 34px}.bs-live-admin-team{font-size:12px}.bs-live-admin-meta{grid-template-columns:1fr}.bs-live-admin-actions{display:grid;grid-template-columns:1fr 1fr}}
  `}
  }
  function ensureStyles(doc=document){if(doc.getElementById(STYLE_ID))return;const s=doc.createElement('style');s.id=STYLE_ID;s.textContent=styles();doc.head.appendChild(s)}
  function compLabel(c){return String(c)==='champions_league'?'Şampiyonlar Ligi':'Süper Lig'}
  function projectedElapsed(row,now=new Date()){
    const live=root.BizimSkorLiveScore;
    return live?.projectAdminElapsed?live.projectAdminElapsed({elapsed:row.elapsed,savedAt:row.fetched_at||row.updated_at,now}):clamp(row.elapsed,130)
  }
  function cardMarkup(row){
    const key=keyOf(row),live=statusWeight(row.status)===0,terminal=statusWeight(row.status)===2;
    return `<section class="bs-live-admin-card" data-admin-live-key="${esc(key)}" data-dirty="0"><div class="bs-live-admin-top"><span class="bs-live-admin-comp">${esc(compLabel(row.competition))}</span><span class="bs-live-admin-state${live?' live':''}">${statusLabel(row.status)}</span></div><div class="bs-live-admin-match"><div class="bs-live-admin-team home">${esc(row.home_team)}</div><div class="bs-live-admin-score"><button type="button" data-admin-score-minus="home" aria-label="Ev skorunu azalt">−</button><strong data-admin-score-value="home">${clamp(row.home_score)}</strong><button type="button" data-admin-score-plus="home" aria-label="Ev skorunu artır">+</button></div><div class="bs-live-admin-team away">${esc(row.away_team)}</div></div><div class="bs-live-admin-match" style="margin-top:7px"><div></div><div class="bs-live-admin-score"><button type="button" data-admin-score-minus="away" aria-label="Deplasman skorunu azalt">−</button><strong data-admin-score-value="away">${clamp(row.away_score)}</strong><button type="button" data-admin-score-plus="away" aria-label="Deplasman skorunu artır">+</button></div><div></div></div><div class="bs-live-admin-meta"><label class="bs-live-admin-minute">Dakika <input type="number" min="0" max="130" inputmode="numeric" data-admin-live-elapsed value="${projectedElapsed(row)}"></label><div class="bs-live-admin-actions"><button type="button" class="bs-live-admin-save" data-admin-live-save>💾 Kaydet</button><button type="button" class="bs-live-admin-finish" data-admin-live-finish>${terminal?'🏁 MS Güncelle':'🏁 MS'}</button></div></div><div class="bs-live-admin-status" data-admin-live-status></div></section>`
  }
  function renderDashboardMarkup(rows=[]){
    const clean=sortRows(rows);
    if(!clean.length)return `<div id="${PANEL_ID}"><h2>⚙️ Canlı Skor Yönetimi</h2><p class="bs-live-admin-help">Bugün yönetilecek maç bulunamadı.</p></div>`;
    return `<div id="${PANEL_ID}"><h2>⚙️ Canlı Skor Yönetimi</h2><p class="bs-live-admin-help">Tüm maçlar tek ekranda. Canlı maçlar üstte; değişiklikleri tek tek veya topluca kaydedebilirsin.</p><div class="bs-live-admin-list">${clean.map(cardMarkup).join('')}</div><button type="button" class="bs-live-admin-save-all" data-admin-live-save-all disabled>💾 Tüm Değişiklikleri Kaydet</button><div class="bs-live-admin-global-status" data-admin-live-global-status></div></div>`
  }
  function readCard(card){return{home:clamp(card.querySelector('[data-admin-score-value="home"]')?.textContent),away:clamp(card.querySelector('[data-admin-score-value="away"]')?.textContent),elapsed:clamp(card.querySelector('[data-admin-live-elapsed]')?.value,130)}}
  function setCardScore(card,side,value){const el=card.querySelector(`[data-admin-score-value="${side}"]`);if(el)el.textContent=String(clamp(value));card.dataset.dirty='1'}
  function markDirty(card,panel){card.dataset.dirty='1';const all=panel.querySelector('[data-admin-live-save-all]');if(all)all.disabled=false}
  function clearDirty(card,panel){card.dataset.dirty='0';const any=[...panel.querySelectorAll('.bs-live-admin-card')].some(c=>c.dataset.dirty==='1');const all=panel.querySelector('[data-admin-live-save-all]');if(all)all.disabled=!any}
  function client(){try{return root.sb}catch(_){return null}}
  function token(){try{return root.localStorage?.getItem('bizimSkorFriendToken')}catch(_){return null}}
  function adminAllowed(){try{return root.BizimSkorLiveScore?.isAdminName(root.localStorage?.getItem('bizimSkorName'))&&!!token()}catch(_){return false}}
  async function refreshAfter(finished){try{if(typeof root.loadDailyMatches==='function')await root.loadDailyMatches()}catch(_){}if(finished){for(const n of ['loadLive','loadGeneral','refreshPersonalRanks'])try{if(typeof root[n]==='function')await root[n]()}catch(_){}}}
  async function saveCard(panel,card,rowsByKey,finished=false){
    const key=String(card.dataset.adminLiveKey||''),row=rowsByKey.get(key),state=readCard(card),status=card.querySelector('[data-admin-live-status]'),c=client(),t=token();
    if(!row||!c?.rpc||!t)return false;
    const valid=root.BizimSkorLiveScore?.validateAdminScoreInput?.({fixtureId:row.fixture_id,home:state.home,away:state.away,elapsed:state.elapsed});
    if(valid&&!valid.ok){if(status)status.textContent=valid.message;return false}
    if(finished&&root.confirm&&!root.confirm(`${row.home_team} - ${row.away_team} maçını MS olarak kesinleştirmek istiyor musun?`))return false;
    if(status)status.textContent=finished?'Maç sonucu kesinleştiriliyor…':'Kaydediliyor…';
    try{
      const result=await c.rpc('admin_update_live_score',{p_token:t,p_competition:row.competition||'super_lig',p_fixture_id:Number(row.fixture_id),p_home_score:state.home,p_away_score:state.away,p_elapsed:state.elapsed,p_finished:finished});
      if(result?.error)throw result.error;
      row.home_score=state.home;row.away_score=state.away;row.elapsed=state.elapsed;row.fetched_at=new Date().toISOString();if(finished)row.status='FT';
      clearDirty(card,panel);if(status)status.textContent=finished?'✅ MS kaydedildi.':'✅ Kaydedildi.';await refreshAfter(finished);return true;
    }catch(e){if(status)status.textContent='İşlem başarısız: '+(e?.message||e);return false}
  }
  function bind(panel,rows){
    const byKey=new Map(rows.map(r=>[keyOf(r),r]));
    panel.addEventListener('click',async e=>{
      const card=e.target.closest('.bs-live-admin-card');
      if(card&&(e.target.closest('[data-admin-score-minus]')||e.target.closest('[data-admin-score-plus]'))){const btn=e.target.closest('button'),side=btn.dataset.adminScoreMinus||btn.dataset.adminScorePlus,delta=btn.hasAttribute('data-admin-score-plus')?1:-1,current=Number(card.querySelector(`[data-admin-score-value="${side}"]`)?.textContent||0);setCardScore(card,side,current+delta);markDirty(card,panel);return}
      if(card&&e.target.closest('[data-admin-live-save]')){const b=e.target.closest('button');b.disabled=true;await saveCard(panel,card,byKey,false);b.disabled=false;return}
      if(card&&e.target.closest('[data-admin-live-finish]')){const b=e.target.closest('button');b.disabled=true;const ok=await saveCard(panel,card,byKey,true);b.disabled=false;if(ok)root.setTimeout?.(()=>mountDashboard(),500);return}
      if(e.target.closest('[data-admin-live-save-all]')){const b=e.target.closest('button'),global=panel.querySelector('[data-admin-live-global-status]'),dirty=[...panel.querySelectorAll('.bs-live-admin-card')].filter(c=>c.dataset.dirty==='1');b.disabled=true;if(global)global.textContent=`${dirty.length} maç kaydediliyor…`;let ok=0;for(const c of dirty)if(await saveCard(panel,c,byKey,false))ok++;if(global)global.textContent=`✅ ${ok} maç kaydedildi.`;b.disabled=[...panel.querySelectorAll('.bs-live-admin-card')].every(c=>c.dataset.dirty!=='1');}
    });
    panel.addEventListener('input',e=>{const card=e.target.closest('.bs-live-admin-card');if(card&&e.target.matches('[data-admin-live-elapsed]'))markDirty(card,panel)});
    const timer=root.setInterval?.(()=>{if(!panel.isConnected){root.clearInterval?.(timer);return}[...panel.querySelectorAll('.bs-live-admin-card')].forEach(card=>{if(card.dataset.dirty==='1')return;const row=byKey.get(card.dataset.adminLiveKey),input=card.querySelector('[data-admin-live-elapsed]');if(row&&input)input.value=projectedElapsed(row)})},15000);
  }
  function hideLegacy(doc=document){const old=doc.getElementById('adminLiveScorePanel');if(old)old.style.display='none'}
  async function mountDashboard(){
    if(typeof document==='undefined'||!adminAllowed())return false;
    ensureStyles(document);hideLegacy(document);
    const anchor=document.getElementById('dailyMatches');if(!anchor)return false;
    const c=client();if(!c?.rpc)return false;
    let q;try{q=await c.rpc('get_today_live_match_cards',{p_now:new Date().toISOString()})}catch(_){return false}if(q?.error)return false;
    const rows=root.BizimSkorLiveScore?.todayMatchRows?root.BizimSkorLiveScore.todayMatchRows(q.data||[]):q.data||[];
    document.getElementById(PANEL_ID)?.remove();
    anchor.insertAdjacentHTML('beforebegin',renderDashboardMarkup(rows));
    const panel=document.getElementById(PANEL_ID);if(panel&&rows.length)bind(panel,rows);hideLegacy(document);return true
  }
  function autoMount(){
    if(typeof document==='undefined')return;const run=()=>mountDashboard().catch(()=>{});
    if(document.readyState==='complete'||document.readyState==='interactive')root.setTimeout?.(run,350);else root.addEventListener?.('load',()=>root.setTimeout?.(run,500),{once:true});
    root.addEventListener?.('bizimskor:session-ready',()=>root.setTimeout?.(run,150));
    root.setInterval?.(()=>{hideLegacy(document);if(adminAllowed()&&!document.getElementById(PANEL_ID))run()},3000)
  }
  return Object.freeze({sortRows,statusLabel,cardMarkup,renderDashboardMarkup,readCard,setCardScore,saveCard,mountDashboard,autoMount});
});
