const {test}=require('node:test');
const assert=require('node:assert/strict');
const weeks=require('./two-week-predictions-utils');
const cards=require('./prediction-week-cards');
test('week 8 remains visible after newer fixtures are published and after its matches end',()=>{
  const fixtures=[7,8,9,10].map(week=>({week,kickoff:'2026-10-16T17:00:00Z'}));
  assert.deepEqual(weeks.selectVisibleWeeks(fixtures,2,Date.parse('2026-11-01')), [8,9,10]);
  assert.deepEqual(weeks.selectVisibleWeeks([...fixtures,{week:11}],2),[8,10,11]);
});
test('status cards preserve every week supplied by the visible-week policy',()=>{
  const result=cards.buildCards([8,9,10].map(week=>({week,complete:true})),null);
  assert.deepEqual(result.map(card=>card.target.week),[8,9,10]);
  assert.ok(cards.render(result).includes('Süper Lig 8. Hafta'));
});
test('pinning a started week does not unlock predictions or expose older unpinned weeks',()=>{
  assert.equal(weeks.isWeekLocked([{week:8,kickoff:'2026-10-16T17:00:00Z'}],8,Date.parse('2026-10-18')),true);
  assert.deepEqual(weeks.selectVisibleWeeks([{week:5},{week:6},{week:7}]),[6,7]);
  assert.deepEqual(weeks.selectVisibleWeeks([]),[]);
});
