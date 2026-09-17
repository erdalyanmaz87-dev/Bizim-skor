(function(root){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR');
  const identity=(name,suffix='')=>root.BizimSkorPlayerIdentity?.markup?.(name,{suffix})||`${esc(name)}${suffix}`;

  if(typeof root.renderScoreTable==='function'){
    root.renderScoreTable=function(targetId,ps,rs){
      const rows=root.scoreRows(ps,rs);let lastPts=null,lastRank=0;
      rows.forEach((r,i)=>{if(r.pts!==lastPts){lastRank=i+1;lastPts=r.pts}r.rank=lastRank});
      const target=document.getElementById(targetId);if(!target)return;
      target.innerHTML=rows.length?`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th><th>⚽</th></tr>${rows.map(r=>`<tr><td>${r.rank===1?'🥇 1':r.rank===2?'🥈 2':r.rank===3?'🥉 3':r.rank}</td><td>${identity(r.name)}</td><td><b>${r.pts}</b></td><td>${r.ex}</td><td>${r.cr}</td></tr>`).join('')}</table>`:'Henüz puan oluşmadı.';
    };
  }

  if(typeof root.renderPlayerPredictions==='function'){
    root.renderPlayerPredictions=function(targetId,ps,fxs,rs){
      const g={};ps.forEach(p=>(g[p.player_name]??=[]).push(p));
      const real=Object.fromEntries(rs.filter(r=>r.home_score!=null&&r.away_score!=null).map(r=>[r.fixture_id,r])),me=localStorage.getItem('bizimSkorName'),target=document.getElementById(targetId);if(!target)return;
      target.innerHTML=Object.keys(g).sort((a,b)=>a.localeCompare(b,'tr')).map(n=>{const map=Object.fromEntries(g[n].map(p=>[p.fixture_id,p]));return `<div class="pc"><b>${identity(n,n===me?' • Sen':'')}</b>${fxs.map(f=>map[f.id]?`<div class="small">${esc(f.home_team)} <b>${root.BizimSkorHistory.visiblePredictionScore(map[f.id],real[f.id],n===me)}</b> ${esc(f.away_team)}${real[f.id]?(root.isExactScore(map[f.id],real[f.id])?' 🎯':root.out(map[f.id].home_score,map[f.id].away_score)===root.out(real[f.id].home_score,real[f.id].away_score)?' ⚽':''):''}</div>`:'').join('')}</div>`}).join('')||'Henüz tahmin kaydedilmedi.';
    };
  }

  if(typeof root.renderFriendLeagueRanking==='function'){
    root.renderFriendLeagueRanking=function(rows){const box=document.getElementById('friendLeagueRanking');if(!box)return;box.innerHTML=rows.length?`<table><tr><th>Sıra</th><th>Oyuncu</th><th>Puan</th><th>🎯</th><th>⚽</th></tr>${rows.map(r=>`<tr><td>${r.league_rank}</td><td>${identity(r.player_name)}</td><td><b>${r.points}</b></td><td>${r.exact_count}</td><td>${r.correct_count}</td></tr>`).join('')}</table>`:'Henüz puan oluşmadı.'};
  }

  if(typeof root.renderFriendLeaguePredictions==='function'){
    root.renderFriendLeaguePredictions=function(rows){const box=document.getElementById('friendLeaguePredictions');if(!box)return;if(!rows.length){box.innerHTML='<p class="small">Bu hafta için fikstür veya tahmin bulunamadı.</p>';return}const people={};rows.forEach(r=>(people[r.player_name]??=[]).push(r));const me=localStorage.getItem('bizimSkorName');box.innerHTML=Object.entries(people).sort((a,b)=>a[0].localeCompare(b[0],'tr')).map(([name,matches])=>`<div class="pc"><b>${identity(name,norm(name)===norm(me)?' • Sen':'')}</b>${matches.map(r=>{const prediction=r.predicted_home==null||r.predicted_away==null?'*-*':`${r.predicted_home}-${r.predicted_away}`,real=r.real_home==null||r.real_away==null?'':` (${r.real_home}-${r.real_away})`;return `<div class="small">${esc(r.home_team)} <b>${prediction}</b> ${esc(r.away_team)}${real}</div>`}).join('')}</div>`).join('')};
  }
})(typeof globalThis!=='undefined'?globalThis:this);
