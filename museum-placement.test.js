const fs=require('fs');
const s=fs.readFileSync('player-museum.js','utf8');
if(!s.includes('bs-profile-title-row'))throw Error('missing title row');
if(!s.includes('.bs-profile-head .bs-profile-museum-open'))throw Error('museum button must override profile head button styles');
if(!s.includes('width:auto!important'))throw Error('museum button width must not inherit round close-button width');
if(!s.includes('height:auto!important'))throw Error('museum button height must not inherit round close-button height');
if(!s.includes('border-radius:999px!important'))throw Error('museum button must render as compact pill');
console.log('ok');
