const test=require('node:test');
const assert=require('node:assert/strict');
const loader=require('./ui-integration-loader');

test('syntax-invalid one-time unlock script is not loaded at startup',()=>{
  assert.equal(loader.criticalScripts.includes('super-league-one-time-unlock.js'),false,
    'syntax-invalid super-league-one-time-unlock.js must not be in startup loader');
});
