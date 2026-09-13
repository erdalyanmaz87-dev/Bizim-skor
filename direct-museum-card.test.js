const fs=require('fs');
const header=fs.readFileSync('header-ui.js','utf8');
const museum=fs.readFileSync('player-museum.js','utf8');
if(header.includes('BizimSkorPlayerProfile.openProfile(clean,doc)'))throw Error('header museum must not open player profile first');
if(!header.includes('BizimSkorPlayerMuseum?.openMuseum'))throw Error('header museum must call museum directly');
if(!museum.includes('async function openMuseum'))throw Error('museum module must expose direct openMuseum');
if(!museum.includes('data-player-museum-close'))throw Error('direct museum needs its own close action');
console.log('direct museum contract ok');
