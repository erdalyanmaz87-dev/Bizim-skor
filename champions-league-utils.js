(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorChampionsLeague=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const turkeyDateKey=new Intl.DateTimeFormat('sv-SE',{
    timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'
  });
  const turkeyDateLabel=new Intl.DateTimeFormat('tr-TR',{
    timeZone:'Europe/Istanbul',day:'numeric',month:'long',year:'numeric',weekday:'long'
  });

  function isWeekLocked(fixtures,now=new Date()){
    if(!fixtures.length)return false;
    return now.getTime()>=Math.min(...fixtures.map(f=>new Date(f.kickoff).getTime()));
  }

  function validateWeeklyScores(fixtures,scores){
    const fixtureIds=fixtures.map(f=>Number(f.id)).sort((a,b)=>a-b);
    if((scores||[]).some(row=>row.home_score==null||row.away_score==null||String(row.home_score).trim()===''||String(row.away_score).trim()==='')){
      throw new Error('Tüm maçların skorlarını doldurun.');
    }
    const rows=(scores||[]).map(row=>({
      fixture_id:Number(row.fixture_id),
      home_score:Number(row.home_score),
      away_score:Number(row.away_score)
    }));
    const scoreIds=rows.map(x=>x.fixture_id).sort((a,b)=>a-b);
    const complete=rows.length===fixtureIds.length&&new Set(scoreIds).size===fixtureIds.length&&fixtureIds.every((id,i)=>id===scoreIds[i]);
    if(!complete)throw new Error('Tüm maçların skorlarını doldurun.');
    if(rows.some(x=>!Number.isInteger(x.home_score)||!Number.isInteger(x.away_score)||x.home_score<0||x.home_score>20||x.away_score<0||x.away_score>20)){
      throw new Error('Skorlar 0-20 arasında tam sayı olmalıdır.');
    }
    return rows;
  }

  function outcome(home,away){return +home>+away?'1':+home<+away?'2':'X'}

  function scorePrediction(prediction,result){
    if(!prediction||!result||result.home_score==null||result.away_score==null)return{points:0,exact:0,correct:0,symbol:''};
    const exact=+prediction.home_score===+result.home_score&&+prediction.away_score===+result.away_score;
    const correct=outcome(prediction.home_score,prediction.away_score)===outcome(result.home_score,result.away_score);
    return{points:exact?4:correct?1:0,exact:exact?1:0,correct:correct?1:0,symbol:exact?'🎯':correct?'⚽':''};
  }

  function rankSeason(rows){
    const created=value=>{const time=new Date(value||0).getTime();return Number.isFinite(time)&&value?time:Number.MAX_SAFE_INTEGER};
    const sorted=[...rows].sort((a,b)=>b.points-a.points||b.exact-a.exact||b.correct-a.correct||created(a.createdAt)-created(b.createdAt)||a.name.localeCompare(b.name,'tr'));
    const podiumPoints=[];let afterPodium=0;
    return sorted.map(row=>{
      let podiumIndex=podiumPoints.indexOf(row.points);
      if(podiumIndex<0&&podiumPoints.length<3){podiumPoints.push(row.points);podiumIndex=podiumPoints.length-1}
      return{...row,rank:podiumIndex>=0?podiumIndex+1:4+afterPodium++};
    });
  }

  function visibleScore(prediction,result,isCurrentPlayer){
    if(!prediction)return'';
    const completed=!!(result&&result.home_score!=null&&result.away_score!=null);
    return isCurrentPlayer||completed?`${prediction.home_score}-${prediction.away_score}`:'*-*';
  }

  function groupFixturesByTurkeyDate(fixtures){
    const groups=[];
    [...fixtures].sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff)||Number(a.id)-Number(b.id)).forEach(fixture=>{
      const date=new Date(fixture.kickoff),dateKey=turkeyDateKey.format(date);
      let group=groups.find(x=>x.dateKey===dateKey);
      if(!group){group={dateKey,label:turkeyDateLabel.format(date),fixtures:[]};groups.push(group)}
      group.fixtures.push(fixture);
    });
    return groups;
  }

  return{isWeekLocked,validateWeeklyScores,scorePrediction,rankSeason,visibleScore,groupFixturesByTurkeyDate};
});
