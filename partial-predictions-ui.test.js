const test=require('node:test');
const assert=require('node:assert/strict');
const Partial=require('./partial-predictions-ui');

const fixtures=[{id:1},{id:2},{id:3}];

test('yalnız tam doldurulan maçları kayda hazırlar',()=>{
  const result=Partial.normalizePartialScores(fixtures,[
    {fixture_id:1,home_score:'2',away_score:'1'},
    {fixture_id:2,home_score:'',away_score:''},
    {fixture_id:3,home_score:'0',away_score:'0'}
  ]);
  assert.deepEqual(result.rows,[
    {fixture_id:1,home_score:2,away_score:1,robot_applied:false},
    {fixture_id:3,home_score:0,away_score:0,robot_applied:false}
  ]);
  assert.equal(result.completed,2);
  assert.equal(result.total,3);
});

test('tek tarafı doldurulmuş maçı reddeder',()=>{
  assert.throws(()=>Partial.normalizePartialScores(fixtures,[
    {fixture_id:1,home_score:'2',away_score:''},
    {fixture_id:2,home_score:'',away_score:''},
    {fixture_id:3,home_score:'',away_score:''}
  ]),/iki skor kutusunu da doldur/i);
});

test('hiç tahmin yoksa en az bir maç ister',()=>{
  assert.throws(()=>Partial.normalizePartialScores(fixtures,[
    {fixture_id:1,home_score:'',away_score:''},
    {fixture_id:2,home_score:'',away_score:''},
    {fixture_id:3,home_score:'',away_score:''}
  ]),/en az 1 maç/i);
});

test('eksik maç varsa onay metni oluşturur',()=>{
  assert.equal(Partial.confirmationMessage(4,9),'4/9 maç için tahmin yaptınız. 5 maç boş kalacak. Yine de kaydetmek istiyor musunuz?');
  assert.equal(Partial.confirmationMessage(9,9),'');
});
