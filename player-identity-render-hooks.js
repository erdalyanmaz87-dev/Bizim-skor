(function(root){
  const identity=(name,suffix='')=>root.BizimSkorPlayerIdentity?.markup?.(name,{suffix})||String(name??'');
  function decorateElement(el,name,suffix=''){
    if(!el||!name||el.querySelector?.(':scope > .bs-player-identity'))return false;
    el.innerHTML=identity(name,suffix);return true;
  }
  function decorateTable(rootEl){
    rootEl?.querySelectorAll?.('table').forEach(table=>{
      const heads=[...table.querySelectorAll('tr:first-child th')],idx=heads.findIndex(h=>['oyuncu','katılımcı'].includes(String(h.textContent||'').trim().toLocaleLowerCase('tr-TR')));if(idx<0)return;
      [...table.querySelectorAll('tr')].slice(1).forEach(row=>{const cell=row.children?.[idx];if(!cell)return;const marked=cell.querySelector?.('[data-player-name]'),name=marked?.dataset?.playerName||cell.textContent?.trim();if(marked)decorateElement(marked,name);else decorateElement(cell,name)});
    });
  }
  function decorateKnownScreens(){
    ['weeklyRankingBoard','generalBoard','friendLeagueRanking','championsRankingBoard','championsWeeklyRankingBoard','nationsRankingBoard'].forEach(id=>decorateTable(document.getElementById(id)));
    document.querySelectorAll('#leagueSystemPanel .league-player').forEach(el=>{if(el.querySelector('.bs-player-identity'))return;const text=String(el.textContent||'').trim(),isMe=/^Sen\s*•/i.test(text),name=text.replace(/^Sen\s*•\s*/i,'').trim();if(name)el.innerHTML=`${isMe?'<b>Sen • </b>':''}${identity(name)}`});
    document.querySelectorAll('#bsPlayerMuseumModal .bs-museum-head h2,#bsPlayerProfileModal .bs-museum-head h2').forEach(el=>{if(el.querySelector('.bs-player-identity'))return;const name=String(el.textContent||'').replace(/^🏛️\s*/,'').trim();if(name)el.innerHTML=`🏛️ ${identity(name)}`});
  }
  function wrapGlobal(name,after){const original=root[name];if(typeof original!=='function'||original.__playerIdentityWrapped)return;const wrapped=function(...args){const value=original.apply(this,args);after?.(...args);return value};wrapped.__playerIdentityWrapped=true;root[name]=wrapped}
  wrapGlobal('renderScoreTable',(targetId)=>decorateTable(document.getElementById(targetId)));
  wrapGlobal('renderPlayerPredictions',(targetId)=>{const box=document.getElementById(targetId);box?.querySelectorAll?.('.pc>b').forEach(el=>{if(el.querySelector('.bs-player-identity'))return;const text=String(el.textContent||'').trim(),isMe=/\s*•\s*Sen$/i.test(text),name=text.replace(/\s*•\s*Sen$/i,'').trim();if(name)el.innerHTML=identity(name,isMe?' • Sen':'')})});
  wrapGlobal('renderFriendLeagueRanking',()=>decorateTable(document.getElementById('friendLeagueRanking')));
  wrapGlobal('renderFriendLeaguePredictions',()=>{document.querySelectorAll('#friendLeaguePredictions .pc>b').forEach(el=>{if(el.querySelector('.bs-player-identity'))return;const text=String(el.textContent||'').trim(),isMe=/\s*•\s*Sen$/i.test(text),name=text.replace(/\s*•\s*Sen$/i,'').trim();if(name)el.innerHTML=identity(name,isMe?' • Sen':'')})});
  function wrapApi(api,key){if(!api||typeof api[key]!=='function'||api[key].__playerIdentityWrapped)return;const original=api[key];const wrapped=async function(...args){const value=await original.apply(this,args);decorateKnownScreens();return value};wrapped.__playerIdentityWrapped=true;try{api[key]=wrapped}catch(_){}}
  ['loadRanking','loadChampionsWeeklyRanking'].forEach(k=>wrapApi(root.BizimSkorChampionsUI,k));
  ['loadRanking','openRanking'].forEach(k=>wrapApi(root.BizimSkorNationsUI,k));
  document.addEventListener('click',event=>{if(event.target?.closest?.('.tab,[data-tab],[data-league-open],[data-league-code],[data-player-museum-open],#openPlayerMuseum')){setTimeout(decorateKnownScreens,80);setTimeout(decorateKnownScreens,350)}},true);
  root.addEventListener?.('supported-team:saved',()=>setTimeout(decorateKnownScreens,80));
  setTimeout(decorateKnownScreens,100);
})(typeof globalThis!=='undefined'?globalThis:this);
