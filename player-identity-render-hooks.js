(function(root){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR');
  const identity=(name,suffix='')=>root.BizimSkorPlayerIdentity?.markup?.(name,{suffix})||`${esc(name)}${suffix}`;

  function decorateElement(el,name,suffix=''){
    if(!el||!name||el.querySelector?.(':scope > .bs-player-identity'))return false;
    el.innerHTML=identity(name,suffix);return true;
  }
  function decorateTable(rootEl){
    rootEl?.querySelectorAll?.('table').forEach(table=>{
      const heads=[...table.querySelectorAll('tr:first-child th')],idx=heads.findIndex(h=>['oyuncu','katılımcı'].includes(String(h.textContent||'').trim().toLocaleLowerCase('tr-TR')));if(idx<0)return;
      [...table.querySelectorAll('tr')].slice(1).forEach(row=>{const cell=row.children?.[idx];if(!cell)return;const marked=cell.querySelector?.('[data-player-name]'),name=marked?.dataset?.playerName||cell.textContent?.trim();if(marked)decorateElement(marked,name);else decorateElement(cell,name)});
    });
  }
  function decorateKnownScreens(){
    ['weeklyRankingBoard','generalBoard','friendLeagueRanking','championsRankingBoard','championsWeeklyRankingBoard','nationsRankingBoard'].forEach(id=>decorateTable(document.getElementById(id)));
    document.querySelectorAll('#leagueSystemPanel .league-player').forEach(el=>{const text=String(el.textContent||'').trim(),isMe=/^Sen\s*•/i.test(text),name=text.replace(/^Sen\s*•\s*/i,'').trim();decorateElement(el,name,isMe?' • Sen':'')});
    document.querySelectorAll('#bsPlayerMuseumModal .bs-museum-head h2,#bsPlayerProfileModal .bs-museum-head h2').forEach(el=>{const name=String(el.textContent||'').replace(/^🏛️\s*/,'').trim();if(name){el.innerHTML=`🏛️ ${identity(name)}`}});
  }

  if(typeof root.renderScoreTable==='function')root.renderScoreTable=function(targetId,ps,rs){const rows=root.scoreRows(ps,rs);let lastPts=null,lastRank=0;rows.forEach((r,i)=>{if(r.pts!==lastPts){lastRank=i+1;lastPts=r.pts}r.rank=lastRank});const target=document.getElementById(targetId);if(!target)return;target.innerHTML=rows.length?`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th><th>⚽</th></tr>${rows.map(r=>`<tr><td>${r.rank===1?'🥇 1':r.rank===2?'🥈 2':r.rank===3?'🥉 3':r.rank}</td><td>${identity(r.name)}</td><td><b>${r.pts}</b></td><td>${r.ex}</td><td>${r.cr}</td></tr>`).join('')}</table>`:'Henüz puan oluşmadı.'};

  if(typeof root.renderPlayerPredictions==='function')root.renderPlayerPredictions=function(targetId,ps,fxs,rs){const g={};ps.forEach(p=>(g[p.player_name]??=[]).push(p));const real=Object.fromEntries(rs.filter(r=>r.home_score!=null&&r.away_score!=null).map(r=>[r.fixture_id,r])),me=localStorage.getItem('bizimSkorName'),target=document.getElementById(targetId);if(!target)return;target.innerHTML=Object.keys(g).sort((a,b)=>a.localeCompare(b,'tr')).map(n=>{const map=Object.fromEntries(g[n].map(p=>[p.fixture_id,p]));return `<div class="pc"><b>${identity(n,n===me?' • Sen':'')}</b>${fxs.map(f=>map[f.id]?`<div class="small">${esc(f.home_team)} <b>${root.BizimSkorHistory.visiblePredictionScore(map[f.id],real[f.id],n===me)}</b> ${esc(f.away_team)}${real[f.id]?(root.isExactScore(map[f.id],real[f.id])?' 🎯':root.out(map[f.id].home_score,map[f.id].away_score)===root.out(real[f.id].home_score,real[f.id].away_score)?' ⚽':''):''}</div>`:'').join('')}</div>`}).join('')||'Henüz tahmin kaydedilmedi.'};

  if(typeof root.renderFriendLeagueRanking==='function')root.renderFriendLeagueRanking=function(rows){const box=document.getElementById('friendLeagueRanking');if(!box)return;box.innerHTML=rows.length?`<table><tr><th>Sıra</th><th>Oyuncu</th><th>Puan</th><th>🎯</th><th>⚽</th></tr>${rows.map(r=>`<tr><td>${r.league_rank}</td><td>${identity(r.player_name)}</td><td><b>${r.points}</b></td><td>${r.exact_count}</td><td>${r.correct_count}</td></tr>`).join('')}</table>`:'Henüz puan oluşmadı.'};

  if(typeof root.renderFriendLeaguePredictions==='function')root.renderFriendLeaguePredictions=function(rows){const box=document.getElementById('friendLeaguePredictions');if(!box)return;if(!rows.length){box.innerHTML='<p class="small">Bu hafta için fikstür veya tahmin bulunamadı.</p>';return}const people={};rows.forEach(r=>(people[r.player_name]??=[]).push(r));const me=localStorage.getItem('bizimSkorName');box.innerHTML=Object.entries(people).sort((a,b)=>a[0].localeCompare(b[0],'tr')).map(([name,matches])=>`<div class="pc"><b>${identity(name,norm(name)===norm(me)?' • Sen':'')}</b>${matches.map(r=>{const prediction=r.predicted_home==null||r.predicted_away==null?'*-*':`${r.predicted_home}-${r.predicted_away}`,real=r.real_home==null||r.real_away==null?'':` (${r.real_home}-${r.real_away})`;return `<div class="small">${esc(r.home_team)} <b>${prediction}</b> ${esc(r.away_team)}${real}</div>`}).join('')}</div>`).join('')};

  function wrapApi(api,key){if(!api||typeof api[key]!=='function'||api[key].__playerIdentityWrapped)return;const original=api[key];const wrapped=async function(...args){const value=await original.apply(this,args);decorateKnownScreens();return value};wrapped.__playerIdentityWrapped=true;try{api[key]=wrapped}catch(_){}}
  ['loadRanking','loadChampionsWeeklyRanking'].forEach(k=>wrapApi(root.BizimSkorChampionsUI,k));
  ['loadRanking','openRanking'].forEach(k=>wrapApi(root.BizimSkorNationsUI,k));

  document.addEventListener('click',event=>{if(event.target?.closest?.('.tab,[data-tab],[data-league-open],[data-league-code],[data-player-museum-open],#openPlayerMuseum')){setTimeout(decorateKnownScreens,80);setTimeout(decorateKnownScreens,350)}},true);
  root.addEventListener?.('supported-team:saved',()=>setTimeout(decorateKnownScreens,80));
  setTimeout(decorateKnownScreens,100);
})(typeof globalThis!=='undefined'?globalThis:this);
