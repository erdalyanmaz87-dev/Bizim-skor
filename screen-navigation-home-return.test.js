const test=require('node:test');
const assert=require('node:assert/strict');
const {createNavigationApp}=require('./screen-navigation-app.js');
const nav=require('./screen-navigation.js');
const ui=require('./screen-navigation-ui.js');

test('returning to root activates the existing home tab',()=>{
  let homeClicks=0;
  const layer={classList:{add(){}},innerHTML:''};
  const homeTab={click(){homeClicks++}};
  const doc={
    getElementById:id=>id==='bsScreenLayer'?layer:null,
    querySelector:sel=>sel==='.tab[data-tab="home"]'?homeTab:null,
    addEventListener(){},head:{appendChild(){}},body:{appendChild(){}},
    createElement(){return{className:'',dataset:{},classList:{add(){},remove(){}},appendChild(){}}}
  };
  const win={history:{replaceState(){},state:{}},addEventListener(){},scrollTo(){}};
  const app=createNavigationApp({doc,win,navigation:nav,view:ui});
  app.mount();
  app.back();
  assert.equal(homeClicks,1);
});
