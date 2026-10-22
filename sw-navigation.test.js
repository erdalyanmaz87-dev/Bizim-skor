const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function worker(fetch, cached){
 const listeners={};
 vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{importScripts(){},Response,fetch,caches:{match:async()=>cached},self:{addEventListener:(name,fn)=>listeners[name]=fn}});
 return async(mode='navigate')=>{let promise;listeners.fetch({request:{method:'GET',mode},respondWith:p=>promise=p});return promise};
}
test('navigation retries a transient network failure before returning the page',async()=>{
 let calls=0;const page=new Response('app');const navigate=worker(async()=>{if(++calls===1)throw Error('network');return page});
 assert.equal(await navigate(),page);assert.equal(calls,2);
});
test('uncached failed navigation returns a readable recovery page instead of undefined',async()=>{
 const response=await worker(async()=>{throw Error('offline')})();
 assert.ok(response instanceof Response);assert.equal(response.status,503);assert.match(response.headers.get('Content-Type'),/text\/html/);assert.match(await response.text(),/Tekrar dene/);
});
test('cached response is used when navigation remains unavailable',async()=>{
 const cached=new Response('cached');assert.equal(await worker(async()=>{throw Error('offline')},cached)(),cached);
});
test('successful network response passes through without retries',async()=>{
 let calls=0;const page=new Response('app');assert.equal(await worker(async()=>{calls++;return page})(),page);assert.equal(calls,1);
});
test('failed asset request returns a valid error response',async()=>{
 const response=await worker(async()=>{throw Error('offline')})('cors');assert.ok(response instanceof Response);assert.equal(response.type,'error');
});
