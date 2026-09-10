(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorLeagues=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const LABELS={champions:'Şampiyonlar',elite:'Elit Lig',gold:'Altın Lig',silver:'Gümüş Lig',bronze:'Bronz Lig'};
  const ICONS={champions:'👑',elite:'💎',gold:'🥇',silver:'🥈',bronze:'🥉'};

  function esc(value){return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;')}
  function label(code){return LABELS[code]||'Bronz Lig'}
  function renderArenaPending(){return '<div class="league-empty league-pending"><b>🏆 Arena dönemi hazırlanıyor.</b><br>Geçici başlangıç sıralaması henüz oluşturulamıyor.</div>'}
  function slot(size,rate){const n=Number(size)||0;return n>0?Math.max(1,Math.round(n*rate)):0}
  function movementTargets(code,counts={},lockedSlots=null){
    const ce=lockedSlots?Number(lockedSlots.champions_elite)||0:slot(counts.champions,.25);
    const eg=lockedSlots?Number(lockedSlots.elite_gold)||0:slot(counts.elite,.33);
    const gs=lockedSlots?Number(lockedSlots.gold_silver)||0:slot(counts.gold,.31);
    const sb=lockedSlots?Number(lockedSlots.silver_bronze)||0:slot(counts.silver,.31);
    if(code==='champions')return{promotion:0,relegation:ce};
    if(code==='elite')return{promotion:ce,relegation:eg};
    if(code==='gold')return{promotion:eg,relegation:gs};
    if(code==='silver')return{promotion:gs,relegation:sb};
    return{promotion:sb,relegation:0};
  }

  function renderLeagueSummary(summary={}){
    const code=summary.league_code||'bronze',rank=Number(summary.rank_in_league)||0,size=Number(summary.league_size)||0;
    const perf=summary.performance_score==null?'—':Number(summary.performance_score).toFixed(2),status=summary.promotion_status||'none';
    let statusText='Güvenli bölgedesin';
    if(status==='promotion')statusText='⬆ Yükselme hattındasın';
    else if(status==='relegation')statusText='⬇ Düşme hattındasın';
    else if(status==='championship')statusText='🏆 Liderlik koltuğundasın';
    if(!summary.is_eligible){const needed=Math.max(1,Number(summary.rounds_needed)||Math.max(1,2-(Number(summary.valid_round_count)||0)));statusText=`Yükselme/düşme için ${needed} tahmin turu daha tamamla`}
    return `<button type="button" class="league-summary league-summary-button${summary.is_eligible?'':' league-summary-pending'}" data-league-open="1"><span class="league-summary-title">${ICONS[code]||'🥉'} ${esc(label(code))}</span><strong class="league-summary-rank">${rank||'—'} / ${size||'—'}</strong><span class="league-summary-performance">Perf. ${esc(perf)}</span><span class="league-summary-status">${esc(statusText)}</span><span class="league-summary-action">Arena'ya Gir ›</span></button>`;
  }
  function renderPreviewSummary(summary={}){
    const code=summary.league_code||'bronze',rank=Number(summary.rank_in_league)||0,size=Number(summary.league_size)||0,perf=summary.performance_score==null?'—':Number(summary.performance_score).toFixed(2);
    return `<button type="button" class="league-summary league-summary-button league-summary-preview" data-league-open="1"><span class="league-summary-title">${ICONS[code]||'🥉'} ${esc(label(code))}</span><strong class="league-summary-rank">${rank||'—'} / ${size||'—'}</strong><span class="league-summary-performance">Perf. ${esc(perf)}</span><span class="league-summary-status">Geçici başlangıç sıralaması • 3. ve 4. hafta</span><span class="league-summary-action">Arena'ya Gir ›</span></button>`;
  }

  function zoneFor(row,size,targets={}){
    const rank=Number(row.league_rank)||0,promotion=Number(targets.promotion)||0,relegation=Number(targets.relegation)||0;
    if(promotion>0&&rank>0&&rank<=promotion)return'promotion';
    if(relegation>0&&rank>size-relegation)return'relegation';
    return'none';
  }
  function rowClass(row,size,targets){
    const classes=['league-row'],zone=zoneFor(row,size,targets);
    if(zone==='promotion'||row.promotion_status==='promotion')classes.push('league-promotion-zone');
    if(zone==='relegation'||row.promotion_status==='relegation')classes.push('league-relegation-zone');
    if(row.promotion_status==='championship')classes.push('league-championship-zone');
    if(zone==='promotion'&&Number(row.league_rank)===Number(targets.promotion))classes.push('league-promotion-boundary');
    if(zone==='relegation'&&Number(row.league_rank)===size-Number(targets.relegation)+1)classes.push('league-relegation-boundary');
    if(row.is_me)classes.push('league-me');
    return classes.join(' ');
  }
  function movementText(targets={}){
    const parts=[];if(targets.promotion)parts.push(`⬆ İlk ${targets.promotion} yükselir`);if(targets.relegation)parts.push(`⬇ Son ${targets.relegation} düşer`);return parts.join(' • ');
  }
  function renderLeagueTable(rows=[],summary={}){
    const code=summary.league_code||rows[0]?.league_code||'bronze';
    if(!rows.length)return `<div class="league-empty">Bu ligde henüz sıralamaya giren oyuncu yok.</div>`;
    const size=rows.length,targets=summary.movement_targets||{promotion:0,relegation:0},info=movementText(targets);
    return `<div class="league-table-wrap">${info?`<div class="league-movement-info">${esc(info)}</div>`:''}<div class="league-table-head"><span>#</span><span>Oyuncu</span><span>Perf.</span><span>Tur</span></div>${rows.map(row=>`<div class="${rowClass(row,size,targets)}"><span class="league-rank">${esc(row.league_rank)}</span><span class="league-player">${row.is_me?'<b>Sen • </b>':''}${esc(row.player_name)}</span><span class="league-performance">${esc(row.performance_score??'—')}</span><span class="league-rounds">${esc(row.valid_round_count??0)}</span></div>`).join('')}<div class="league-table-foot">${ICONS[code]||'🥉'} ${esc(label(code))}</div></div>`;
  }

  function renderLeagueRules(){return `<div class="league-rules"><h3>ⓘ Lig Kuralları</h3><p>Bir lig dönemi <b>4 Süper Lig haftası</b> sürer.</p><p>Bu dört hafta içinde oynanan Süper Lig, Şampiyonlar Ligi ve Uluslar Ligi tahmin turları ortak lig performansına dahil edilir.</p><p>Lig sisteminde yükselme/düşme hakkı için dönem içinde <b>en az 2 ayrı tahmin turu</b> tamamlamak gerekir.</p><p>2 tur şartını tamamlamayan oyuncu dönem sonunda <b>bir alt lige düşer</b>. Bronz Lig oyuncusu Bronz Lig’de kalır.</p><p>Yeni oyuncular Bronz Lig’den başlar.</p><p>Yükselme ve düşme kontenjanları dönem başında belirlenir ve dönem boyunca değişmez.</p><p>Katılmadığın tur normal dönem performansına 0 yazmaz; ancak 2 tur şartı ayrıca uygulanır.</p></div>`}
  function renderOtherLeagueChips(counts={},currentLeague){return `<div class="league-other"><div class="league-other-title">Diğer Ligler</div><div class="league-chips">${Object.keys(LABELS).map(code=>`<button type="button" class="league-chip${code===currentLeague?' league-chip-active':''}" data-league-code="${code}">${ICONS[code]} <span>${esc(LABELS[code])}</span><small>${Number(counts[code])||0}</small></button>`).join('')}</div></div>`}
  function renderLeagueShell(summary={},rows=[],counts={}){
    const code=summary.league_code||'bronze',ownCode=summary.own_league_code||code,showEligibilityNote=!summary.is_eligible&&code===ownCode;
    const targets=movementTargets(code,counts,summary.locked_promotion_slots||null);
    return `<div class="league-shell"><div class="league-header"><div><div class="league-eyebrow">Bizim Skor Ligleri</div><h2>${ICONS[code]||'🥉'} ${esc(label(code))}</h2></div><button type="button" class="league-rules-button" data-league-rules="1">ⓘ Kurallar</button></div>${renderLeagueTable(rows,{...summary,league_code:code,movement_targets:targets})}${showEligibilityNote?`<div class="league-eligibility-note">Yükselme/düşme için ${Math.max(1,Number(summary.rounds_needed)||2)} tahmin turu daha tamamlamalısın.</div>`:''}${renderOtherLeagueChips(counts,code)}<div class="league-rules-host" hidden>${renderLeagueRules()}</div></div>`;
  }
  function renderPreviewShell(code,rows=[],counts={}){
    const targets=movementTargets(code,counts);
    return `<div class="league-shell league-preview-shell"><div class="league-header"><div><div class="league-eyebrow">Geçici başlangıç sıralaması • 3. ve 4. hafta</div><h2>${ICONS[code]||'🥉'} ${esc(label(code))}</h2></div><span class="league-preview-badge">ÖNİZLEME</span></div>${renderLeagueTable(rows.map(row=>({...row,valid_round_count:'—'})),{league_code:code,movement_targets:targets})}<div class="league-preview-note">5. hafta başladığında dönem puanları sıfırdan işlenir. 8. hafta sonunda yükselme/düşme belirlenir; 9. hafta yeni liglerle başlar.</div>${renderOtherLeagueChips(counts,code)}</div>`;
  }

  function css(){return `.league-summary{box-sizing:border-box;width:100%;border:1px solid #dbeafe;border-radius:14px;background:linear-gradient(135deg,#f8fafc,#eff6ff);padding:12px;text-align:left;color:#0f172a}.league-summary-button{display:grid;grid-template-columns:1fr auto;gap:5px 10px;cursor:pointer}.league-summary-title{font-weight:900}.league-summary-rank{font-size:18px}.league-summary-performance{font-size:12px;font-weight:800;color:#475569}.league-summary-status{font-size:12px;color:#166534}.league-summary-pending .league-summary-status{color:#92400e}.league-summary-preview .league-summary-status{color:#92400e;font-weight:800}.league-summary-action{font-size:12px;text-align:right;color:#1d4ed8;font-weight:800}.league-shell{border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:14px}.league-header{display:flex;justify-content:space-between;gap:10px;align-items:start}.league-header h2{margin:3px 0 12px}.league-eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;font-weight:900}.league-rules-button{padding:8px 10px;background:#f1f5f9;color:#334155;font-size:12px}.league-movement-info{margin:2px 0 8px;padding:8px 10px;border-radius:10px;background:#f8fafc;border:1px solid #e2e8f0;font-size:12px;font-weight:900;text-align:center;color:#334155}.league-table-head,.league-row{display:grid;grid-template-columns:34px minmax(0,1fr) 58px 40px;gap:6px;align-items:center;padding:9px 8px}.league-table-head{font-size:11px;color:#64748b;font-weight:800;border-bottom:1px solid #e2e8f0}.league-row{border-bottom:1px solid #f1f5f9;font-size:13px}.league-promotion-zone{background:#ecfdf5}.league-relegation-zone{background:#fef2f2}.league-promotion-boundary{border-bottom:2px solid #16a34a}.league-relegation-boundary{border-top:2px solid #dc2626}.league-championship-zone{background:#fffbeb}.league-me{outline:2px solid #0f172a;outline-offset:-2px;border-radius:8px}.league-rank,.league-performance,.league-rounds{text-align:center;font-weight:800}.league-table-foot{padding:9px 8px;font-size:12px;color:#64748b}.league-eligibility-note{margin-top:10px;padding:9px 10px;border-radius:10px;background:#fffbeb;color:#92400e;font-size:12px;font-weight:800}.league-other{margin-top:14px}.league-other-title{font-weight:900;margin-bottom:8px}.league-chips{display:flex;gap:7px;overflow:auto;padding-bottom:3px}.league-chip{flex:0 0 auto;padding:9px 10px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;display:flex;align-items:center;gap:5px}.league-chip small{background:#e2e8f0;border-radius:999px;padding:2px 5px}.league-chip-active{background:#0f172a;color:#fff}.league-chip-active small{background:#334155}.league-rules{padding:10px 2px}.league-rules p{font-size:13px;line-height:1.45}.league-empty{padding:18px;text-align:center;color:#64748b}.league-pending{line-height:1.55}.league-pending b{display:block;color:#0f172a;margin-bottom:5px}.league-preview-badge{font-size:10px;font-weight:900;padding:5px 7px;border-radius:999px;background:#fef3c7;color:#92400e}.league-preview-note{margin-top:10px;padding:10px;border-radius:10px;background:#eff6ff;color:#1e3a8a;font-size:12px;line-height:1.45;font-weight:700}`}

  async function mount(options={}){
    const sb=options.sb||root.sb,token=options.token||root.localStorage?.getItem('bizimSkorFriendToken');
    const summaryHost=options.summaryHost||root.document?.getElementById('personalLeagueSummary'),detailHost=options.detailHost||root.document?.getElementById('leagueSystemPanel');
    if(!sb||!token)return false;
    const [summaryResult,countResult]=await Promise.all([sb.rpc('get_my_league_summary',{p_token:token}),sb.rpc('get_league_counts',{p_token:token})]);
    if(summaryResult.error)throw summaryResult.error;if(countResult.error)throw countResult.error;
    const summary=Array.isArray(summaryResult.data)?summaryResult.data[0]:summaryResult.data;
    if(!summary){
      const previewResult=await sb.rpc('get_league_initial_preview',{p_token:token});if(previewResult.error)throw previewResult.error;
      const preview=previewResult.data||[];if(!preview.length){if(detailHost)detailHost.innerHTML=renderArenaPending();return true}
      const counts={champions:0,elite:0,gold:0,silver:0,bronze:0};preview.forEach(row=>{if(Object.hasOwn(counts,row.league_code))counts[row.league_code]+=1});
      const me=preview.find(row=>row.is_me)||preview[0],ownCode=me.league_code||'bronze';
      if(summaryHost)summaryHost.innerHTML=renderPreviewSummary({...me,rank_in_league:me.league_rank,league_size:counts[ownCode]});if(!detailHost)return true;
      function loadPreviewLeague(code){const target=code||ownCode;detailHost.innerHTML=renderPreviewShell(target,preview.filter(row=>row.league_code===target),counts);detailHost.querySelectorAll?.('[data-league-code]').forEach(btn=>btn.addEventListener('click',()=>loadPreviewLeague(btn.dataset.leagueCode)))}
      loadPreviewLeague(ownCode);return true;
    }
    const counts={champions:0,elite:0,gold:0,silver:0,bronze:0};(countResult.data||[]).forEach(row=>{if(Object.hasOwn(counts,row.league_code))counts[row.league_code]=Number(row.player_count)||0});
    if(summaryHost)summaryHost.innerHTML=renderLeagueSummary(summary);if(!detailHost)return true;
    async function loadLeague(code){const ownLeague=summary.league_code||'bronze',target=code||ownLeague;const tableResult=await sb.rpc('get_league_table',{p_token:token,p_league_code:target});if(tableResult.error)throw tableResult.error;const rows=tableResult.data||[];detailHost.innerHTML=renderLeagueShell({...summary,league_code:target,own_league_code:ownLeague},rows,counts);detailHost.querySelector('[data-league-rules]')?.addEventListener('click',()=>{const host=detailHost.querySelector('.league-rules-host');if(host)host.hidden=!host.hidden});detailHost.querySelectorAll('[data-league-code]').forEach(btn=>btn.addEventListener('click',()=>loadLeague(btn.dataset.leagueCode)))}
    await loadLeague(summary.league_code||'bronze');return true;
  }

  return {esc,movementTargets,renderArenaPending,renderLeagueSummary,renderPreviewSummary,renderLeagueTable,renderLeagueRules,renderOtherLeagueChips,renderLeagueShell,renderPreviewShell,css,mount};
});
