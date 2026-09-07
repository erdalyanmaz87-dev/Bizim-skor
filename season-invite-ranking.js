(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorSeasonInviteRanking=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
function created(value){const time=new Date(value||0).getTime();return Number.isFinite(time)&&value?time:Number.MAX_SAFE_INTEGER}
function sortRows(rows){return (rows||[]).slice().sort((a,b)=>Number(b.pts||b.points||0)-Number(a.pts||a.points||0)||Number(b.seasonInvites||0)-Number(a.seasonInvites||0)||Number(b.ex||b.exact||0)-Number(a.ex||a.exact||0)||Number(b.cr||b.correct||0)-Number(a.cr||a.correct||0)||created(a.createdAt)-created(b.createdAt)||String(a.name||'').localeCompare(String(b.name||''),'tr'))}
return Object.freeze({sortRows});
});
