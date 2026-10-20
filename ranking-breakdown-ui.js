(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorRankingBreakdown=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
'use strict';
const columns=[{icon:'🎯',label:'Tam skor',points:10,key:'exact_hits'},{icon:'🥅',label:'Sonuç + fark',points:6,key:'difference_hits'},{icon:'🔢',label:'Sonuç + toplam',points:4,key:'total_hits'},{icon:'✅',label:'Sadece sonuç',points:2,key:'result_hits'}];
const boardIds=['weeklyRankingBoard','generalBoard','championsWeeklyRankingBoard','championsRankingBoard','nationsWeeklyRankingBoard','nationsRankingBoard','friendLeagueRanking'];
const cache=new Map(),pending=new WeakSet();let scheduled=false,legend=null;
const normalize=s=>String(s||'').trim().replace(/\s*•\s*Sen\s*$/i,'').replace(/\s+/g,' ').toLocaleLowerCase('tr-TR');
function category(p,r){const scoring=typeof module==='object'&&module.exports?require('./scoring-version-utils.js'):root.BizimSkorScoring;return ({10:'exact_hits',6:'difference_hits',4:'total_hits',2:'result_hits'})[scoring.basePoints(p,r,2)]||null;}
function requestArgs(c,token){return {p_competition:c.competition,p_season:c.season||'2026/27',p_week:c.week||null,p_friend_league_id:c.friendLeagueId||null,p_token:c.friendLeagueId?token:null};}
function contextKey(c){return JSON.stringify([c.competition,c.season||'2026/27',c.week||null,c.friendLeagueId||null]);}
function legendMarkup(){return `<div class="bs-scoring-legend-grid">${columns.map(c=>`<div><span>${c.icon}</span><b>${c.points} puan</b><small>${c.label}</small></div>`).join('')}</div><p>Fırsat maçı: tüm puanlar ×2</p><small class="bs-scoring-history-note">🎯 tüm dönem · 🥅 🔢 ✅ 20 Ekim'den itibaren · Sayılar maç adedidir.</small>`;}
function visible(el){return !!el?.getClientRects().length;}
function context(board){try{return JSON.parse(board.dataset.scoringContext||'null');}catch(_){return null;}}
async function fetchCounts(c){const token=root.localStorage?.getItem('bizimSkorFriendToken')||null,key=contextKey(c)+(c.friendLeagueId?':'+(token||''):''),old=cache.get(key);if(old&&Date.now()-old.at<15000)return old.promise;const promise=root.sb.rpc('get_scoring_breakdown',requestArgs(c,token)).then(q=>{if(q.error)throw q.error;return q.data;}).catch(e=>{cache.delete(key);throw e;});cache.set(key,{at:Date.now(),promise});return promise;}
function decorate(table,data){if(!data?.has_new_scoring||table.classList.contains('bs-scoring-table'))return false;const rows=[...table.rows];if(!rows.length||rows[0].cells.length<4)return false;
 for(const [index,row] of rows.entries()){
  if(row.cells.length<4)continue;
  const player=normalize(row.cells[1].querySelector('[data-player-name]')?.dataset.playerName||row.cells[1].textContent);
  const counts=(data.players||[]).find(p=>normalize(p.player_name)===player)||{};
  // Keep the existing exact-score count across historical and new rules.
  const exact=row.cells[3].textContent;
  while(row.cells.length>3)row.deleteCell(3);
  columns.forEach((c,i)=>{const cell=document.createElement(index===0?'th':'td');cell.textContent=index===0?c.icon:i===0?exact:String(Number(counts[c.key])||0);cell.className='bs-score-'+c.key;cell.title=index===0?`${c.label}: ${c.points} puan (${c.points*2} fırsat)`:`${c.label}: ${cell.textContent} maç`;if(index===0){cell.scope='col';cell.setAttribute('aria-label',cell.title);}row.appendChild(cell);});
 }
 table.classList.add('bs-scoring-table');return true;
}
async function refreshBoard(board){const table=board.querySelector('table'),c=context(board);if(!table||!c||table.dataset.scoringChecked||pending.has(table))return;pending.add(table);const key=contextKey(c);try{const data=await fetchCounts(c);if(board.querySelector('table')!==table||contextKey(context(board)||{})!==key)return;table.dataset.scoringChecked='1';decorate(table,data);syncLegend();}catch(e){console.warn('ranking breakdown',e);}finally{pending.delete(table);}}
function syncLegend(){if(!legend)return;const active=boardIds.map(id=>document.getElementById(id)).find(b=>visible(b)&&b.querySelector('.bs-scoring-table'));if(legend.hidden===!!active)legend.hidden=!active;if(document.body.classList.contains('bs-scoring-legend-open')!==!!active)document.body.classList.toggle('bs-scoring-legend-open',!!active);if(!active)return;
 const nav=document.getElementById('bsSimpleBottomNav'),layer=active.closest('.bs-screen-layer');
 // Full-screen ranking layers cover the main navigation; ordinary pages sit above it.
 const bottom=layer?0:(visible(nav)?nav.getBoundingClientRect().height:0);
 if(legend.style.bottom!==bottom+'px')legend.style.bottom=bottom+'px';
 const space=legend.getBoundingClientRect().height+bottom+16;
 if(document.documentElement.style.getPropertyValue('--bs-scoring-reserve')!==space+'px')document.documentElement.style.setProperty('--bs-scoring-reserve',space+'px');
 document.querySelectorAll('.bs-scoring-scroll').forEach(el=>{if(!el.contains(active))el.classList.remove('bs-scoring-scroll');});
 const scroll=active.closest('.bs-screen-content')||active;if(!scroll.classList.contains('bs-scoring-scroll'))scroll.classList.add('bs-scoring-scroll');
}
function refresh(){scheduled=false;for(const id of boardIds){const b=document.getElementById(id);if(visible(b))refreshBoard(b);}syncLegend();}
function schedule(){if(!scheduled){scheduled=true;root.setTimeout(refresh,40);}}
function affectsRankings(record){
 const target=record.target?.nodeType===1?record.target:record.target?.parentElement;if(!target||legend?.contains(target)||target===legend)return false;
 const boards=boardIds.map(id=>document.getElementById(id)).filter(Boolean);
 if(record.type==='attributes')return boards.some(b=>b===target||b.contains(target)||target.contains(b));
 if(boards.some(b=>b===target||b.contains(target)))return true;
 const selector=boardIds.map(id=>'#'+id).join(',');
 return [...(record.addedNodes||[]),...(record.removedNodes||[])].some(n=>n.nodeType===1&&(boardIds.includes(n.id)||n.querySelector(selector)));
}
function mount(){if(typeof document==='undefined')return;legend=document.createElement('aside');legend.id='bsScoringLegend';legend.hidden=true;legend.setAttribute('aria-label','Puan simgeleri açıklaması');legend.innerHTML=legendMarkup();document.body.appendChild(legend);
 new MutationObserver(records=>{if(records.some(affectsRankings))schedule();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','data-scoring-context']});
 root.addEventListener('resize',schedule);document.addEventListener('visibilitychange',schedule);document.addEventListener('click',schedule);schedule();
}
return {columns,category,requestArgs,contextKey,legendMarkup,decorate,refreshBoard,syncLegend,mount};
});
