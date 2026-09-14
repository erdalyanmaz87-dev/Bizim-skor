const test=require('node:test');
const assert=require('node:assert/strict');
const Movement=require('../ranking-movement');

const row=(name,rank,metric)=>({name,rank,metric});

test('bir oyuncunun onceki siraya gore yukselis ve dusus miktarini hesaplar',()=>{
  const previous=Movement.nextState(null,[
    row('Ali',1,'10|2|3'),
    row('Veli',2,'9|1|4'),
    row('Ayse',3,'8|1|3')
  ]);
  const current=Movement.nextState(previous,[
    row('Ayse',1,'12|2|4'),
    row('Ali',2,'10|2|3'),
    row('Veli',3,'9|1|4')
  ]);

  assert.deepEqual(current.movement.ayse,{direction:'up',amount:2});
  assert.deepEqual(current.movement.ali,{direction:'down',amount:1});
  assert.deepEqual(current.movement.veli,{direction:'down',amount:1});
});

test('puan degistigi halde sira degismediyse onceki okun kalmasina izin vermez',()=>{
  const first=Movement.nextState(null,[row('Ali',2,'8'),row('Veli',1,'10')]);
  const moved=Movement.nextState(first,[row('Ali',1,'12'),row('Veli',2,'10')]);
  assert.equal(moved.movement.ali.direction,'up');

  const unchangedAfterNextMatch=Movement.nextState(moved,[row('Ali',1,'13'),row('Veli',2,'11')]);
  assert.deepEqual(unchangedAfterNextMatch.movement,{});
});

test('ayni siralama tekrar render edilirse mevcut hareket gostergesini korur',()=>{
  const first=Movement.nextState(null,[row('Ali',2,'8'),row('Veli',1,'10')]);
  const moved=Movement.nextState(first,[row('Ali',1,'12'),row('Veli',2,'10')]);
  const rerender=Movement.nextState(moved,[row('Ali',1,'12'),row('Veli',2,'10')]);
  assert.deepEqual(rerender.movement,moved.movement);
});

test('ilk kez siralamaya giren oyuncuya yapay yukselis oku vermez',()=>{
  const first=Movement.nextState(null,[row('Ali',1,'10')]);
  const next=Movement.nextState(first,[row('Ali',1,'10'),row('Yeni',2,'5')]);
  assert.equal(next.movement.yeni,undefined);
});


test('yeni mac revizyonunda siralama degismediyse eski oku temizler',()=>{
  const first=Movement.nextState(null,[row('Ali',2,'8'),row('Veli',1,'10')]);
  const moved=Movement.nextState(first,[row('Ali',1,'12'),row('Veli',2,'10')]);
  assert.equal(moved.movement.ali.direction,'up');
  assert.deepEqual(Movement.nextState(moved,[row('Ali',1,'12'),row('Veli',2,'10')],true).movement,{});
});

test('koyu temada kucuk dusus oku okunakli acik kirmizi kullanir',()=>{
  let style;
  const doc={getElementById:()=>null,createElement:()=>style={textContent:''},head:{appendChild:()=>{}}};
  Movement.ensureStyles(doc);
  assert.match(style.textContent,/html\[data-theme="dark"\] \.bs-rank-down\{color:#f87171\}/);
});
