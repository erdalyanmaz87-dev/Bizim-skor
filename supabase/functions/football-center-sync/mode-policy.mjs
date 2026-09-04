const POST_MATCH_CATEGORIES=Object.freeze(['standings','top_scorers','top_assists']);

export function postMatchCategories(){
  return [...POST_MATCH_CATEGORIES];
}

export function isSupportedFootballCenterMode(mode){
  return mode==='matchday_complete'||mode==='manual';
}
