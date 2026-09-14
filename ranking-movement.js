(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorRankingMovement=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const PREFIX='bizimSkorRankingMovement:v1:';

  function normalizeName(value){
    return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR');
  }

  function normalizeRows(rows){
    return (rows||[]).map((row,index)=>({
      name:String(row.name??row.player_name??''),
      rank:Number(row.rank??row.league_rank??index+1),
      metric:String(row.metric??[row.pts??row.points??row.total_points??'',row.ex??row.exact_count??row.exact_scores??'',row.cr??row.correct_count??row.correct_results??''].join('|'))
    })).filter(row=>row.name&&Number.isFinite(row.rank)&&row.rank>0);
  }

  function fingerprint(rows){
    return normalizeRows(rows).map(row=>`${normalizeName(row.name)}:${row.rank}:${row.metric}`).join(';');
  }

  function snapshot(rows){
    return Object.fromEntries(normalizeRows(rows).map(row=>[normalizeName(row.name),{rank:row.rank,metric:row.metric}]));
  }

  function nextState(previous,rows,forceRevision=false){
    const currentRows=normalizeRows(rows);
    const currentFingerprint=fingerprint(currentRows);
    if(previous&&previous.fingerprint===currentFingerprint&&!forceRevision){
      return {...previous,movement:previous.movement||{}};
    }

    const previousSnapshot=previous?.snapshot||{};
    const movement={};
    if(previous&&Object.keys(previousSnapshot).length){
      currentRows.forEach(row=>{
        const key=normalizeName(row.name);
        const before=previousSnapshot[key];
        if(!before)return;
        const delta=Number(before.rank)-Number(row.rank);
        if(delta>0)movement[key]={direction:'up',amount:delta};
        else if(delta<0)movement[key]={direction:'down',amount:Math.abs(delta)};
      });
    }

    return{fingerprint:currentFingerprint,snapshot:snapshot(currentRows),movement};
  }

  function read(key){
    try{
      const raw=root.localStorage?.getItem(PREFIX+key);
      return raw?JSON.parse(raw):null;
    }catch(_){return null}
  }

  function write(key,state){
    try{root.localStorage?.setItem(PREFIX+key,JSON.stringify(state))}catch(_){}
    return state;
  }

  function track(key,rows,forceRevision=false){
    const state=nextState(read(key),rows,forceRevision);
    write(key,state);
    return state;
  }

  function movementFor(state,name){return state?.movement?.[normalizeName(name)]||null}

  function badge(movement){
    if(!movement||!movement.amount)return'';
    const up=movement.direction==='up';
    const arrow=up?'▲':'▼';
    const cls=up?'bs-rank-up':'bs-rank-down';
    return ` <span class="bs-rank-move ${cls}" title="Önceki maç sonucuna göre ${movement.amount} sıra ${up?'yükseldi':'geriledi'}">${arrow} ${movement.amount}</span>`;
  }

  function rankHtml(rank,movement,medal=''){
    return `${medal}${rank}${badge(movement)}`;
  }

  function ensureStyles(doc=root.document){
    if(!doc||doc.getElementById('bizimSkorRankingMovementStyle'))return false;
    const style=doc.createElement('style');
    style.id='bizimSkorRankingMovementStyle';
    style.textContent='.bs-rank-move{display:inline-flex;align-items:center;margin-left:4px;font-size:11px;font-weight:900;white-space:nowrap;vertical-align:middle}.bs-rank-up{color:#16a34a}.bs-rank-down{color:#dc2626}html[data-theme="dark"] .bs-rank-up{color:#4ade80}html[data-theme="dark"] .bs-rank-down{color:#f87171}';
    doc.head.appendChild(style);
    return true;
  }

  return Object.freeze({normalizeName,normalizeRows,fingerprint,snapshot,nextState,track,movementFor,badge,rankHtml,ensureStyles});
});
