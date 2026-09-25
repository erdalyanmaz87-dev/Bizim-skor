(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorStartup=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
const rankIds=['personalWeekRank','personalSezuRank','personalGeneralRank'];
function rememberedPlayer(storage){
  const name=storage?.getItem?.('bizimSkorName'),token=storage?.getItem?.('bizimSkorFriendToken');
  return name&&token?{name,token}:null;
}
function showRememberedPlayer(doc,name){
  doc?.getElementById?.('newPlayer')?.classList.add('hide');
  doc?.getElementById?.('knownPlayer')?.classList.remove('hide');
  const knownName=doc?.getElementById?.('knownName');if(knownName)knownName.textContent=name;
  rankIds.forEach(id=>{const node=doc?.getElementById?.(id);if(!node)return;node.textContent='Yükleniyor…';node.setAttribute?.('aria-busy','true')});
}
function showLoggedOut(doc){
  doc?.getElementById?.('knownPlayer')?.classList.add('hide');
  doc?.getElementById?.('newPlayer')?.classList.remove('hide');
}
function primeRememberedPlayer(doc,storage){const player=rememberedPlayer(storage);if(player)showRememberedPlayer(doc,player.name);return player}
function startIsolatedJobs(jobs,onError){
  return Object.fromEntries(Object.entries(jobs||{}).map(([name,job])=>{
    let task;try{task=Promise.resolve(job())}catch(error){task=Promise.reject(error)}
    return[name,task.catch(error=>{onError?.(name,error)})];
  }));
}
return Object.freeze({rememberedPlayer,showRememberedPlayer,showLoggedOut,primeRememberedPlayer,startIsolatedJobs});
});
