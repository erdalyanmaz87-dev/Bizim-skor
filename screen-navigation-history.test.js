const test=require('node:test');
const assert=require('node:assert/strict');
const nav=require('./screen-navigation.js');
globalThis.BizimSkorScreenNavigation=nav;
globalThis.BizimSkorScreenNavigationUI=require('./screen-navigation-ui.js');
const {createNavigationApp}=require('./screen-navigation-app.js');

function fakeClassList(){const set=new Set(['hide']);return{add:v=>set.add(v),remove:v=>set.delete(v),contains:v=>set.has(v)}}
function fixture(){
  const nodes=new Map();
  const content={scrollTop:0,appendChild(){}};
  const back={addEventListener(){}};
  const parent={insertBefore(node){node.parentNode=this}};
  const section={id:'pred',classList:fakeClassList(),parentNode:parent};nodes.set('pred',section);
  const doc={
    body:{appendChild(node){if(node.id)nodes.set(node.id,node)}},head:{appendChild(){}},
    getElementById:id=>nodes.get(id)||null,
    querySelector:sel=>sel.includes('data-bs-screen-nav')?null:(sel.includes('data-tab="home"')?{click(){}}:null),
    createComment:()=>({parentNode:null,remove(){}}),
    createElement:tag=>tag==='link'?{dataset:{}}:{id:'',className:'',classList:fakeClassList(),querySelector:sel=>sel==='[data-screen-content]'?content:(sel==='[data-screen-back]'?back:null),set innerHTML(v){this._html=v},get innerHTML(){return this._html||''}}
  };
  let confirmCalls=0,goCalls=0;
  const history={state:null,replaceState(v){this.state=v},pushState(v){this.state=v},back(){},go(n){assert.equal(n,1);goCalls++}};
  const win={history,scrollY:0,pageYOffset:0,confirm(){confirmCalls++;return false},addEventListener(){},scrollTo(){}};
  return{doc,win,getConfirmCalls:()=>confirmCalls,getGoCalls:()=>goCalls};
}

test('cancelled browser back restores history without a second confirmation',()=>{
  const env=fixture();
  globalThis.BizimSkorHeaderUI={hasUnsavedPredictionChanges:()=>true};
  const app=createNavigationApp({doc:env.doc,win:env.win,navigation:nav,view:globalThis.BizimSkorScreenNavigationUI});
  app.mount();assert.equal(app.open('pred'),true);
  assert.equal(app.onPopState({state:{bizimSkorScreen:true,screenId:'home',screenDepth:1}}),false);
  assert.equal(env.getConfirmCalls(),1);assert.equal(env.getGoCalls(),1);assert.equal(nav.currentScreen(app.snapshot().state).id,'pred');
  assert.equal(app.onPopState({state:env.win.history.state}),true);
  assert.equal(env.getConfirmCalls(),1);assert.equal(nav.currentScreen(app.snapshot().state).id,'pred');
});
