(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorOpportunityScoring=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
function opportunity(f){const api=typeof module==='object'&&module.exports?require('./opportunity-match-utils.js'):root.BizimSkorOpportunity;if(api)return api.isSuperOpportunity(f);const week=+f?.week,id=+(f?.id??f?.fixture_id);return week===4&&id===30||week===5&&id===44}
function dir(h,a){return h===a?0:h>a?1:-1}
function score(f,p,r){const api=typeof module==='object'&&module.exports?require('./opportunity-match-utils.js'):root.BizimSkorOpportunity;if(!p||!r)return{points:0,fireBall:0,fireTarget:0};const prediction={...p,scoring_version:f?.scoring_version??p.scoring_version,kickoff:f?.kickoff??p.kickoff},points=api.pointsForSuper(prediction,r),exact=+p.home_score===+r.home_score&&+p.away_score===+r.away_score,correct=dir(+p.home_score,+p.away_score)===dir(+r.home_score,+r.away_score);return{points,fireBall:opportunity(f)&&correct&&!exact?1:0,fireTarget:opportunity(f)&&exact?1:0}}
return{opportunity,score}
});
