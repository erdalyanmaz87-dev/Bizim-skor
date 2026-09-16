const assert=require('assert');
const removal=require('./weekly-result-removal.js');

const removed=[];
const doc={
  querySelectorAll(selector){
    assert.strictEqual(selector,'[data-simple-account="weeklyResult"],#bsWeeklyResultCardShell,#bsWeeklyResultTrigger');
    return [
      {remove(){removed.push('menu')}},
      {remove(){removed.push('shell')}},
      {remove(){removed.push('trigger')}}
    ];
  }
};

assert.strictEqual(removal.removeWeeklyResultUi(doc),3);
assert.deepStrictEqual(removed,['menu','shell','trigger']);
console.log('weekly-result-removal ok');
