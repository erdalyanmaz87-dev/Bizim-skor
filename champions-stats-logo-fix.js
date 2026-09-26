(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorChampionsStatsLogoFix=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const LOGOS={
    'sabah':'https://raw.githubusercontent.com/JoseArroyave/football-logos/main/logos/azerbaijan/Sabah.svg',
    'slavia prag':'https://raw.githubusercontent.com/JoseArroyave/football-logos/main/logos/czech-republic/SK_Slavia_Praha.svg'
  };
  const key=v=>String(v||'').trim().toLocaleLowerCase('tr-TR');
  function fixtureIdFromRow(row){const input=row?.querySelector?.('input[id^="clh"],input[id^="cla"]');const m=String(input?.id||'').match(/cl[ha](\d+)/);return m?Number(m[1]):null}
  function logoUrlForTeam(name){return LOGOS[key(name)]||null}
  function injectStatistics(){const api=root.BizimSkorMatchStatistics,doc=root.document;if(!api||!doc)return;doc.querySelectorAll('#championsFixtures .champions-match').forEach(row=>{if(row.querySelector('[data-match-statistics]'))return;const fixtureId=fixtureIdFromRow(row);if(!fixtureId)return;const button=doc.createElement('button');button.type='button';button.className='match-stats-button';button.dataset.matchStatistics=String(fixtureId);button.textContent='📊 Maç İstatistikleri';button.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();api.open(fixtureId,'champions')});row.appendChild(button)})}
  function replaceFallbackLogos(){const doc=root.document;if(!doc)return;doc.querySelectorAll('#championsFixtures .bs-team-brand').forEach(brand=>{const name=brand.querySelector('.bs-team-name')?.textContent?.trim();const url=logoUrlForTeam(name);if(!url)return;let img=brand.querySelector('img.bs-team-logo');const fallback=brand.querySelector('.bs-team-fallback');if(!img){img=doc.createElement('img');img.className='bs-team-logo';img.alt='';img.loading='eager';img.decoding='async';brand.insertBefore(img,brand.firstChild)}if(img.dataset.bsVerifiedLogo===url)return;img.dataset.bsVerifiedLogo=url;img.hidden=false;img.src=url;if(fallback)fallback.hidden=true})}
  function refresh(){root.BizimSkorBrandVisualUI?.decorate?.();injectStatistics();replaceFallbackLogos()}
  function refreshBurst(){[0,120,350,800].forEach(delay=>root.setTimeout?.(refresh,delay))}
  function mount(){const doc=root.document;if(!doc)return;refreshBurst();doc.addEventListener('change',event=>{if(event.target?.id==='championsPredictionWeekSelect')refreshBurst()});root.addEventListener?.('bizimskor:champions-prediction-opened',refreshBurst);root.addEventListener?.('focus',()=>{if(!doc.getElementById('championsPred')?.classList.contains('hide'))refreshBurst()})}
  return Object.freeze({fixtureIdFromRow,logoUrlForTeam,injectStatistics,replaceFallbackLogos,refresh,refreshBurst,mount});
});
