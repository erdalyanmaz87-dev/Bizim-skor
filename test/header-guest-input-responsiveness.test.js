const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('guest registration mode changes settle instead of continuously rebuilding the header',()=>{
  let observer,headerWrites=0;const queue=[];
  const classes=new Set(['hide']);
  const known={classList:{contains:c=>classes.has(c),toggle(c,on){if(on)classes.add(c);else classes.delete(c);observer?.()}}};
  const header={classList:{add(){}},set innerHTML(value){headerWrites++},insertAdjacentHTML(){}};
  const ids={knownPlayer:known,newPlayer:{},knownName:{},bsHeaderStyles:{},bsHeaderPrimaryActions:{},profileForm:{classList:{contains:()=>true}}};
  const doc={getElementById:id=>ids[id]||null,querySelector:()=>header};
  const context={document:doc,localStorage:{getItem:()=>null},setTimeout:fn=>queue.push(fn),addEventListener(){},MutationObserver:class{constructor(fn){observer=fn}observe(){}}};
  vm.runInNewContext(fs.readFileSync('header-ui.js','utf8'),context);
  observer();
  for(let i=0;i<20&&queue.length;i++)queue.shift()();
  assert.equal(queue.length,0,'header refresh must not enqueue itself forever while typing');
  assert.equal(headerWrites,2);
});
