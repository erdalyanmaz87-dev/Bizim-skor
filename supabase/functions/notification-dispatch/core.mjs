export function reminderThreshold(hoursUntilKickoff){
  const hours=Number(hoursUntilKickoff);
  if(!Number.isFinite(hours)||hours<0||hours>24)return null;
  return hours<=3?'3h':'24h';
}

export function predictionIsComplete(predictionCount,fixtureCount){
  return Number(fixtureCount)>0&&Number(predictionCount)===Number(fixtureCount);
}

export function reminderCompetitions(){
  return[
    {code:'super',label:'Süper Lig',fixtureTable:'fixtures',predictionTable:'predictions'},
    {code:'champions',label:'Şampiyonlar Ligi',fixtureTable:'champions_league_fixtures',predictionTable:'champions_league_predictions'},
    {code:'nations',label:'Uluslar Ligi',fixtureTable:'nations_league_fixtures',predictionTable:'nations_league_predictions'}
  ];
}

export function reminderEventKey(competition,season,week,threshold){
  return`reminder:${String(competition)}:${String(season)}:${Number(week)}:${String(threshold)}`;
}

export function reminderCopy(competitionLabel,week,threshold){
  const label=threshold==='24h'?'24 saat':'3 saat';
  return{
    title:`${String(competitionLabel)} ${Number(week)}. Hafta tahminlerini unutma!`,
    body:`Tahminlerin ${label} sonra, ilk maç başladığında kapanacak.`
  };
}

export function exactScoreReached(prediction,liveScore){
  if(!prediction||!liveScore)return false;
  return Number(prediction.home_score)===Number(liveScore.home_score)&&Number(prediction.away_score)===Number(liveScore.away_score);
}

export function deliveryKey(eventKey,playerName,endpoint){
  return `${String(eventKey)}|${String(playerName).trim().toLocaleLowerCase('tr-TR')}|${String(endpoint)}`;
}
