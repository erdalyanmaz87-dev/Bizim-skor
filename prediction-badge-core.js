(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorPredictionBadgeCore=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
  function pendingWeeks(rows,now=Date.now()){
    const found=new Map();
    for(const row of rows||[]){
      const deadline=Date.parse(row.deadline),remaining=deadline-Number(now);
      if(!Number.isFinite(remaining)||remaining<=0||remaining>86400000)continue;
      if(row.complete===true)continue;
      if(row.fixture_count!=null&&(!(Number(row.fixture_count)>0)||Number(row.saved_count)>=Number(row.fixture_count)))continue;
      const key=row.key||row.reminder_key||`${row.competition}:${row.week}:${deadline}`;
      found.set(key,{key,deadline:new Date(deadline).toISOString()});
    }
    return [...found.values()];
  }
  async function updateAppBadge(navigator,count){try{if(count>0)await navigator?.setAppBadge?.(count);else await navigator?.clearAppBadge?.()}catch(_){/* OS badge support and permissions vary. */}}
  function acceptPushSnapshot(incoming,current){return !!current&&!!current.owner&&incoming?.owner===current.owner&&Number.isFinite(Number(incoming.updatedAt))&&Number(incoming.updatedAt)>=Number(current.updatedAt||0)}
  return Object.freeze({pendingWeeks,updateAppBadge,acceptPushSnapshot});
});
