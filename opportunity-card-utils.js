(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorOpportunityCard=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const MATCHES=[
    {key:'super:44',competition:'super',label:'🇹🇷 Süper Lig 5. Hafta',home:'Galatasaray',away:'Kocaelispor',kickoff:'2026-09-12T17:00:00Z'},
    {key:'super:49',competition:'super',label:'🇹🇷 Süper Lig 6. Hafta',home:'Trabzonspor',away:'Galatasaray',kickoff:'2026-09-19T17:00:00Z'},
    {key:'champions:3',competition:'champions',label:'⭐ Şampiyonlar Ligi 1. Hafta',home:'Real Madrid',away:'Inter',kickoff:'2026-09-10T19:00:00Z'},
    {key:'nations:9006',competition:'nations',label:'🌍 Uluslar Ligi 1. Hafta',home:'Türkiye',away:'Fransa',kickoff:'2026-09-25T18:45:00Z'},
    {key:'nations:9014',competition:'nations',label:'🌍 Uluslar Ligi 2. Hafta',home:'Türkiye',away:'İtalya',kickoff:'2026-09-28T18:45:00Z'}
  ];
  function activeMatches(completedKeys){const done=completedKeys||new Set();return MATCHES.filter(x=>!done.has(x.key)).sort((a,b)=>new Date(a.kickoff)-new Date(b.kickoff))}
  function renderLines(rows){return (rows||[]).map(x=>`<div class="opp-line" data-opp-key="${x.key}"><span class="opp-league">${x.label}</span><span>${x.home} – ${x.away}</span><span class="opp-badge">X2</span></div>`).join('')}
  return Object.freeze({MATCHES,activeMatches,renderLines});
});
