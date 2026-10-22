const test=require('node:test');
const assert=require('node:assert/strict');
const fix=require('./champions-stats-logo-fix.js');

test('hafta seçicinin çizdiği satırdan fikstür id okunur',()=>{
  const row={querySelector(selector){return selector.includes('clh')?{id:'clh207'}:null}};
  assert.equal(fix.fixtureIdFromRow(row),207);
});

test('ekranda eksik görünen Şampiyonlar Ligi logolarının doğrulanmış adresleri vardır',()=>{
  assert.equal(fix.logoUrlForTeam('Sabah'),'assets/team-logos/sabah.png');
  assert.equal(fix.logoUrlForTeam('Slavia Prag'),'assets/team-logos/slavia-praha.png');
});
