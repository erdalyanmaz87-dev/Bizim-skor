const test=require('node:test');
const assert=require('node:assert/strict');
const fix=require('./champions-stats-logo-fix.js');

test('hafta seçicinin çizdiği satırdan fikstür id okunur',()=>{
  const row={querySelector(selector){return selector.includes('clh')?{id:'clh207'}:null}};
  assert.equal(fix.fixtureIdFromRow(row),207);
});

test('ekranda eksik görünen Şampiyonlar Ligi logolarının doğrulanmış adresleri vardır',()=>{
  assert.match(fix.logoUrlForTeam('Sabah'),/raw\.githubusercontent\.com\/JoseArroyave\/football-logos\/main\/logos\/azerbaijan\/Sabah\.svg/);
  assert.match(fix.logoUrlForTeam('Slavia Prag'),/raw\.githubusercontent\.com\/JoseArroyave\/football-logos\/main\/logos\/czech-republic\/SK_Slavia_Praha\.svg/);
});
