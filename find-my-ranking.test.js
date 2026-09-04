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

test('sıralama araç çubuğunda ana menü solda, kendimi gör sağda yer alır',()=>{
  let inserted=null,homeClicks=0;
  const row={cells:[{textContent:'1'},{textContent:'Erdal'}]};
  const doc={
    getElementById:()=>null,
    querySelector:selector=>selector==='.tab[data-tab="home"]'?{click:()=>{homeClicks++}}:null,
    createElement:tag=>({
      tag,children:[],className:'',textContent:'',dataset:{},listeners:{},
      appendChild(child){this.children.push(child)},
      addEventListener(type,handler){this.listeners[type]=handler}
    })
  };
  const board={
    id:'generalBoard',ownerDocument:doc,
    querySelectorAll:selector=>selector==='table tr'?[row]:[],
    insertAdjacentElement:(_position,element)=>{inserted=element}
  };

  assert.equal(ui.enhanceBoard(board,'Erdal'),true);
  assert.deepEqual(inserted.children.map(button=>button.textContent),['🏠 Ana Menü','🎯 Kendimi Gör']);
  inserted.children[0].listeners.click();
  assert.equal(homeClicks,1);
});
