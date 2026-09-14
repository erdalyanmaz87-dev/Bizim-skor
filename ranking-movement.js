(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorRankingMovement=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const PREFIX='bizimSkorRankingMovement:v3:';
  function normalizeName(value){return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR')}
  function normalizeRows(rows){return (rows||[]).map((row,index)=>({name:String(row.name??row.player_name??''),rank:Number(row.rank??row.league_rank??index+1),metric:String(row.metric??[row.pts??row.points??row.total_points??'',row.ex??row.exact_count??row.exact_scores??'',row.cr??row.correct_count??row.correct_results??''].join('|'))})).filter(row=>row.name&&Number.isFinite(row.rank)&&row.rank>0)}
  function fingerprint(rows){return normalizeRows(rows).map(row=>`${normalizeName(row.name)}:${row.rank}:${row.metric}`).join(';')}
  function snapshot(rows){return Object.fromEntries(normalizeRows(rows).map(row=>[normalizeName(row.name),{rank:row.rank,metric:row.metric}]))}
  function nextState(previous,rows,revision){
    const currentRows=normalizeRows(rows),currentFingerprint=fingerprint(currentRows);
    const currentRevision=String(revision??currentFingerprint);
    if(previous&&previous.revision===currentRevision)return{...previous,movement:previous.movement||{}};
    const previousSnapshot=previous?.snapshot||{},movement={};
    if(previous&&Object.keys(previousSnapshot).length)currentRows.forEach(row=>{const key=normalizeName(row.name),before=previousSnapshot[key];if(!before)return;const delta=Number(before.rank)-Number(row.rank);if(delta>0)movement[key]={direction:'up',amount:delta};else if(delta<0)movement[key]={direction:'down',amount:Math.abs(delta)}});
    return{revision:currentRevision,fingerprint:currentFingerprint,snapshot:snapshot(currentRows),movement};
  }
  function readFrom(storage,key){try{const raw=storage?.getItem(PREFIX+key);return raw?JSON.parse(raw):null}catch(_){return null}}
  function writeTo(storage,key,state){try{storage?.setItem(PREFIX+key,JSON.stringify(state))}catch(_){}return state}
  function read(key){return readFrom(root.localStorage,key)}
  function write(key,state){return writeTo(root.localStorage,key,state)}
  function track(key,rows,revision){const state=nextState(read(key),rows,revision);write(key,state);return state}
  function trackWithSeed(key,rows,revision,seed,storage=root.localStorage){const stored=readFrom(storage,key),previous=seed||stored||null;const state=nextState(previous,rows,revision);writeTo(storage,key,state);return state}
  function movementFor(state,name){return state?.movement?.[normalizeName(name)]||null}
  function badge(movement){if(!movement||!movement.amount)return'';const up=movement.direction==='up',arrow=up?'▲':'▼',cls=up?'bs-rank-up':'bs-rank-down';return ` <span class="bs-rank-move ${cls}" title="Önceki maç sonucuna göre ${movement.amount} sıra ${up?'yükseldi':'geriledi'}">${arrow} ${movement.amount}</span>`}
  function rankHtml(rank,movement,medal=''){return `${medal}${rank}${badge(movement)}`}
  function ensureStyles(doc=root.document){if(!doc||doc.getElementById('bizimSkorRankingMovementStyle'))return false;const style=doc.createElement('style');style.id='bizimSkorRankingMovementStyle';style.textContent='.bs-rank-cell{text-align:center!important;vertical-align:middle}.bs-rank-move{display:flex;width:max-content;min-width:32px;align-items:center;justify-content:center;gap:2px;margin:3px auto 0;padding:1px 5px;border-radius:999px;font-size:11px;font-weight:900;line-height:1.25;white-space:nowrap}.bs-rank-up{color:#16a34a!important;background:rgba(22,163,74,.12)}.bs-rank-down{color:#dc2626!important;background:rgba(220,38,38,.12)}html[data-theme="dark"] .bs-rank-up{color:#4ade80!important;background:rgba(74,222,128,.12)}html[data-theme="dark"] .bs-rank-down{color:#f87171!important;background:rgba(248,113,113,.12)}';doc.head.appendChild(style);return true}
  return Object.freeze({normalizeName,normalizeRows,fingerprint,snapshot,nextState,track,trackWithSeed,movementFor,badge,rankHtml,ensureStyles});
});
