const test=require('node:test');
const assert=require('node:assert/strict');
const {createSerialWeekLoader}=require('./prediction-week-load-queue.js');

const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));

test('hızlı hafta değişiminde önceki istek yeni haftanın ekranını ezemez',async()=>{
  const events=[];
  const load=createSerialWeekLoader(async week=>{
    events.push(`start-${week}`);
    await wait(week===1?30:1);
    events.push(`end-${week}`);
    return week;
  });
  const first=load(1);
  const second=load(2);
  await Promise.all([first,second]);
  assert.deepEqual(events,['start-1','end-1','start-2','end-2']);
});

test('hafta değeri sayıya çevrilir',async()=>{
  let received=null;
  const load=createSerialWeekLoader(async week=>{received=week});
  await load('2');
  assert.equal(received,2);
});
