const test=require('node:test'),assert=require('node:assert/strict');
const cup=require('../cup-ui');
test('result changes refresh an active cup immediately and cleanup stops stale callbacks',()=>{
 let changes=0,active=true,removed=0,handler,subscription;
 const channel={on(event,filter,callback){assert.equal(event,'postgres_changes');assert.deepEqual(filter,{event:'*',schema:'public',table:'results'});handler=callback;return this},subscribe(callback){subscription=callback;return this}};
 const client={channel(){return channel},removeChannel(value){assert.equal(value,channel);removed++}};
 const stop=cup.watchResults(()=>changes++,client,()=>active);
 handler({eventType:'INSERT'});assert.equal(changes,1);
 handler({eventType:'UPDATE'});assert.equal(changes,2);
 active=false;handler({eventType:'DELETE'});assert.equal(changes,2);
 active=true;subscription('SUBSCRIBED');assert.equal(changes,3);
 stop();handler({eventType:'UPDATE'});subscription('SUBSCRIBED');assert.equal(changes,3);assert.equal(removed,1);
 stop();assert.equal(removed,1);
});
test('polling fallback survives unavailable realtime',()=>{
 const stop=cup.watchResults(()=>{},{});assert.equal(typeof stop,'function');stop();
});
