(function(){
  window.addEventListener('DOMContentLoaded',()=>{
    window.playerInviteCount=window.playerInviteCount||new Map();
    const baseLoadActivePlayers=loadActivePlayers;
    loadActivePlayers=async function(){
      await baseLoadActivePlayers();
      const token=localStorage.getItem('bizimSkorFriendToken');
      if(!token){window.playerInviteCount=new Map();return}
      try{
        const q=await sb.rpc('get_invite_leaderboard',{p_token:token,p_period:'season'});
        if(q.error)throw q.error;
        window.playerInviteCount=new Map((q.data||[]).map(row=>[normalizePlayerName(row.player_name),Number(row.invite_count||0)]));
      }catch(error){
        console.warn('invite ranking tie-break unavailable',error);
        window.playerInviteCount=new Map();
      }
    };

    function denseRows(rows){
      return BizimSkorHistory.buildWeeklyRanking((rows||[]).map(row=>({
        ...row,
        points:row.pts,
        inviteCount:window.playerInviteCount?.get(normalizePlayerName(row.name))||0,
        createdAt:window.playerCreatedAt?.get(normalizePlayerName(row.name))
      })));
    }

    renderScoreTable=function(targetId,ps,rs){
      const rows=denseRows(scoreRows(ps,rs));
      document.getElementById(targetId).innerHTML=rows.length
        ?`<table><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th><th>🎯</th><th>⚽</th></tr>${rows.map(r=>`<tr><td>${r.rank===1?'🥇 1':r.rank===2?'🥈 2':r.rank===3?'🥉 3':r.rank}</td><td>${esc(r.name)}</td><td><b>${r.pts}</b></td><td>${r.ex}</td><td>${r.cr}</td></tr>`).join('')}</table>`
        :'Henüz puan oluşmadı.';
    };

    personalRankValue=function(rows,name,tiedByPoints=true){
      const wanted=normalizePlayerName(name);
      if(tiedByPoints===false){
        const index=(rows||[]).findIndex(row=>normalizePlayerName(row.name)===wanted);
        return index>=0?`${index+1}.`:'—';
      }
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
