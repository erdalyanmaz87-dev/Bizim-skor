const {test}=require('node:test');
const assert=require('node:assert/strict');
const ui=require('./prediction-week-cards');
test('status rounds from all competitions follow first kickoff order',()=>{
  const cards=ui.buildCards([
    {week:8,deadline:'2026-10-16T17:00:00Z',complete:true},
    {week:9,deadline:'2026-10-23T17:00:00Z'},
    {week:10,deadline:'2026-10-30T17:00:00Z'}
  ],[
    {week:3,deadline:'2026-10-20T16:45:00Z'},
    {week:4,deadline:'2026-11-03T17:45:00Z'}
  ],[{week:5,deadline:'2026-11-12T19:45:00Z'}]);
  assert.deepEqual(cards.map(c=>[c.target.type,c.target.week]),[['league',8],['champions',3],['league',9],['league',10],['champions',4],['nations',5]]);
  assert.equal(cards[0].complete,true);
});
test('undated rounds appear last and equal kickoff order stays stable',()=>{
  const cards=ui.buildCards([{week:8},{week:9,deadline:'2026-11-01T17:00:00Z'}], [{week:3,deadline:'2026-11-01T17:00:00Z'}]);
  assert.deepEqual(cards.map(c=>[c.target.type,c.target.week]),[['league',9],['champions',3],['league',8]]);
});
