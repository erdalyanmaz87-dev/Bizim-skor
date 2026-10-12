const assert = require('node:assert/strict');
const test = require('node:test');
let arena;
try { arena = require('./skorbot-match-animation.js'); } catch (_) { arena = {}; }
test('every suggested score finishes exactly, including goalless and away wins', () => {
  assert.equal(typeof arena.plan, 'function');
  for (const [homeScore, awayScore] of [[3,2],[0,0],[0,3],[1,1],[20,20]]) {
    const events = arena.plan({homeScore, awayScore});
    assert.deepEqual(arena.scoreAt(events, 0), {homeScore:0, awayScore:0});
    assert.deepEqual(arena.scoreAt(events, 18), {homeScore, awayScore});
    assert(events.every(e => e.time > 0 && e.time < 18));
    for (let i=1;i<events.length;i++) assert(events[i].time>events[i-1].time);
  }
});
test('score changes once at each goal crossing and never before it', () => {
  const events = arena.plan({homeScore:3,awayScore:2});
  events.forEach((event, i) => {
    const before=arena.scoreAt(events,event.time-0.001), after=arena.scoreAt(events,event.time);
    assert.equal(before.homeScore+before.awayScore, i);
    assert.equal(after.homeScore+after.awayScore, i+1);
  });
});
test('invalid suggestions do not silently turn into another score', () => {
  for (const value of [{homeScore:-1,awayScore:0},{homeScore:1.5,awayScore:1},{homeScore:NaN,awayScore:0},{homeScore:21,awayScore:0}]) {
    assert.throws(()=>arena.plan(value));
  }
});
test('goals carry the correct team player, minute and running score',()=>{
  const events=arena.plan({homeScore:2,awayScore:1},{home:{players:['Ev oyuncusu']},away:{players:['Konuk oyuncusu']}});
  events.forEach((e,i)=>{assert.equal(e.scorer,e.side==='home'?'Ev oyuncusu':'Konuk oyuncusu');assert.equal(e.homeScore+e.awayScore,i+1);assert(e.minute>0&&e.minute<90);});
});
test('bank shot touches the wall twice before crossing into the goal',()=>{
  assert.equal(typeof arena.bankPath,'function');
  const path=arena.bankPath({x:-80,y:55,vx:123,vy:102},.7);
  assert.equal(path.length,4);
  for(const p of path.slice(1,3))assert(Math.abs(Math.hypot(p.x,p.y)-198)<.001);
  const end=arena.pointOnPath(path,1);assert(Math.abs(Math.hypot(end.x,end.y)-250)<.001);
  assert.deepEqual(arena.pointOnPath(path,0),path[0]);
});
