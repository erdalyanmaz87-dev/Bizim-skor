function normalizeName(value){return String(value??'').trim().toLocaleLowerCase('tr-TR')}
export function filterSubscriptions(rows, playerName){
  if(!playerName) return rows || [];
  const wanted=normalizeName(playerName);
  return (rows||[]).filter(row=>normalizeName(row.player_name)===wanted);
}
