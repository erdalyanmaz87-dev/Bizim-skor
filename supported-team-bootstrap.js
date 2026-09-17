(function(root){
  let started=false;
  function load(doc,src,id){return new Promise((resolve,reject)=>{if(doc.getElementById(id)||[...doc.scripts].some(s=>(s.getAttribute('src')||'').split('?')[0].endsWith(src)))return resolve();const el=doc.createElement('script');el.id=id;el.src=src;el.defer=true;el.onload=resolve;el.onerror=()=>reject(new Error(src+' yüklenemedi'));doc.body.appendChild(el)})}
  async function start(){
    if(started||typeof document==='undefined')return false;
    const token=root.localStorage?.getItem('bizimSkorFriendToken');
    if(!token)return false;
    try{if(typeof sb!=='undefined')root.sb=sb}catch(_){}
    if(!root.sb){setTimeout(start,500);return false}
    started=true;
    try{
      await load(document,'supported-team-ui.js','bsSupportedTeamUiScript');
      await load(document,'supported-team-ranking-logos.js','bsSupportedTeamRankingLogosScript');
      await load(document,'admin-supported-team-stats.js','bsSupportedTeamAdminStatsScript');
      return true;
    }catch(error){started=false;console.warn('supported team bootstrap',error);return false}
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='complete')setTimeout(start,1200);
    else root.addEventListener('load',()=>setTimeout(start,1200),{once:true});
    root.addEventListener?.('bizimskor:session-ready',()=>setTimeout(start,250));
  }
  root.BizimSkorSupportedTeamBootstrap=Object.freeze({start});
})(typeof globalThis!=='undefined'?globalThis:this);
