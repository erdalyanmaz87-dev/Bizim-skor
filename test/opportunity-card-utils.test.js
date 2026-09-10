const test=require('node:test');
const assert=require('node:assert/strict');
const Card=require('../opportunity-card-utils');

test('sonucu kesinleşen fırsat maçı ilan listesinden çıkar ama tanımdan silinmez',()=>{
  const rows=Card.activeMatches(new Set(['champions:3']));
  assert.equal(rows.some(x=>x.key==='champions:3'),false);
  assert.equal(Card.MATCHES.some(x=>x.key==='champions:3'),true);
});

test('oynanmamış Süper Lig ve Uluslar Ligi fırsatları listede kalır',()=>{
  const rows=Card.activeMatches(new Set(['champions:3']));
  assert.equal(rows.some(x=>x.key==='super:44'),true);
  assert.equal(rows.some(x=>x.key==='super:49'),true);
  assert.equal(rows.some(x=>x.key==='nations:9006'),true);
  assert.equal(rows.some(x=>x.key==='nations:9014'),true);
});

test('aktif fırsatlar tarih sırasıyla döner',()=>{
  const rows=Card.activeMatches(new Set(['champions:3']));
  assert.deepEqual(rows.map(x=>x.key),['super:44','super:49','nations:9006','nations:9014']);
});
