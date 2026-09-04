const test=require('node:test');
const assert=require('node:assert/strict');
const ui=require('./find-my-ranking.js');

test('oyuncu adını Türkçe karakter ve boşluk farklarından bağımsız eşleştirir',()=>{
  assert.equal(ui.samePlayer('  İPEK ','ipek'),true);
  assert.equal(ui.samePlayer('Erdal','Emre'),false);
});

test('yalnız desteklenen sıralama alanlarını hedefler',()=>{
  assert.deepEqual(ui.rankingBoardIds(),[
    'weeklyRankingBoard','sezuBoard','generalBoard','championsRankingBoard','friendLeagueRanking'
  ]);
});

test('tablo satırları içinde giriş yapan oyuncuyu ikinci sütundan bulur',()=>{
  const rows=[
    {cells:[{textContent:'1'},{textContent:'Ayşegül'}]},
    {cells:[{textContent:'2'},{textContent:'Erdal'}]}
  ];
  const board={querySelectorAll:selector=>selector==='table tr'?rows:[]};
  assert.equal(ui.findPlayerRow(board,'erdal'),rows[1]);
  assert.equal(ui.findPlayerRow(board,'Yok'),null);
});

test('giriş veya oyuncu satırı yoksa buton göstermez',()=>{
  assert.equal(ui.shouldShowButton('',{}),false);
  assert.equal(ui.shouldShowButton('Erdal',null),false);
  assert.equal(ui.shouldShowButton('Erdal',{}),true);
});

test('kendi satırını ortalar ve geçici olarak vurgular',()=>{
  const classes=new Set();let scrollOptions=null,delay=null,removeHighlight=null;
  const row={
    classList:{add:value=>classes.add(value),remove:value=>classes.delete(value)},
    scrollIntoView:options=>{scrollOptions=options}
  };
  assert.equal(ui.focusPlayerRow(row,(callback,ms)=>{removeHighlight=callback;delay=ms}),true);
  assert.equal(classes.has('bs-my-ranking-row'),true);
  assert.deepEqual(scrollOptions,{behavior:'smooth',block:'center'});
  assert.equal(delay,1800);
  removeHighlight();
  assert.equal(classes.has('bs-my-ranking-row'),false);
});
