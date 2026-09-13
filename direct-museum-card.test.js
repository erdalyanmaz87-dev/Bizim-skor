const fs=require('fs');
const museum=fs.readFileSync('player-museum.js','utf8');
if(!museum.includes('async function openMuseum'))throw Error('museum module must expose direct openMuseum');
if(!museum.includes("open.id==='bsHeaderMuseumAction'"))throw Error('header museum action must be intercepted before profile routing');
if(!museum.includes('e.stopImmediatePropagation()'))throw Error('old profile-first header route must be stopped');
if(!museum.includes('await openMuseum(name,doc)'))throw Error('header museum must open museum directly');
if(!museum.includes('id=\'bsPlayerMuseumModal\'')&&!museum.includes("id='bsPlayerMuseumModal'")&&!museum.includes('bsPlayerMuseumModal'))throw Error('museum needs its own modal shell');
if(!museum.includes('data-player-museum-close'))throw Error('direct museum needs its own close action');
console.log('direct museum contract ok');
