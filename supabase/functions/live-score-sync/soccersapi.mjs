const LEAGUES={super_lig:3515,champions_league:539,nations_league:366};
export function nextMatchdayEnd(now=new Date()){
 const day=new Date(now).toLocaleDateString('en-CA',{timeZone:'Europe/Istanbul'});
 return new Date(Date.parse(day+'T00:00:00+03:00')+48*3600000-1);
}
export function needsPreflight(fixture,log,link,now=new Date()){
 const at=new Date(now).getTime(),kickoff=Date.parse(fixture.kickoff),until=kickoff-at;
 if(!Number.isFinite(kickoff)||until<=0||kickoff>nextMatchdayEnd(now).getTime()||link?.enabled===false||Number(link?.provider_fixture_id)>0)return false;
 const last=Date.parse(log?.attempted_at),age=at-last;
 if(!Number.isFinite(last))return true;
 if(until<=15*60000&&last<kickoff-15*60000)return true;
 return age>=(until<=60*60000?30*60000:2*3600000);
}
const ALIASES={clubbruggekv:'clubbrugge',clubbruggefc:'clubbrugge',clubbruggebelgium:'clubbrugge',racingclubdelens:'lens',racingclublens:'lens',rcdelens:'lens',racingclublens:'lens',racingclublensois:'lens',rclensfrance:'lens',lensfc:'lens',clublbrugge:'clubbrugge',clubbruggekv:'clubbrugge',brugge:'clubbrugge',bruges:'clubbrugge',bayernmunih:'bayernmunich',bayernmunchen:'bayernmunich',fcbayernmunchen:'bayernmunich',fcbayernmunich:'bayernmunich',bayernmunich:'bayernmunich',clubbrugge:'clubbrugge',clubbruges:'clubbrugge',clubbruggekv:'clubbrugge',rclens:'lens',asroma:"roma",fcporto:"porto",psveindhoven:"psv",slaviaprag:'slaviaprague',skslaviaprague:'slaviaprague',psg:'parissaintgermain',bodoglimt:'bodoglimt',bodoeglimt:'bodoglimt',aekathens:'aek',fenerbahceistanbul:'fenerbahce',sabahmasazir:'sabah',turkiye:'turkey',cekya:'czechrepublic',czechia:'czechrepublic',almanya:'germany',fransa:'france',ingiltere:'england',ispanya:'spain',italya:'italy',portekiz:'portugal',hollanda:'netherlands',macaristan:'hungary',sirbistan:'serbia',yunanistan:'greece',hirvatistan:'croatia',izlanda:'iceland',karadag:'montenegro',galler:'wales',avusturya:'austria',isvicre:'switzerland',belcika:'belgium',iskocya:'scotland',irlanda:'ireland',kuzeyirlanda:'northernireland',ukrayna:'ukraine',arnavutluk:'albania',romanya:'romania',bulgaristan:'bulgaria',norvec:'norway',isvec:'sweden',finlandiya:'finland',danimarka:'denmark',polonya:'poland',bosnahersek:'bosniaherzegovina',gurcistan:'georgia',kuzeymakedonya:'northmacedonia'};
function teamKey(value){
 const key=String(value||'').toLocaleLowerCase('tr-TR').replace(/ı/g,'i').replace(/ø/g,'o').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
 const identities={amedsk:'amedspor',amedsportiffaaliyetler:'amedspor',amedspor:'amedspor'};
 return identities[key]||ALIASES[key]||key;
}
function sameTeam(a,b){
 a=teamKey(a);b=teamKey(b);
 if(a===b&&a)return true;
 const shorter=a.length<=b.length?a:b,longer=a.length<=b.length?b:a;
 return shorter.length>=5&&longer.includes(shorter);
}
function kickoffMillis(raw){
 // This provider shifts even its numeric timestamp when utc=3 is requested.
 const zone=String(raw?.time?.timezone||'UTC').match(/^UTC(?:([+-]\d+(?:\.\d+)?))?$/);
 if(!zone)return NaN;
 return Number(raw?.time?.timestamp)*1000-Number(zone[1]||0)*3600000;
}
export function matchSoccersFixtures(internal,rawRows,links=[]){
 const matched=[],used=new Set();
 for(const f of internal){
  const saved=links.find(l=>l.competition===f.competition&&Number(l.fixture_id)===Number(f.id)&&l.provider==='soccersapi'&&l.enabled===true);
  const pinned=saved?rawRows.filter(r=>!used.has(Number(r.id))&&Number(r.id)===Number(saved.provider_fixture_id)&&Number.isFinite(kickoffMillis(r))&&Math.abs(kickoffMillis(r)-Date.parse(f.kickoff))<=60*60000):[];
  const teamCandidates=rawRows.filter(r=>!used.has(Number(r.id))&&Number.isFinite(kickoffMillis(r))&&Math.abs(kickoffMillis(r)-Date.parse(f.kickoff))<=60*60000&&sameTeam(f.home_team,r.teams?.home?.name)&&sameTeam(f.away_team,r.teams?.away?.name));
  const leagueCandidates=teamCandidates.filter(r=>Number(r.league?.id)===LEAGUES[f.competition]);
  const candidates=pinned.length?pinned:leagueCandidates.length?leagueCandidates:teamCandidates.length===1?teamCandidates:[];
  if(candidates.length===1){matched.push({internal:f,raw:candidates[0]});used.add(Number(candidates[0].id));}
 }
 return matched;
}
export function normalizeSoccersFixture(raw){
 // Extra time/penalty results need a separate regular-time policy; never auto-finalize them.
 const code=Number(raw?.status);
 let status=({3:'FT',11:'HT',12:'ET',13:'P',14:'BT'})[code];
 if(code===1)status=/2nd/i.test(String(raw.status_period))?'2H':/1st/i.test(String(raw.status_period))?'1H':null;
 const id=Number(raw?.id),h=raw?.scores?.home_score,a=raw?.scores?.away_score;
 if(!status||!Number.isInteger(id)||id<=0||h==null||a==null||String(h).trim()===''||String(a).trim()==='')return null;
 const home_score=Number(h),away_score=Number(a);
 if(![home_score,away_score].every(n=>Number.isInteger(n)&&n>=0&&n<=20))return null;
 const minute=String(raw?.time?.minute??'').trim();
 const parts=minute.split('+');
 const elapsed=minute&&parts.every(p=>/^\d+$/.test(p))?parts.reduce((s,n)=>s+Number(n),0):null;
 return {provider_fixture_id:id,status,elapsed:elapsed==null?null:Math.min(130,elapsed),home_score,away_score};
}

// Temporary matchnight acceleration; normal quota-based cadence resumes automatically.
export function soccersPollQuota(gate,now=new Date()){
 const current=new Date(now).getTime();
 const tonight=(current>=Date.parse('2026-10-21T19:00:00Z')&&current<Date.parse('2026-10-21T21:30:00Z'))||(current>=Date.parse('2026-10-23T17:00:00Z')&&current<Date.parse('2026-10-23T21:00:00Z'));
 return {request_count:Number(gate.request_count||0),remaining_window_minutes:tonight?1:Number(gate.remaining_window_minutes||0),minimum_interval_minutes:tonight?(current>=Date.parse('2026-10-23T17:00:00Z')&&current<Date.parse('2026-10-23T21:00:00Z')?1:2):5};
}

