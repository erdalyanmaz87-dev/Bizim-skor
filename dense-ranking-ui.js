(function(){
  window.addEventListener('DOMContentLoaded',()=>{
    function denseRows(rows){
      return BizimSkorHistory.buildWeeklyRanking((rows||[]).map(row=>({...row,points:row.pts})));
    }

    renderScoreTable=function(targetId,ps,rs){
      const rows=denseRows(scoreRows(ps,rs));
      document.getElementById(targetId).innerHTML=rows.length
        ?`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th><th>⚽</th></tr>${rows.map(r=>`<tr><td>${r.rank===1?'🥇 1':r.rank===2?'🥈 2':r.rank===3?'🥉 3':r.rank}</td><td>${esc(r.name)}</td><td><b>${r.pts}</b></td><td>${r.ex}</td><td>${r.cr}</td></tr>`).join('')}</table>`
        :'Henüz puan oluşmadı.';
    };

    personalRankValue=function(rows,name){
      const wanted=normalizePlayerName(name);
      const mine=denseRows(rows).find(row=>normalizePlayerName(row.name)===wanted);
      return mine?`${mine.rank}.`:'—';
    };

    loadGeneral=async function(){
      let psq=await sb.from('predictions').select('*');
      if(psq.error)throw psq.error;
      let ps=psq.data||[];
      try{await loadActivePlayers();ps=ps.filter(p=>isPlayerActive(p.player_name))}catch(e){console.warn('active player filter skipped',e)}
      const rsq=await sb.from('results').select('*');
      if(rsq.error)throw rsq.error;
      const rows=denseRows(scoreRows(ps,rsq.data||[]));
      document.getElementById('generalBoard').innerHTML=`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th></tr>${rows.map(r=>`<tr><td>${r.rank===1?'🥇 1':r.rank===2?'🥈 2':r.rank===3?'🥉 3':r.rank}</td><td>${esc(r.name)}</td><td><b>${r.pts}</b></td><td>${r.ex}</td></tr>`).join('')}</table>`;
    };
  });
})();
