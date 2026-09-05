const FINAL_STATUSES=new Set(['FT','AET','PEN']);

function equalSecret(left,right){if(!left||!right||left.length!==right.length)return false;let diff=0;for(let i=0;i<left.length;i++)diff|=left.charCodeAt(i)^right.charCodeAt(i);return diff===0}

export async function authorizeRequest({suppliedSecret,environmentSecret,databaseAuthorize}){
  if(!suppliedSecret)return false;
  if(equalSecret(suppliedSecret,environmentSecret))return true;
  return typeof databaseAuthorize==='function'&&await databaseAuthorize(suppliedSecret)===true;
}

function safeText(value,max=120){return String(value??'').trim().slice(0,max)}
function safeScore(value){const number=Number(value);return Number.isInteger(number)&&number>=0&&number<=30?number:null}
function fold(value){return safeText(value).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'')}
function aliases(value){const name=fold(value);const values=new Set([name]);if(name.includes('basaksehir'))values.add('istanbulbasaksehir');if(name.includes('erzurum'))values.add('erzurumbb');if(name==='caykurrizespor'||name==='crizespor')values.add('rizespor');if(name==='amedspor'||name==='amedsk')values.add('amed');return values}
function sameTeam(left,right){const a=aliases(left),b=aliases(right);for(const value of a)if(b.has(value))return true;return false}

export function matchProviderFixture(internalFixture,providerFixtures){
  const kickoff=new Date(internalFixture?.kickoff).getTime();
  if(!Number.isFinite(kickoff))return null;
  const matches=(Array.isArray(providerFixtures)?providerFixtures:[]).filter(row=>{
    const time=new Date(row?.fixture?.date).getTime();
    return Number.isFinite(time)&&Math.abs(time-kickoff)<=90*60*1000&&sameTeam(internalFixture?.home_team,row?.teams?.home?.name)&&sameTeam(internalFixture?.away_team,row?.teams?.away?.name);
  });
  return matches.length===1?matches[0]:null;
}

function normalizedMatch(row,teamId){
  const homeId=Number(row?.teams?.home?.id),awayId=Number(row?.teams?.away?.id),homeScore=safeScore(row?.goals?.home),awayScore=safeScore(row?.goals?.away);
  if(!Number.isInteger(homeId)||!Number.isInteger(awayId)||homeScore===null||awayScore===null)return null;
  const isHome=homeId===Number(teamId),own=isHome?homeScore:awayScore,opponent=isHome?awayScore:homeScore;
  return{fixture_id:Number(row.fixture.id),date:safeText(row.fixture.date,40),home_team:safeText(row.teams.home.name),away_team:safeText(row.teams.away.name),home_score:homeScore,away_score:awayScore,outcome:own>opponent?'W':own<opponent?'L':'D'};
}

export function teamRecentMatches(teamId,providerFixtures,beforeDate){
  const cutoff=new Date(beforeDate).getTime();
  return (Array.isArray(providerFixtures)?providerFixtures:[])
    .filter(row=>FINAL_STATUSES.has(safeText(row?.fixture?.status?.short,8)))
    .filter(row=>{const time=new Date(row?.fixture?.date).getTime();return Number.isFinite(time)&&time<cutoff&&(Number(row?.teams?.home?.id)===Number(teamId)||Number(row?.teams?.away?.id)===Number(teamId))})
    .sort((a,b)=>new Date(b.fixture.date).getTime()-new Date(a.fixture.date).getTime())
    .slice(0,5).map(row=>normalizedMatch(row,teamId)).filter(Boolean);
}

export function formSequence(recentMatches){return(Array.isArray(recentMatches)?recentMatches:[]).map(row=>row.outcome).filter(value=>['W','D','L'].includes(value)).slice(0,5)}

export function normalizeHeadToHead(providerFixtures){
  return (Array.isArray(providerFixtures)?providerFixtures:[])
    .filter(row=>FINAL_STATUSES.has(safeText(row?.fixture?.status?.short,8)))
    .sort((a,b)=>new Date(b?.fixture?.date).getTime()-new Date(a?.fixture?.date).getTime())
    .slice(0,5).map(row=>{const home=safeScore(row?.goals?.home),away=safeScore(row?.goals?.away);if(home===null||away===null)return null;return{fixture_id:Number(row.fixture.id),date:safeText(row.fixture.date,40),home_team:safeText(row.teams?.home?.name),away_team:safeText(row.teams?.away?.name),home_score:home,away_score:away,score:`${home}-${away}`}}).filter(Boolean);
}

