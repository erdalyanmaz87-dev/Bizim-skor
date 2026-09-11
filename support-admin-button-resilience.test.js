const test=require('node:test');
const assert=require('node:assert/strict');
const {createAdminSupportUI}=require('./support-admin-ui.js');

test('admin inbox button is mounted after admin check even if initial list fails',async()=>{
  const nodes=new Map();
  const host={insertBefore(node){nodes.set(node.id,node)}};
  const logout={parentElement:host};
  const doc={
    getElementById:id=>id==='logoutPlayer'?logout:(nodes.get(id)||null),
    createElement:()=>({innerHTML:'',firstElementChild:null}),
    body:{appendChild(){} }
  };
  const button={id:'openSupportAdmin',innerHTML:'📬 Gelen Mesajlar',addEventListener(){},remove(){nodes.delete(this.id)}};
  const view={inboxButton:()=>'<button id="openSupportAdmin">📬 Gelen Mesajlar</button>'};
  const controller={load:async()=>{throw new Error('temporary list error')}};
  const adminApi={isAdmin:async()=>true};
  const placement={insertAdminSupportButton:(_doc,node)=>{nodes.set(node.id,node);return true}};
  const ui=createAdminSupportUI({doc,view,controller,adminApi,placement,makeElement:()=>button});
  await assert.rejects(()=>ui.refreshButton(),/temporary list error/);
  assert.equal(nodes.get('openSupportAdmin'),button);
});
