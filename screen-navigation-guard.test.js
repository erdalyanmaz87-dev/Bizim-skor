const test=require('node:test');
const assert=require('node:assert/strict');
const {canLeaveCurrentScreen}=require('./screen-navigation-ui.js');

test('navigation is allowed when there are no unsaved predictions',()=>{
  const root={BizimSkorHeaderUI:{hasUnsavedPredictionChanges:()=>false}};
  assert.equal(canLeaveCurrentScreen({},root),true);
});

test('navigation asks before leaving unsaved predictions',()=>{
  let asked=0;
  const root={BizimSkorHeaderUI:{hasUnsavedPredictionChanges:()=>true},confirm:()=>{asked++;return false}};
  assert.equal(canLeaveCurrentScreen({},root),false);
  assert.equal(asked,1);
});
