const test=require('node:test');
const assert=require('node:assert/strict');
const {createAdminSupportUI}=require('./support-admin-ui.js');

test('refresh mounts admin button immediately after server admin check then updates count',async()=>{
  const events={};const button={innerHTML:'',addEventListener:(name,fn)=>events[name]=fn};let mounted=0;const rendered=[];
  const ui=createAdminSupportUI({
    doc:{getElementById:()=>null},
    view:{inboxButton:n=>`admin:${n}`},
    controller:{load:async()=>({rows:[{id:1},{id:2}],status:'new'})},
    adminApi:{isAdmin:async()=>true},
    placement:{insertAdminSupportButton:(_doc,node)=>{mounted++;assert.equal(node,button);return true}},
    makeElement:html=>{rendered.push(html);return html==='admin:0'?button:{innerHTML:'admin:2'}}
  });
  const result=await ui.refreshButton();
  assert.equal(result.admin,true);assert.equal(mounted,1);assert.deepEqual(rendered,['admin:0','admin:2']);assert.equal(button.innerHTML,'admin:2');assert.equal(typeof events.click,'function');
});

test('refresh does not mount for non admin',async()=>{
  let mounted=0,loads=0;
  const ui=createAdminSupportUI({doc:{getElementById:()=>null},view:{inboxButton:()=>''},controller:{load:async()=>{loads++;return{rows:[]}}},adminApi:{isAdmin:async()=>false},placement:{insertAdminSupportButton:()=>{mounted++}},makeElement:()=>({})});
  const result=await ui.refreshButton();assert.equal(result.admin,false);assert.equal(mounted,0);assert.equal(loads,0);
});