export function weeklyRequestBudget(fixtureCount){const count=Math.max(0,Math.floor(Number(fixtureCount)||0));return count?Math.min(10,1+count):0}

function localRecentMatches(teamName,completedMatches,beforeDate){
  const cutoff=new Date(beforeDate).getTime();
  return (Array.isArray(completedMatches)?completedMatches:[])
    .filter(row=>Number.isFinite(new Date(row?.kickoff).getTime())&&new Date(row.kickoff).getTime()<cutoff)
    .filter(row=>sameTeam(teamName,row?.home_team)||sameTeam(teamName,row?.away_team))
    .filter(row=>safeScore(row?.home_score)!==null&&safeScore(row?.away_score)!==null)
    .sort((a,b)=>new Date(b.kickoff).getTime()-new Date(a.kickoff).getTime())
    .slice(0,5)
    .map(row=>{const homeScore=safeScore(row.home_score),awayScore=safeScore(row.away_score),isHome=sameTeam(teamName,row.home_team),own=isHome?homeScore:awayScore,opponent=isHome?awayScore:homeScore;return{fixture_id:Number(row.id),date:safeText(row.kickoff,40),home_team:safeText(row.home_team),away_team:safeText(row.away_team),home_score:homeScore,away_score:awayScore,outcome:own>opponent?'W':own<opponent?'L':'D'}});
}

export function buildLocalFixtureSnapshot({internalFixture,completedMatches,standings,fetchedAt}){
  const homeRecent=localRecentMatches(internalFixture.home_team,completedMatches,internalFixture.kickoff),awayRecent=localRecentMatches(internalFixture.away_team,completedMatches,internalFixture.kickoff);
  const standingFor=name=>(Array.isArray(standings)?standings:[]).find(row=>sameTeam(name,row?.team))||{};
  const side=(name,recent)=>{const standing=standingFor(name);return{name:safeText(name),rank:Number.isInteger(Number(standing.rank))?Number(standing.rank):null,points:Number.isInteger(Number(standing.points))?Number(standing.points):null,form:formSequence(recent),recent_matches:recent}};
  const headToHead=(Array.isArray(completedMatches)?completedMatches:[])
    .filter(row=>new Date(row?.kickoff).getTime()<new Date(internalFixture.kickoff).getTime())
    .filter(row=>(sameTeam(internalFixture.home_team,row?.home_team)&&sameTeam(internalFixture.away_team,row?.away_team))||(sameTeam(internalFixture.home_team,row?.away_team)&&sameTeam(internalFixture.away_team,row?.home_team)))
    .filter(row=>safeScore(row?.home_score)!==null&&safeScore(row?.away_score)!==null)
    .sort((a,b)=>new Date(b.kickoff).getTime()-new Date(a.kickoff).getTime()).slice(0,5)
    .map(row=>({fixture_id:Number(row.id),date:safeText(row.kickoff,40),home_team:safeText(row.home_team),away_team:safeText(row.away_team),home_score:safeScore(row.home_score),away_score:safeScore(row.away_score),score:`${safeScore(row.home_score)}-${safeScore(row.away_score)}`}));
  return{fixture_id:Number(internalFixture.id),week:Number(internalFixture.week),kickoff:safeText(internalFixture.kickoff,40),home:side(internalFixture.home_team,homeRecent),away:side(internalFixture.away_team,awayRecent),head_to_head:headToHead,fetched_at:safeText(fetchedAt,40)};
}

export function buildFixtureSnapshot({internalFixture,providerFixture,seasonFixtures,headToHead,standings,fetchedAt}){
  const homeId=Number(providerFixture?.teams?.home?.id),awayId=Number(providerFixture?.teams?.away?.id);
  if(!Number.isInteger(homeId)||!Number.isInteger(awayId))throw new Error('provider_team_missing');
  const standingMap=new Map((Array.isArray(standings)?standings:[]).map(row=>[Number(row.team_id),row]));
  const side=(id,name)=>{const recent=teamRecentMatches(id,seasonFixtures,internalFixture.kickoff),standing=standingMap.get(id)||{};return{team_id:id,name:safeText(name),rank:Number.isInteger(Number(standing.rank))?Number(standing.rank):null,points:Number.isInteger(Number(standing.points))?Number(standing.points):null,form:formSequence(recent),recent_matches:recent}};
  return{fixture_id:Number(internalFixture.id),week:Number(internalFixture.week),kickoff:safeText(internalFixture.kickoff,40),home:side(homeId,internalFixture.home_team),away:side(awayId,internalFixture.away_team),head_to_head:normalizeHeadToHead(headToHead),fetched_at:safeText(fetchedAt,40)};
}
