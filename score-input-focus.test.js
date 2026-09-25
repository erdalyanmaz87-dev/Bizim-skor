const test=require('node:test');
const assert=require('node:assert/strict');

test('ev sahibi skoru yazılınca deplasman kutusuna geçer',()=>{
  const focus=require('./score-input-focus.js');
  const inputs=[input('2'),input(''),input(''),input('')];
  const doc=fakeDocument(inputs);

  assert.equal(focus.advance(inputs[0],doc),inputs[1]);
  assert.equal(inputs[1].focused,true);
});

test('deplasman skoru yazılınca sonraki maçın ev sahibi kutusuna geçer',()=>{
  const focus=require('./score-input-focus.js');
  const inputs=[input('2'),input('1'),input(''),input('')];
  const doc=fakeDocument(inputs);

  assert.equal(focus.advance(inputs[1],doc),inputs[2]);
  assert.equal(inputs[2].focused,true);
});

test('boş veya geçersiz değer odağı ilerletmez',()=>{
  const focus=require('./score-input-focus.js');
  const inputs=[input(''),input('')];
  const doc=fakeDocument(inputs);

  assert.equal(focus.advance(inputs[0],doc),null);
  inputs[0].value='x';
  assert.equal(focus.advance(inputs[0],doc),null);
  assert.equal(inputs[1].focused,false);
});

function input(value){
  return {value,disabled:false,focused:false,focus(){this.focused=true},select(){this.selected=true}};
}

function fakeDocument(inputs){
  return {querySelectorAll(selector){
    assert.match(selector,/championsFixtures/);
    assert.match(selector,/nationsFixtures/);
    return inputs;
  }};
}
