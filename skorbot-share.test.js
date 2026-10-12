const test=require('node:test'),assert=require('node:assert/strict');
let share;try{share=require('./skorbot-share.js')}catch(_){share={}}
test('shared match uses the existing statistics and SkorBot suggestion',async()=>{
 assert.equal(typeof share.getMatch,'function');
 const score={homeScore:1,awayScore:2};let requested;
 const match=await share.getMatch({},22,{loadSnapshot:async()=>({home_team:'Galatasaray',away_team:'Barcelona',week:2})},{suggestion:async(f,s)=>{requested=[f.id,s.kind];return score}});
 assert.deepEqual(requested,[22,'champions']);assert.equal(match.score,score);assert.equal(match.home.name,'Galatasaray');assert.equal(match.away.name,'Barcelona');
});
test('invalid shared fixture id is rejected before reading data',async()=>{
 assert.equal(typeof share.getMatch,'function');await assert.rejects(()=>share.getMatch({},-1,{},{}));
});
