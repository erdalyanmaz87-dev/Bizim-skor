(function(scope){
  const core=scope.BizimSkorPredictionBadgeCore;let queue=Promise.resolve();
  function database(){return new Promise((resolve,reject)=>{const request=scope.indexedDB.open('bizimskor-prediction-badge',1);request.onupgradeneeded=()=>request.result.createObjectStore('state');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
  async function read(){const db=await database();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('state','readonly'),req=tx.objectStore('state').get('current');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}finally{db.close()}}
  async function write(snapshot){const db=await database();try{await new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(snapshot,'current');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}finally{db.close()}}
  function enqueue(work){queue=queue.then(work).catch(()=>{});return queue}
  function receiveSnapshot(snapshot){return enqueue(async()=>{if(!snapshot||!Array.isArray(snapshot.weeks)||!Number.isFinite(Number(snapshot.updatedAt)))return;const old=await read();if(old&&Number(old.updatedAt)>Number(snapshot.updatedAt))return;await write(snapshot);await core.updateAppBadge(scope.navigator,core.pendingWeeks(snapshot.weeks).length)})}
  function applyPush(snapshot){return enqueue(async()=>{if(!snapshot)return;const current=await read();if(!core.acceptPushSnapshot(snapshot,current))return;await write(snapshot);await core.updateAppBadge(scope.navigator,core.pendingWeeks(snapshot.weeks).length)})}
  scope.BizimSkorPredictionBadgeWorker=Object.freeze({receiveSnapshot,applyPush});
})(self);
