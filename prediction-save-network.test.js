const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
function setup(){
 const storage=new Map([['bizimSkorName','kaner'],['bizimSkorFriendToken','token']]);
 const nodes={h0:{value:'1',dataset:{}},a0:{value:'0',dataset:{}}};
 const root={module:{exports:{}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:id=>nodes[id]},BizimSkorPredictionContext:()=>({week:8,fixtures:[{id:116}]}),setTimeout:f=>{f();},Event:class{},dispatchEvent(){},alert(){}};
 vm.runInNewContext(fs.readFileSync('partial-predictions-ui.js','utf8'),root);
 return {root,api:root.module.exports,nodes,storage};
}
test('save retries rejected and returned fetch errors with unchanged scores',async()=>{
 const s=setup();let attempts=0;const requests=[];
 s.root.sb={rpc:async(name,args)=>{requests.push(JSON.stringify(args));attempts++;if(attempts===1)throw new TypeError('Failed to fetch');if(attempts===2)return{error:{message:'TypeError: Failed to fetch'}};return{data:true,error:null}}};
 assert.equal(await s.api.saveKind('super_lig',{textContent:'Kaydet'}),true);
 assert.equal(attempts,3);assert.equal(new Set(requests).size,1);
 assert.equal([...s.storage.keys()].filter(k=>k.startsWith('bizimSkorPredictionDraft:')).length,0);
});
test('exhausted network failure preserves a scoped draft and releases button',async()=>{
 const s=setup();let attempts=0;s.root.sb={rpc:async()=>{attempts++;throw new TypeError('Failed to fetch')}};
 const button={textContent:'Kaydet'};
 await assert.rejects(()=>s.api.saveKind('super_lig',button),/bağlantı.*tekrar/i);
 assert.equal(attempts,3);assert.equal(button.disabled,false);assert.equal(button.textContent,'Kaydet');
 s.nodes.h0.value='';s.nodes.a0.value='';s.api.restoreDraft('super_lig',[{id:116}],8);
 assert.equal(s.nodes.h0.value,'1');assert.equal(s.nodes.a0.value,'0');
 s.nodes.h0.value='';s.nodes.a0.value='';s.api.restoreDraft('super_lig',[{id:116}],8);assert.equal(s.nodes.h0.value,'','cleared inputs must remain editable after draft restoration');
 s.nodes.h0.value='';s.nodes.a0.value='';s.root.localStorage.setItem('bizimSkorName','other');s.api.restoreDraft('super_lig',[{id:116}],8);assert.equal(s.nodes.h0.value,'');
});
test('validation errors are not retried; storage failure does not block save',async()=>{
 const s=setup();let attempts=0;s.root.localStorage.setItem=()=>{throw new Error('quota')};
 s.root.sb={rpc:async()=>{attempts++;return{error:{message:'Tahmin süresi doldu',code:'P0001'}}}};
 await assert.rejects(()=>s.api.saveKind('super_lig',{textContent:'Kaydet'}),error=>/süresi doldu/.test(error.message));assert.equal(attempts,1);
});
