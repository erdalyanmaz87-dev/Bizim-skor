const assert=require('assert');
const removal=require('./weekly-result-removal.js');
const loader=require('./ui-integration-loader.js');

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

const scripts=loader.scriptOrder();
assert.ok(scripts.includes('weekly-result-removal.js'));
assert.ok(scripts.indexOf('weekly-result-removal.js')>scripts.indexOf('simple-navigation.js'));
assert.ok(!scripts.includes('weekly-result-card.js'));
assert.ok(!scripts.includes('weekly-result-card-image-share.js'));
assert.ok(!scripts.includes('weekly-result-card-bootstrap.js'));

console.log('weekly-result-removal ok');
