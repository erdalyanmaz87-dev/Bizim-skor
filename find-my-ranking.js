(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorFindMyRanking=api;api.mount()}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const BOARD_IDS=['weeklyRankingBoard','sezuBoard','generalBoard','championsRankingBoard','friendLeagueRanking'];

  function normalizePlayer(value){
    return String(value||'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr-TR')
      .replace(/ı/g,'i').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }

  function samePlayer(left,right){return !!normalizePlayer(left)&&normalizePlayer(left)===normalizePlayer(right)}
  function rankingBoardIds(){return BOARD_IDS.slice()}

  function findPlayerRow(board,playerName){
    if(!board||!playerName)return null;
    return Array.from(board.querySelectorAll?.('table tr')||[])
      .find(row=>row.cells?.[1]&&samePlayer(row.cells[1].textContent,playerName))||null;
  }

  function shouldShowButton(playerName,row){return !!String(playerName||'').trim()&&!!row}
  function toolbarId(board){return `bsFindMe-${board.id}`}

  function focusPlayerRow(row,schedule=root.setTimeout?.bind(root)){
    if(!row)return false;
    row.classList.add('bs-my-ranking-row');
    row.scrollIntoView?.({behavior:'smooth',block:'center'});
    schedule?.(()=>row.classList.remove('bs-my-ranking-row'),1800);
    return true;
  }

  function removeToolbar(board){
    const doc=board?.ownerDocument||root?.document;
    doc?.getElementById?.(toolbarId(board))?.remove?.();
  }

  function enhanceBoard(board,playerName){
    if(!board)return false;
    const row=findPlayerRow(board,playerName);
    const doc=board.ownerDocument||root.document,id=toolbarId(board);
    if(doc.getElementById(id))return true;
    const toolbar=doc.createElement('div');
    toolbar.id=id;toolbar.className='bs-find-me-toolbar';
    const homeButton=doc.createElement('button');
    homeButton.type='button';homeButton.className='bs-ranking-home-button';homeButton.textContent='🏠 Ana Menü';
    homeButton.addEventListener('click',()=>{
      doc.querySelector?.('.tab[data-tab="home"]')?.click?.();
      root.setTimeout?.(()=>root.scrollTo?.({top:0,behavior:'smooth'}),0);
    });
    toolbar.appendChild(homeButton);
    if(shouldShowButton(playerName,row)){
      const button=doc.createElement('button');
      button.type='button';button.className='bs-find-me-button';button.textContent='🎯 Kendimi Gör';
      button.addEventListener('click',()=>{
        const current=findPlayerRow(board,root.localStorage?.getItem('bizimSkorName')||playerName);
        focusPlayerRow(current);
      });
      toolbar.appendChild(button);
    }
    board.insertAdjacentElement('beforebegin',toolbar);
    return true;
  }

  function ensureStyles(){
    const doc=root?.document;if(!doc||doc.getElementById('bsFindMyRankingStyles'))return;
    const style=doc.createElement('style');style.id='bsFindMyRankingStyles';
    style.textContent='.bs-find-me-toolbar{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:8px 0}.bs-find-me-toolbar>button{min-height:40px;border-radius:999px;padding:9px 12px;font-size:12px;font-weight:900}.bs-ranking-home-button{border:1px solid #cbd5e1;background:#fff;color:#0f172a;box-shadow:0 3px 9px rgba(15,23,42,.08)}.bs-find-me-button{border:0;background:#2563eb;color:#fff;box-shadow:0 4px 10px rgba(37,99,235,.24)}.bs-find-me-toolbar>button:active{transform:translateY(1px)}tr.bs-my-ranking-row>td{background:#dbeafe!important;box-shadow:inset 0 2px #2563eb,inset 0 -2px #2563eb;transition:background .2s ease}tr.bs-my-ranking-row>td:first-child{box-shadow:inset 2px 0 #2563eb,inset 0 2px #2563eb,inset 0 -2px #2563eb}tr.bs-my-ranking-row>td:last-child{box-shadow:inset -2px 0 #2563eb,inset 0 2px #2563eb,inset 0 -2px #2563eb}';
    doc.head.appendChild(style);
  }

  function refresh(){
    const doc=root?.document;if(!doc)return;
    const playerName=root.localStorage?.getItem('bizimSkorName')||'';
    BOARD_IDS.forEach(id=>{const board=doc.getElementById(id);if(board)enhanceBoard(board,playerName)});
  }

  function mount(){
    if(!root?.document)return;
    const start=()=>{ensureStyles();refresh();BOARD_IDS.forEach(id=>{const board=root.document.getElementById(id);if(board&&typeof MutationObserver!=='undefined')new MutationObserver(refresh).observe(board,{childList:true,subtree:true})});root.document.addEventListener('click',()=>root.setTimeout?.(refresh,80));root.addEventListener?.('bizimskor:session-ready',refresh);root.addEventListener?.('focus',refresh)};
    if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  }

  return Object.freeze({normalizePlayer,samePlayer,rankingBoardIds,findPlayerRow,shouldShowButton,focusPlayerRow,enhanceBoard,refresh,mount});
});
