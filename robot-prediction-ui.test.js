const assert=require('assert');
const fs=require('fs');
const source=fs.readFileSync('./robot-prediction-ui.js','utf8');
assert.ok(source.includes('.match-stats-button{grid-column:1/3!important;width:100%!important'));
assert.ok(source.includes('.robot-prediction-button{grid-column:4/6;width:100%'));
assert.ok(source.includes('justify-self:stretch'));
assert.ok(source.includes('align-self:center'));
console.log('robot prediction button alignment ok');
