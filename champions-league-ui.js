(function(){
  const season='2026/27',week=2,CHAMPIONS_OPPORTUNITY_ID=33;
  let fixtures=[],editing=false,robotPredictions={};

  function mountStyles(){
    if(document.getElementById('championsWeek2ToolsStyles'))return;
    document.head.insertAdjacentHTML('beforeend',`<style id="championsWeek2ToolsStyles">
      .champions-tools{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:7px}
      .champions-tool{min-height:36px;padding:8px 7px!important;border:1px solid rgba(147,197,253,.72)!important;border-radius:10px!important;background:rgba(239,246,255,.96)!important;color:#1e3a8a!important;font-size:11px!important;font-weight:900!important}
      .champions-tool.robot-applied{background:#dcfce7!important;color:#166534!important;border-color:#86efac!important}
      .champions-saved-tools{display:grid;grid-template-columns:1fr;gap:6px;margin-top:6px}
      .champions-opportunity{grid-column:1/-1;display:inline-block;justify-self:center;margin-top:4px;padding:4px 8px;border-radius:999px;background:#f59e0b;color:#7c2d12;font-size:10px;font-weight:900}
      .champions-stats-overlay{position:fixed;inset:0;z-index:100001;background:rgba(2,6,23,.78);padding:12px;display:flex;align-items:flex-end;justify-content:center}
      .champions-stats-overlay.hide{display:none}
      .champions-stats-modal{width:min(100%,540px);max-height:92vh;overflow:auto;border-radius:22px 22px 0 0;background:#f8fafc;color:#0f172a;box-shadow:0 -18px 55px rgba(2,6,23,.35)}
      .champions-stats-title{position:sticky;top:0;z-index:2;padding:15px;background:#071633;color:#fff;text-align:center;font-size:17px;font-weight:900}
      .champions-stats-body{padding:12px}.champions-stats-head{text-align:center;padding:12px;border-radius:14px;background:linear-gradient(135deg,#dbeafe,#fff);font-weight:900}
      .champions-stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.champions-stat-card{padding:10px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;text-align:center}.champions-stat-card b{display:block}.champions-stat-card span{font-size:12px;color:#475569}
      .champions-stat-section{margin-top:10px;padding:11px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}.champions-stat-section h4{margin:0 0 7px}.champions-stat-result{display:grid;grid-template-columns:70px 1fr auto 1fr;gap:5px;align-items:center;padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:11px}.champions-stat-result:last-child{border-bottom:0}.champions-stat-result time{color:#64748b}.champions-stat-empty{font-size:12px;color:#64748b}.champions-stats-close{position:sticky;bottom:0;width:100%;min-height:52px;border-radius:0!important;background:#071633!important;color:#fff!important;font-size:15px!important}
      @media(min-width:600px){.champions-stats-overlay{align-items:center}.champions-stats-modal{border-radius:22px}}
    </style>`);
  }

  function ensureStatsShell(){
    mountStyles();
    if(document.getElementById('championsStatsOverlay'))return;
    document.body.insertAdjacentHTML('beforeend','<div id="championsStatsOverlay" class="champions-stats-overlay hide"><div class="champions-stats-modal" role="dialog" aria-modal="true"><div class="champions-stats-title">📊 Maç İstatistikleri</div><div id="championsStatsBody" class="champions-stats-body"></div><button id="championsStatsClose" type="button" class="champions-stats-close">← Tahmine Dön</button></div></div>');
    document.getElementById('championsStatsClose').onclick=closeMatchStatistics;
    document.getElementById('championsStatsOverlay').onclick=e=>{if(e.target===e.currentTarget)closeMatchStatistics()};
  }

  function mount(){
    const tabs=document.querySelector('.tabs'),pred=document.getElementById('pred');
    if(!tabs||!pred||document.getElementById('championsPred'))return;
    mountStyles();ensureStatsShell();
    tabs.insertAdjacentHTML('beforeend','<button class="tab champions-tab" data-tab="championsRanking">🏆 Şampiyonlar Ligi Sıralaması</button>');
    pred.insertAdjacentHTML('afterend','<section id="championsPred" class="hide"><div class="champions-shell"><div class="champions-hero"><span>✦ 2026/27 AVRUPA GECESİ ✦</span><b>Şampiyonlar Ligi • 2. Hafta</b><p class="small">Doğru sonuç +1 • Tam skor ekstra +3 • Fırsat maçında puanlar X2 • İlk maçla birlikte tüm tahminler kilitlenir.</p></div><div id="championsState"></div><div id="championsFixtures"></div><button id="championsSave" class="full p">Şampiyonlar Ligi Tahminlerimi Kaydet ⭐</button></div></section><section id="championsRanking" class="hide"><div class="champions-shell"><div class="champions-hero"><span>✦ BİZİM SKOR AVRUPA GECESİ ✦</span><b>Şampiyonlar Ligi Sıralaması</b><p class="small">Şampiyonlar Ligi sezon puanları Süper Lig’den tamamen bağımsızdır.</p></div><div id="championsRankingBoard"></div><h3>Katılımcı Tahminleri</h3><p class="small">Maç sonuçlanana kadar diğer oyuncuların tahminleri *-* görünür.</p><div id="championsParticipants"></div></div></section>');
    const rankingButton=tabs.querySelector('[data-tab="championsRanking"]');
    rankingButton.onclick=async()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('section').forEach(x=>x.classList.add('hide'));rankingButton.classList.add('active');document.getElementById('championsRanking').classList.remove('hide');await loadRanking();};
    document.querySelectorAll('.tab:not([data-tab="championsRanking"])').forEach(item=>item.addEventListener('click',()=>{document.getElementById('championsPred').classList.add('hide');document.getElementById('championsRanking').classList.add('hide');}));
    document.getElementById('championsSave').onclick=savePrediction;
    setInterval(()=>{const ranking=document.getElementById('championsRanking');if(document.visibilityState==='visible'&&ranking&&!ranking.classList.contains('hide'))loadRanking();},60000);
  }
  function openPrediction(){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('section').forEach(x=>x.classList.add('hide'));document.getElementById('championsPred')?.classList.remove('hide');return loadPrediction()}
  function currentWeek(){return week}
  function timeText(value){return new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value)).replace(':','.')}
  function dateText(value){return new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(value))}
  function rowFixture(row){return{...row,id:Number(row.fixture_id),week}}
  function isSessionError(error){return /oturum|token|süresi dolmuş/i.test(error?.message||'')}
  function showLoginRequired(target,secondary){localStorage.removeItem('bizimSkorFriendToken');target.innerHTML='<div class="champions-error">Önce mevcut oyuncu hesabınla giriş yap.</div>';if(secondary)secondary.innerHTML=''}
  function scoreChampionsPrediction(prediction,result){
    const scored=BizimSkorChampionsLeague.scorePrediction(prediction,result);
    if(!prediction||!result)return scored;
    return Number(prediction.fixture_id)===CHAMPIONS_OPPORTUNITY_ID&&Number(prediction.week)===week?{...scored,points:scored.points*2}:scored;
  }

  async function loadRobotPredictions(){
    const q=await sb.rpc('get_champions_robot_predictions',{p_season:season,p_week:week});
    if(q.error){console.warn('champions robot',q.error);return{}}
    return Object.fromEntries((q.data||[]).map(row=>[Number(row.fixture_id),{home_score:Number(row.home_score),away_score:Number(row.away_score)}]));
  }
  function toolsMarkup(f,canApply=true){
    const robot=robotPredictions[f.id],label=robot?`🤖 Robotun Önerisi: ${robot.home_score}-${robot.away_score}`:'🤖 Robotun Önerisi';
    const opportunity=Number(f.id)===CHAMPIONS_OPPORTUNITY_ID?'<span class="champions-opportunity">🔥 Fırsat Maçı • X2</span>':'';
    return `${opportunity}<div class="champions-tools">${canApply?`<button type="button" class="champions-tool" data-champions-robot="${f.id}" ${robot?'':'disabled'}>${label}</button>`:''}<button type="button" class="champions-tool" data-champions-stats="${f.id}">📊 Maç İstatistikleri</button></div>`;
  }
  function renderInputs(rows,mine){
    const map=Object.fromEntries(mine.map(x=>[x.fixture_id,x]));
    return BizimSkorChampionsLeague.groupFixturesByTurkeyDate(rows).map(group=>`<div class="champions-day">${esc(group.label)}</div>`+group.fixtures.map(f=>{const p=map[f.id];return `<div class="champions-match"><div class="t home"><span class="small">${timeText(f.kickoff)}</span><br>${esc(f.home_team)}</div><input id="clh${f.id}" inputmode="numeric" maxlength="2" value="${p?.home_score??''}"><div>-</div><input id="cla${f.id}" inputmode="numeric" maxlength="2" value="${p?.away_score??''}"><div class="t">${esc(f.away_team)}</div>${toolsMarkup(f,true)}</div>`;}).join('')).join('')
  }
  function applyRobot(fixtureId,button){
    const robot=robotPredictions[Number(fixtureId)],home=document.getElementById('clh'+fixtureId),away=document.getElementById('cla'+fixtureId);
    if(!robot||!home||!away)return;
    home.value=robot.home_score;away.value=robot.away_score;
    button?.classList.add('robot-applied');
    if(button)button.textContent=`🤖 Robotun Önerisi uygulandı: ${robot.home_score}-${robot.away_score}`;
  }
  function bindFixtureActions(root=document){
    root.querySelectorAll?.('[data-champions-robot]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();applyRobot(button.dataset.championsRobot,button)}));
    root.querySelectorAll?.('[data-champions-stats]').forEach(button=>button.addEventListener('click',e=>{e.preventDefault();openMatchStatistics(button.dataset.championsStats)}));
  }

  function statMatches(title,matches){
    const rows=(matches||[]).slice(0,5);
    return `<div class="champions-stat-section"><h4>${esc(title)}</h4>${rows.length?rows.map(m=>`<div class="champions-stat-result"><time>${dateText(m.date)}</time><span>${esc(m.home_team)}</span><b>${Number(m.home_score)}-${Number(m.away_score)}</b><span>${esc(m.away_team)}</span></div>`).join(''):'<div class="champions-stat-empty">Henüz yeterli maç verisi yok.</div>'}</div>`;
  }
  function renderStatistics(snapshot){
    const home=snapshot?.home||{},away=snapshot?.away||{};
    return `<div class="champions-stats-head">${esc(snapshot?.home_team||home.name)} &nbsp;–&nbsp; ${esc(snapshot?.away_team||away.name)}</div><div class="champions-stat-grid"><div class="champions-stat-card"><b>${esc(home.name||snapshot?.home_team)}</b><span>${home.rank?`${home.rank}. sıra • `:''}${Number(home.points||0)} puan</span><span>Form: ${(home.form||[]).join(' ')||'—'}</span></div><div class="champions-stat-card"><b>${esc(away.name||snapshot?.away_team)}</b><span>${away.rank?`${away.rank}. sıra • `:''}${Number(away.points||0)} puan</span><span>Form: ${(away.form||[]).join(' ')||'—'}</span></div></div>${statMatches(`${home.name||snapshot?.home_team} • Son 5 Maç`,home.recent_matches)}${statMatches(`${away.name||snapshot?.away_team} • Son 5 Maç`,away.recent_matches)}${statMatches('🤝 Aralarındaki Son 5 Maç',snapshot?.head_to_head)}`;
  }
  async function openMatchStatistics(fixtureId){
    ensureStatsShell();
    const overlay=document.getElementById('championsStatsOverlay'),body=document.getElementById('championsStatsBody');
    overlay.classList.remove('hide');document.body.style.overflow='hidden';body.innerHTML='<p class="champions-stat-empty">İstatistikler yükleniyor…</p>';
    const q=await sb.rpc('get_champions_match_statistics',{p_fixture_id:Number(fixtureId)});
    if(q.error){body.innerHTML=`<p class="champions-stat-empty">${esc(q.error.message||'İstatistikler şu anda açılamadı.')}</p>`;return}
    const snapshot=Array.isArray(q.data)?q.data[0]:q.data;
    body.innerHTML=snapshot?renderStatistics(snapshot):'<p class="champions-stat-empty">Bu maçın istatistikleri henüz hazırlanmadı.</p>';
  }
  function closeMatchStatistics(){document.getElementById('championsStatsOverlay')?.classList.add('hide');document.body.style.overflow=''}

  async function loadPrediction(forceEdit=false){
    const state=document.getElementById('championsState'),box=document.getElementById('championsFixtures'),save=document.getElementById('championsSave');const token=localStorage.getItem('bizimSkorFriendToken');
    if(!token){state.innerHTML='<div class="champions-error">Önce mevcut oyuncu hesabınla giriş yap.</div>';box.innerHTML='';save.classList.add('hide');return}
    state.innerHTML='<p class="small">Şampiyonlar Ligi 2. hafta fikstürü yükleniyor…</p>';
    const [q,robots]=await Promise.all([sb.rpc('get_champions_league_week',{p_token:token,p_season:season,p_week:week}),loadRobotPredictions()]);robotPredictions=robots;
    if(q.error){if(isSessionError(q.error))showLoginRequired(state,box);else{state.innerHTML=`<div class="champions-error">${esc(q.error.message)}</div>`;box.innerHTML=''}save.classList.add('hide');return}
    const rows=(q.data||[]).map(rowFixture),mine=rows.filter(x=>x.predicted_home!=null&&x.predicted_away!=null).map(x=>({fixture_id:x.id,home_score:x.predicted_home,away_score:x.predicted_away}));fixtures=rows;const locked=rows.some(x=>x.is_locked);editing=!locked&&(forceEdit||mine.length!==rows.length);
    if(rows.length&&mine.length===rows.length&&!editing){state.innerHTML=`<div class="champions-summary"><b>✅ Şampiyonlar Ligi 2. hafta tahminlerin kaydedildi</b>${rows.map(f=>{const p=mine.find(x=>x.fixture_id===f.id),opportunity=Number(f.id)===CHAMPIONS_OPPORTUNITY_ID?' <span class="champions-opportunity">🔥 Fırsat Maçı • X2</span>':'';return `<div class="savedrow">${esc(f.home_team)} <b>${p.home_score}-${p.away_score}</b> ${esc(f.away_team)}${opportunity}<div class="champions-saved-tools"><button type="button" class="champions-tool" data-champions-stats="${f.id}">📊 Maç İstatistikleri</button></div></div>`}).join('')}${locked?'<p class="small">🔒 Tahminler kilitlendi.</p>':'<button id="championsEdit" class="full">Tahminleri Düzenle ✏️</button>'}</div>`;box.innerHTML='';save.classList.add('hide');bindFixtureActions(state);document.getElementById('championsEdit')?.addEventListener('click',()=>loadPrediction(true));return}
    if(locked){state.innerHTML='<div class="champions-summary"><b>🔒 Şampiyonlar Ligi 2. hafta tahmin süresi doldu.</b></div>';box.innerHTML='';save.classList.add('hide');return}
    state.innerHTML='';box.innerHTML=renderInputs(rows,mine);bindFixtureActions(box);save.classList.remove('hide');save.textContent=mine.length===rows.length?'Güncellenmiş Tahminleri Kaydet ✅':'Şampiyonlar Ligi Tahminlerimi Kaydet ⭐'
  }
  function rankingMarkup(rows){if(!rows.length)return'<div class="champions-summary">Henüz puan oluşmadı.</div>';return `<table><tr><th>Sıra</th><th>Oyuncu</th><th>Puan</th><th>🎯</th><th>⚽</th></tr>${rows.map(row=>{const rank=Number(row.league_rank),medal=rank===1?'🥇 ':rank===2?'🥈 ':rank===3?'🥉 ':'';return `<tr><td>${medal}${rank}</td><td>${esc(row.player_name)}</td><td><b>${row.points}</b></td><td>${row.exact_count}</td><td>${row.correct_count}</td></tr>`;}).join('')}</table>`}
  function participantsMarkup(rows){if(!rows.length)return'<div class="champions-summary">Henüz Şampiyonlar Ligi tahmini kaydedilmedi.</div>';const people={};rows.forEach(row=>(people[row.player_name]??=[]).push(row));return Object.entries(people).map(([name,matches])=>`<div class="champions-summary" style="margin-bottom:10px"><b>${esc(name)}</b>${matches.map(row=>{const prediction=row.predicted_home==null||row.predicted_away==null?'*-*':`${row.predicted_home}-${row.predicted_away}`;const result=row.real_home==null||row.real_away==null?null:{home_score:row.real_home,away_score:row.real_away};const score=prediction==='*-*'?{symbol:''}:scoreChampionsPrediction({fixture_id:row.fixture_id,week,home_score:row.predicted_home,away_score:row.predicted_away},result);return `<div class="savedrow">${esc(row.home_team)} <b>${prediction}</b> ${esc(row.away_team)}${Number(row.fixture_id)===CHAMPIONS_OPPORTUNITY_ID?' <span class="champions-opportunity">🔥 Fırsat Maçı • X2</span>':''}${result?` <span class="small">(${result.home_score}-${result.away_score}) ${score.symbol}</span>`:''}</div>`;}).join('')}</div>`).join('')}
  async function loadRanking(){const board=document.getElementById('championsRankingBoard'),participants=document.getElementById('championsParticipants');const token=localStorage.getItem('bizimSkorFriendToken');if(!token){board.innerHTML='<div class="champions-error">Önce mevcut oyuncu hesabınla giriş yap.</div>';participants.innerHTML='';return}board.innerHTML='<p class="small">Sıralama yükleniyor…</p>';participants.innerHTML='';const [ranking,predictions]=await Promise.all([sb.rpc('get_champions_league_ranking',{p_token:token,p_season:season}),sb.rpc('get_champions_league_week_predictions',{p_token:token,p_season:season,p_week:week})]);if(ranking.error||predictions.error){const error=ranking.error||predictions.error;if(isSessionError(error))showLoginRequired(board,participants);else board.innerHTML=`<div class="champions-error">${esc(error.message)}</div>`;return}board.innerHTML=rankingMarkup(ranking.data||[]);participants.innerHTML=participantsMarkup(predictions.data||[])}
  async function loadHistory(historyWeek=week){const content=document.getElementById('historyContent');if(!content)return;const token=localStorage.getItem('bizimSkorFriendToken');if(!token){content.innerHTML='<div class="champions-error">Şampiyonlar Ligi geçmişini görmek için hesabına yeniden giriş yap.</div>';return}content.innerHTML='<p class="small">Şampiyonlar Ligi geçmişi yükleniyor…</p>';const q=await sb.rpc('get_champions_league_history',{p_token:token,p_season:season,p_week:Number(historyWeek)});if(q.error){if(isSessionError(q.error))showLoginRequired(content);else content.innerHTML=`<div class="champions-error">${esc(q.error.message)}</div>`;return}const rows=q.data||[];if(!rows.length){content.innerHTML='<p class="small">Şampiyonlar Ligi hafta bilgisi bulunamadı.</p>';return}const summary=rows[0],completed=Number(summary.completed_count||0),total=Number(summary.fixture_count||rows.length);const finished=total>0&&completed===total,rank=completed&&summary.week_rank?`${summary.week_rank}.`:'-';const matches=rows.map(row=>{const prediction=row.predicted_home==null||row.predicted_away==null?null:{fixture_id:row.fixture_id,week:Number(historyWeek),home_score:row.predicted_home,away_score:row.predicted_away};const result=row.real_home==null||row.real_away==null?null:{home_score:row.real_home,away_score:row.real_away};const score=scoreChampionsPrediction(prediction,result);const mark=score.symbol?`${score.symbol} +${score.points}`:'';const predictionText=prediction?`${prediction.home_score}-${prediction.away_score}`:'Tahmin bulunamadı';return `<div class="history-match"><div class="history-real">${esc(row.home_team)} ${result?`<b>${result.home_score}-${result.away_score}</b>`:'-'} ${esc(row.away_team)}${Number(row.fixture_id)===CHAMPIONS_OPPORTUNITY_ID&&Number(historyWeek)===week?' <span class="champions-opportunity">🔥 Fırsat Maçı • X2</span>':''}</div><div class="history-pred">Tahminin: <b>${predictionText}</b><span class="history-mark">${mark}</span></div></div>`;}).join('');content.innerHTML=`<div class="history-summary"><div class="history-stat"><span>Haftalık Puan</span><b>${summary.week_points||0}</b></div><div class="history-stat"><span>${finished?'Hafta Sırası':'Geçici Sıra'}</span><b>${rank}</b></div><div class="history-stat"><span>Katılan</span><b>${summary.participant_count||0}</b></div></div><p class="small">${completed}/${total} maç sonuçlandı. ${finished?`Şampiyonlar Ligi ${historyWeek}. haftayı ${rank} sırada tamamladın.`:`Sıralama maçlar sonuçlandıkça güncellenir.`}</p>${matches}`}
  async function savePrediction(){const token=localStorage.getItem('bizimSkorFriendToken');if(!token)return alert('Önce mevcut oyuncu hesabınla giriş yap.');try{const rows=fixtures.map(f=>({fixture_id:f.id,home_score:document.getElementById('clh'+f.id)?.value,away_score:document.getElementById('cla'+f.id)?.value}));const checked=BizimSkorChampionsLeague.validateWeeklyScores(fixtures,rows);const q=await sb.rpc('save_champions_league_predictions',{p_token:token,p_season:season,p_week:week,p_predictions:checked});if(q.error)throw q.error;alert('Şampiyonlar Ligi 2. hafta tahminlerin kaydedildi ✅');editing=false;await loadPrediction()}catch(error){alert(error.message)}}
  window.BizimSkorChampionsUI={mount,currentWeek,openPrediction,loadPrediction,loadRanking,loadHistory,openMatchStatistics};mount();
})();