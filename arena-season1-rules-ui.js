(function(root){
  if(typeof document==='undefined')return;
  const RULES_HTML='<h3>ⓘ Lig Kuralları</h3><p>Bir Arena sezonu <b>4 Süper Lig haftası</b> sürer.</p><p>Yükselme/düşme hakkı için oyuncunun erişebildiği Süper Lig haftalarının <b>en az 2</b> tanesinde tüm maçlara tahmin yapması gerekir.</p><p>Oyuncunun <b>kayıt olmadan önce</b> tahmin süresi kapanmış turlar hesaba girmez ve Arena puanını düşürmez.</p><p>Oyuncu kayıtlıyken erişebildiği bir turu kaçırırsa o tur <b>0 puan</b> ile ortalamaya girer.</p><p>Sezon aralığına denk gelen ve oyuncunun erişebildiği Şampiyonlar Ligi ile Uluslar Ligi performansları <b>ortalamaya katılır, tur sayısına katılmaz</b>.</p><p>Sezon sonunda en az 2 Süper Lig haftasını tamamlamayan mevcut Arena oyuncusu bir alt lige düşer; Bronz Lig oyuncusu daha alt lig olmadığı için Bronz Lig’de kalır. Yeni oyuncular Bronz Lig’den başlar.</p><p>Yükselme ve düşme kontenjanları sezon başında belirlenir.</p>';
  let timer=null,busy=false;
  const norm=v=>String(v||'').trim().toLocaleLowerCase('tr-TR');
  function token(){return root.localStorage?.getItem('bizimSkorFriendToken')||''}
  function activeLeagueCode(doc=document){return doc.querySelector('.league-chip-active[data-league-code]')?.dataset?.leagueCode||''}
  function rowPlayerName(row){const player=row?.querySelector?.('.league-player');if(!player)return'';const clone=player.cloneNode(true);clone.querySelectorAll('.league-forced-relegation-note').forEach(x=>x.remove());return clone.textContent.replace(/^\s*Sen\s*•\s*/i,'').trim()}
  function ensureStyles(doc=document){if(doc.getElementById('arenaSeason1RulesStyles'))return;const s=doc.createElement('style');s.id='arenaSeason1RulesStyles';s.textContent='.league-forced-relegation{background:#fee2e2!important}.league-forced-relegation-note{display:block;margin-top:4px;color:#b91c1c;font-size:9px;line-height:1.35;font-weight:900}html[data-theme="dark"] .league-forced-relegation{background:#450a0a!important;color:#fee2e2!important}html[data-theme="dark"] .league-forced-relegation-note{color:#fca5a5!important}';doc.head.appendChild(s)}
  function correctRules(doc=document){doc.querySelectorAll('.league-rules').forEach(host=>{if(host.dataset.arenaSeason1Rules==='2')return;host.innerHTML=RULES_HTML;host.dataset.arenaSeason1Rules='2'})}
  function annotateRows(rows,doc=document){
    const list=rows||[];
    const byName=new Map(list.map(row=>[norm(row.player_name),row]));
    const promotionSlots=list.filter(row=>row.promotion_status==='promotion').length;
    doc.querySelectorAll('.league-table-wrap .league-row').forEach(row=>{
      const record=byName.get(norm(rowPlayerName(row)));
      if(!record)return;
      const forced=record.promotion_status==='forced_relegation';
      row.classList.toggle('league-forced-relegation',forced);
      if(forced)row.classList.add('league-relegation-zone');
      if(promotionSlots>0){
        const inPromotionZone=Number(record.league_rank)<=promotionSlots;
        row.classList.toggle('league-promotion-zone',inPromotionZone);
      }
      const player=row.querySelector('.league-player');
      let note=player?.querySelector('.league-forced-relegation-note');
      if(forced&&!note&&player){note=doc.createElement('small');note.className='league-forced-relegation-note';note.textContent='Kural gereği küme düşürüldü';player.appendChild(note)}else if(!forced){note?.remove()}
    })
  }
  function updateOwnSummary(summary,doc=document){if(!summary)return;const status=doc.querySelector('.league-summary-status');if(!status)return;const roundsNeeded=Math.max(0,Number(summary.rounds_needed||0));if(roundsNeeded>0){status.textContent=`⚠ Arena hakkı için ${roundsNeeded} Süper Lig haftası daha tamamla`;return}if(summary.promotion_status==='forced_relegation'){status.textContent='⬇ Kural gereği küme düşürüldü'}}
  async function refresh(doc=document){correctRules(doc);const sb=root.sb,t=token();if(!sb||!t||busy)return false;const code=activeLeagueCode(doc);if(!code&&!doc.querySelector('.league-summary'))return false;busy=true;try{const jobs=[sb.rpc('get_my_league_summary',{p_token:t})];if(code)jobs.push(sb.rpc('get_league_table',{p_token:t,p_league_code:code}));const results=await Promise.all(jobs),summaryResult=results[0],tableResult=results[1];if(!summaryResult.error){const summary=Array.isArray(summaryResult.data)?summaryResult.data[0]:summaryResult.data;updateOwnSummary(summary,doc)}if(tableResult&&!tableResult.error)annotateRows(tableResult.data||[],doc);return true}finally{busy=false}}
  function schedule(doc=document,delay=120){root.clearTimeout?.(timer);timer=root.setTimeout?.(()=>refresh(doc).catch(e=>console.warn('arena season1 rules',e)),delay)}
  function mount(doc=document){ensureStyles(doc);correctRules(doc);schedule(doc,350);doc.addEventListener('click',event=>{if(event.target?.closest?.('[data-league-open],[data-league-code],[data-league-rules]'))schedule(doc,180)});doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='visible'&&doc.querySelector('.league-shell'))schedule(doc,80)});return true}
  root.BizimSkorArenaSeason1Rules=Object.freeze({activeLeagueCode,rowPlayerName,correctRules,annotateRows,updateOwnSummary,refresh,schedule,mount});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(document),{once:true});else mount(document);
})(typeof globalThis!=='undefined'?globalThis:this);
