(function(root){
  const core=root.BizimSkorPredictionBadgeCore;if(!core)return;
  let rows=[],owner='',known=false,generation=0,lastRefresh=0,inflight=null,lastCount=null;
  let snapshotVersion=0;
  function publishState(){const snapshot={owner:owner?String(root.localStorage?.getItem('bizimSkorName')||'').trim().toLocaleLowerCase('tr-TR'):'',updatedAt:Date.now(),weeks:core.pendingWeeks(rows)},version=++snapshotVersion;const send=worker=>{if(version===snapshotVersion)worker?.postMessage({type:'prediction-badge-state',snapshot})};const controller=root.navigator?.serviceWorker?.controller;if(controller)send(controller);else root.navigator?.serviceWorker?.ready?.then(reg=>send(reg.active)).catch(()=>{})}
  const token=()=>root.localStorage?.getItem('bizimSkorFriendToken')||'';
  function render(){
    const count=owner===token()&&known?core.pendingWeeks(rows).length:0,button=document.querySelector('[data-simple-nav="predictionStatus"]'),ring=button?.querySelector('.bs-simple-progress');
    if(ring){let badge=ring.querySelector('.bs-prediction-due-badge');if(count&&!badge){badge=document.createElement('span');badge.className='bs-prediction-due-badge';badge.setAttribute('aria-hidden','true');ring.appendChild(badge)}if(badge){if(count){badge.textContent=String(count);badge.hidden=false}else badge.remove()}}
    if(button){if(count)button.setAttribute('data-prediction-due',String(count));else button.removeAttribute('data-prediction-due');const base=(button.getAttribute('aria-label')||'Tahmin Durumu').split(' · Son 24 saatte')[0];button.setAttribute('aria-label',base+(count?` · Son 24 saatte tahmini eksik ${count} hafta`:''))}
    if(known&&lastCount!==count){lastCount=count;core.updateAppBadge(root.navigator,count)}
    return count;
  }
  async function refresh({force=false}={}){
    const current=token();if(current!==owner){const hadOwner=!!owner;owner=current;rows=[];known=!current||hadOwner;lastRefresh=0;generation++;inflight=null;lastCount=null;render();if(known)publishState();if(current)known=false}
    if(!current){known=true;render();publishState();return 0}
    if(!root.sb?.rpc)return render();
    if(inflight&&!force)return inflight;
    if(!force&&Date.now()-lastRefresh<60000)return render();
    const version=++generation;lastRefresh=Date.now();
    const task=(async()=>{try{const q=await root.sb.rpc('get_prediction_reminder_status',{p_token:current,p_now:new Date().toISOString()});if(version!==generation||current!==token())return render();if(q.error)throw q.error;rows=q.data||[];known=true;lastCount=null;publishState();return render()}catch(error){if(version===generation){lastRefresh=0;render();root.console?.warn?.('prediction badge refresh',error?.message||error)}return core.pendingWeeks(rows).length}finally{if(version===generation)inflight=null}})();
    inflight=task;return task;
  }
  function saved(event){const d=event?.detail,name=String(root.localStorage?.getItem('bizimSkorName')||'').trim().toLocaleLowerCase('tr-TR');if(d&&owner===token()&&String(d.player||'').trim().toLocaleLowerCase('tr-TR')===name&&Number(d.fixture_count)>0&&Number(d.saved_count)>=Number(d.fixture_count)){rows=rows.filter(row=>row.competition!==d.competition||Number(row.week)!==Number(d.week));known=true;render();publishState()}return refresh({force:true})}
  function mount(){
    document.head.insertAdjacentHTML('beforeend','<style id="bsPredictionBadgeStyles">[data-simple-nav="predictionStatus"] .bs-simple-progress{position:relative;overflow:visible}.bs-prediction-due-badge{position:absolute;top:-5px;right:-8px;display:flex;align-items:center;justify-content:center;min-width:22px;height:22px;padding:0 5px;box-sizing:border-box;border:2px solid #fff;border-radius:999px;background:#dc2626;color:#fff;font:800 12px/1 system-ui;box-shadow:0 2px 5px #0002;z-index:2}</style>');
    root.navigator?.serviceWorker?.addEventListener?.('controllerchange',()=>{if(known)publishState()});
    root.addEventListener('bizimskor:session-ready',()=>refresh({force:true}));root.addEventListener('bizimskor:predictions-saved',saved);root.addEventListener('focus',()=>refresh({force:true}));root.addEventListener('storage',event=>{if(event.key==='bizimSkorFriendToken'||event.key===null)refresh({force:true})});document.addEventListener('click',event=>{if(event.target?.closest?.('#logoutPlayer,#bsHeaderAccountAction,[data-simple-account="logout"]'))root.setTimeout(()=>refresh(),100)});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh({force:true})});
    root.setInterval(()=>{if(document.visibilityState==='hidden')return;render();refresh()},60000);root.setTimeout(()=>refresh(),500);
  }
  root.BizimSkorPredictionBadge=Object.freeze({refresh,render,mount});mount();
})(typeof globalThis!=='undefined'?globalThis:this);
