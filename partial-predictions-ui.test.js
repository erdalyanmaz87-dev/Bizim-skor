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

test('Uluslar Ligi kaydı ekranda görünen hafta ve fikstürü kullanır',()=>{
  const oldDocument=global.document,oldApi=global.BizimSkorNationsUI;
  global.document={
    getElementById:id=>id==='nationsPredictionWeekSelect'?{value:'3'}:null,
    querySelectorAll:selector=>selector==='#nationsFixtures .nations-match'?[{
      querySelector:()=>({id:'nlh301'})
    }]:[]
  };
  global.BizimSkorNationsUI={currentWeek:()=>4,getFixtures:()=>[{id:401}]};
  try{assert.deepEqual(Partial.contextFor('nations_league'),{fixtures:[{id:301,fixture_id:301}],week:3})}
  finally{global.document=oldDocument;global.BizimSkorNationsUI=oldApi}
});

test('görünen oyuncu ile sunucu oturumu farklıysa kaydı reddeder',()=>{
  assert.throws(()=>Partial.assertSessionOwner('Soner','Başka Oyuncu'),/oturum.*eşleşmiyor/i);
  assert.equal(Partial.assertSessionOwner(' Soner ','soner'),'Soner');
});

test('başarı mesajından önce kaydedilen skorların tamamını doğrular',()=>{
  const expected=[{fixture_id:1,home_score:2,away_score:1},{fixture_id:3,home_score:0,away_score:0}];
  assert.equal(Partial.savedRowsMatch(expected,[...expected]),true);
  assert.equal(Partial.savedRowsMatch(expected,[{fixture_id:1,home_score:2,away_score:1}]),false);
  assert.equal(Partial.savedRowsMatch(expected,[{fixture_id:1,home_score:2,away_score:0},{fixture_id:3,home_score:0,away_score:0}]),false);
});

test('ilerleme göstergesi için bütün sayfayı izleyen MutationObserver kullanılmaz',()=>{
  const source=require('node:fs').readFileSync('./partial-predictions-ui.js','utf8');
  assert.doesNotMatch(source,/observer\.observe\(document\.documentElement/);
});
