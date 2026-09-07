(function(root){
  function outcome(home,away){return home>away?'H':home<away?'A':'D'}
  function summarize(rows){
    const matches=new Map();
    (rows||[]).forEach(row=>{
      const id=Number(row.fixture_id),finished=row.real_home!=null&&row.real_away!=null;
      if(!matches.has(id))matches.set(id,{fixtureId:id,homeTeam:row.home_team,awayTeam:row.away_team,realHome:row.real_home,realAway:row.real_away,finished,exactNames:[],correctResultCount:0});
      const match=matches.get(id);
      if(!finished||row.predicted_home==null||row.predicted_away==null)return;
      const exact=Number(row.predicted_home)===Number(row.real_home)&&Number(row.predicted_away)===Number(row.real_away);
      if(exact)match.exactNames.push(row.player_name);
      if(outcome(Number(row.predicted_home),Number(row.predicted_away))===outcome(Number(row.real_home),Number(row.real_away)))match.correctResultCount++;
    });
    return Array.from(matches.values());
  }
  function render(matches,esc){
    if(!matches.length)return '<div class="champions-summary">Henüz maç özeti oluşmadı.</div>';
    return matches.map(match=>{
      if(!match.finished)return `<div class="champions-summary" style="margin-bottom:10px"><b>${esc(match.homeTeam)} - ${esc(match.awayTeam)}</b><div class="small">Maç henüz sonuçlanmadı.</div></div>`;
      const exact=match.exactNames.length?match.exactNames.map(esc).join(', '):'Bilen olmadı';
      return `<div class="champions-summary" style="margin-bottom:10px"><b>${esc(match.homeTeam)} ${match.realHome}-${match.realAway} ${esc(match.awayTeam)}</b><div class="savedrow">🎯 Tam skor: <b>${exact}</b></div><div class="savedrow">⚽ Sonucu bilen: <b>${match.correctResultCount} kişi</b></div></div>`;
    }).join('');
  }
  root.BizimSkorChampionsMatchSummary={summarize,render};
})(typeof window!=='undefined'?window:globalThis);
