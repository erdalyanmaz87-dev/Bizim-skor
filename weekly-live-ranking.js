(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 else{root.BizimSkorWeeklyLiveRanking=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const boards={weeklyRankingBoard:'super_lig',championsWeeklyRankingBoard:'champions_league',nationsWeeklyRankingBoard:'nations_league'};
 const interval=30000,state=new WeakMap();
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const columns=[['🎯','Tam skor','exact_count'],['🥅','Sonuç + fark','difference_hits'],['🔢','Sonuç + toplam','total_hits'],['✅','Sadece sonuç','result_hits']];
 function context(board){
  if(!boards[board?.id])return null;
  try{const c=JSON.parse(board.dataset.scoringContext||'null');return c&&c.competition===boards[board.id]&&Number.isInteger(Number(c.week))&&Number(c.week)>0?{competition:c.competition,season:c.season||'2026/27',week:Number(c.week)}:null;}catch(_){return null;}
 }
 function visible(board){return !!board?.getClientRects?.().length&&root.document?.visibilityState!=='hidden';}
 function markup(data,c){
  const cols=data.has_new_scoring?columns:[columns[0],['⚽','Doğru sonuç','correct_count']];
  const kind=c.competition==='champions_league'?'champions':c.competition==='nations_league'?'nations':'super';
  const label=data.live?'<div class="bs-weekly-live-indicator" role="status" aria-live="polite">🔴 Canlı</div>':'';
  const rows=data.players||[];
  if(!rows.length)return label+'<p class="small">Henüz puan oluşmadı.</p>';
  return label+'<table data-weekly-live="1" data-scoring-checked="1"'+(data.has_new_scoring?' class="bs-scoring-table"':'')+'><tr><th>Sıra</th><th>Katılımcı</th><th>Puan</th>'+cols.map(x=>'<th scope="col" title="'+esc(x[1])+'">'+x[0]+'</th>').join('')+'</tr>'+rows.map(r=>{
   const rank=Number(r.league_rank),medal=rank===1?'🥇 ':rank===2?'🥈 ':rank===3?'🥉 ':'';
   return '<tr><td>'+medal+rank+'</td><td><button type="button" class="bs-player-profile-link" data-player-name="'+esc(r.player_name)+'" data-profile-week="'+c.week+'" data-profile-kind="'+kind+'">'+esc(r.player_name)+'</button></td><td><b>'+Number(r.points||0)+'</b></td>'+cols.map(x=>'<td title="'+esc(x[1])+'">'+Number(r[x[2]]||0)+'</td>').join('')+'</tr>';
  }).join('')+'</table>';
 }
 async function refreshBoard(board,force=false){
  const c=context(board),table=board?.querySelector?.('table');if(!c||!table||!visible(board)||!root.sb?.rpc)return;
  const key=JSON.stringify(c),token=root.localStorage?.getItem('bizimSkorFriendToken')||null;
  if(c.competition!=='super_lig'&&!token)return;
  let s=state.get(board);if(!s){s={};state.set(board,s);}
  if(s.pending||(!force&&s.table===table&&s.key===key&&s.token===token&&Date.now()-s.at<interval))return;
  s.pending=true;
  try{
   const q=await root.sb.rpc('get_live_weekly_ranking',{p_competition:c.competition,p_season:c.season,p_week:c.week,p_token:token});
   if(q.error)throw q.error;
   if(!q.data||!Array.isArray(q.data.players))throw new Error('Haftalık canlı puan yanıtı geçersiz');
   // Never paint a response into another selected week, a hidden board or a newer render.
   if(!visible(board)||JSON.stringify(context(board))!==key||board.querySelector('table')!==table||token!==(root.localStorage?.getItem('bizimSkorFriendToken')||null))return;
   const signature=JSON.stringify(q.data);
   if(s.signature!==signature||s.table!==table){
    const scroll=board.closest?.('.bs-screen-content'),top=scroll?.scrollTop,ownTop=board.scrollTop;
    board.innerHTML=markup(q.data,c);
    if(scroll)scroll.scrollTop=top;board.scrollTop=ownTop;
    root.BizimSkorPlayerProfile?.decorateAll?.();
    root.BizimSkorFindMyRanking?.refresh?.();
   }
   Object.assign(s,{key,token,signature,table:board.querySelector('table'),at:Date.now()});
  }catch(error){
   s.signature=null;
   const label=board.querySelector('.bs-weekly-live-indicator');
   if(label){label.textContent='🔴 Canlı · Güncellenemedi';label.title='Son alınan skorlar gösteriliyor.';}
   console.warn('weekly live ranking',error);
  }finally{s.pending=false;}
 }
 function acceptSnapshot(board,data){
  const c=context(board);if(!c)return;
  state.set(board,{key:JSON.stringify(c),token:root.localStorage?.getItem('bizimSkorFriendToken')||null,signature:JSON.stringify(data),table:board.querySelector('table'),at:Date.now(),pending:false});
 }
 function refresh(force=false){
  if(root.document?.visibilityState==='hidden')return;
  return Promise.all(Object.keys(boards).map(id=>refreshBoard(root.document?.getElementById(id),force)));
 }
 function mount(){
  const doc=root.document;if(!doc||doc.__weeklyLiveRankingMounted)return;doc.__weeklyLiveRankingMounted=true;
  const start=()=>{
   const style=doc.createElement('style');style.textContent='.bs-weekly-live-indicator{display:inline-flex;align-items:center;margin:0 0 10px;padding:5px 10px;border-radius:999px;font-size:12px;font-weight:800;color:#b91c1c;background:#fee2e2}html[data-theme="dark"] .bs-weekly-live-indicator{color:#fca5a5;background:#451a1a}';doc.head.appendChild(style);
   let timer=null;
   const schedule=()=>{if(timer!==null)return;timer=root.setTimeout(()=>{timer=null;refresh();},60);};
   const observer=new root.MutationObserver(records=>{
    const hosts=Object.keys(boards).map(id=>doc.getElementById(id)).filter(Boolean);
    if(records.some(r=>hosts.some(b=>r.target===b||r.target?.contains?.(b))))schedule();
   });
   observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','data-scoring-context']});
   doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState!=='hidden')refresh(true);});
   root.setInterval(()=>refresh(true),interval);
   schedule();
  };
  if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',start,{once:true});else start();
 }
 return {boards,interval,context,markup,refreshBoard,acceptSnapshot,refresh,mount};
});
