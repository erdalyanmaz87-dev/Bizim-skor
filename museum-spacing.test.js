const fs=require('fs');
const s=fs.readFileSync('player-museum.js','utf8');
if(!s.includes('gap:20px'))throw Error('museum button should sit about one card-padding to the right of player name');
if(!s.includes('flex-wrap:wrap'))throw Error('long player names must not be covered by museum button');
console.log('museum spacing ok');
