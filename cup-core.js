(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorCupCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
const labels=['Son 64','Son 32','Son 16','Çeyrek final','Yarı final','Final'];
function rounds(start=8){return labels.map((label,i)=>({round:i+1,label,week:start+i,matches:32/2**i,bronze:i===5}))}
function compare(a,b){return b.points-a.points||b.invites-a.invites||b.exact-a.exact||b.correct-a.correct||Date.parse(a.created_at)-Date.parse(b.created_at)||a.id-b.id}
function points(p,r,opportunity=false){if(!p||!r||r.some(x=>x==null))return 0;return p[0]===r[0]&&p[1]===r[1]?(opportunity?8:4):Math.sign(p[0]-p[1])===Math.sign(r[0]-r[1])?(opportunity?2:1):0}
function next(round,position){return {round:round+1,position:Math.ceil(position/2),side:position%2?'a':'b'}}
function bronzeSource(position){return `Yarı final ${position} mağlubu`}
return {rounds,compare,points,next,bronzeSource};
});
