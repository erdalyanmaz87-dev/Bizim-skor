export function reminderThreshold(hoursUntilKickoff){
  const hours=Number(hoursUntilKickoff);
  if(!Number.isFinite(hours)||hours<0||hours>24)return null;
  return hours<=3?'3h':'24h';
}

export function predictionIsComplete(predictionCount,fixtureCount){
  return Number(fixtureCount)>0&&Number(predictionCount)===Number(fixtureCount);
}

export function exactScoreReached(prediction,liveScore){
  if(!prediction||!liveScore)return false;
  return Number(prediction.home_score)===Number(liveScore.home_score)&&Number(prediction.away_score)===Number(liveScore.away_score);
}

export function deliveryKey(eventKey,playerName,endpoint){
  return `${String(eventKey)}|${String(playerName).trim().toLocaleLowerCase('tr-TR')}|${String(endpoint)}`;
}