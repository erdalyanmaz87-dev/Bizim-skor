const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

function freshModule(){
  delete require.cache[require.resolve('../general-ranking-live-refresh')];
  return require('../general-ranking-live-refresh');
}

test('Arena eklenirken mevcut results canlı aboneliği korunur',()=>{
  const oldSb=global.sb;
  const oldRanking=global.BizimSkorOpportunityRanking;
  const oldFlag=global.__bizimSkorGeneralRankingRefresh;
  const oldDoc=global.document;
  let config=null;
  let callback=null;
  let refreshed=0;
  const channel={
    on(event,nextConfig,nextCallback){
      assert.equal(event,'postgres_changes');
      config=nextConfig;
      callback=nextCallback;
      return channel;
    },
    subscribe(){return {kind:'subscription'}}
  };
  global.document=undefined;
  global.__bizimSkorGeneralRankingRefresh=undefined;
  global.sb={channel(name){assert.equal(name,'general-rank-results-v2');return channel}};
  global.BizimSkorOpportunityRanking={mount(){},refreshAfterResult(){refreshed+=1}};

  try{
    const api=freshModule();
    assert.equal(api.mount(),true);
    assert.deepEqual(config,{event:'*',schema:'public',table:'results'});
    callback();
    assert.equal(refreshed,1);
  }finally{
    global.sb=oldSb;
    global.BizimSkorOpportunityRanking=oldRanking;
    global.__bizimSkorGeneralRankingRefresh=oldFlag;
    global.document=oldDoc;
  }
});

test('Arena oturumu yoksa ana sıralama mount akışını engellemez',()=>{
  const oldSb=global.sb;
  const oldFlag=global.__bizimSkorGeneralRankingRefresh;
  const oldDoc=global.document;
  const channel={on(){return channel},subscribe(){return {}}};
  global.document=undefined;
  global.__bizimSkorGeneralRankingRefresh=undefined;
  global.sb={channel(){return channel}};
  try{
    const api=freshModule();
    assert.equal(api.mount(),true);
  }finally{
    global.sb=oldSb;
    global.__bizimSkorGeneralRankingRefresh=oldFlag;
    global.document=oldDoc;
  }
});

test('Arena kayan sıralama menüsünün ilk kartıdır',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../general-ranking-live-refresh.js'),'utf8');
  const menuSource=fs.readFileSync(path.join(__dirname,'../horizontal-menu.js'),'utf8');
  assert.match(source,/querySelector\('\.bs-scroll-menu'\)/);
  assert.match(source,/menuHost\.insertBefore\(arenaTab,menuHost\.firstChild\)/);
  assert.match(menuSource,/ORDER=\['arena','championsRanking'/);
  assert.match(menuSource,/arena:'Arena'/);
  assert.match(menuSource,/arena:'🏆'/);
});

test('Arena ayrı bölüm kullanır',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../general-ranking-live-refresh.js'),'utf8');
  assert.match(source,/arenaSection\.id='arena'/);
  assert.match(source,/Bizim Skor Arena/);
  assert.match(source,/Bizim Skor Ligleri/);
});

test('kişisel lig özeti Arena sekmesini açar',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../general-ranking-live-refresh.js'),'utf8');
  assert.match(source,/\.tab\[data-tab="arena"\]/);
  assert.doesNotMatch(source,/\.tab\[data-tab="general"\].*scrollIntoView/);
});

test('Arena terminolojisi kullanıcıya her yerde tutarlı görünür',()=>{
  const uiSource=fs.readFileSync(path.join(__dirname,'../league-system-ui.js'),'utf8');
  assert.match(uiSource,/Arena'ya Gir ›/);
  assert.doesNotMatch(uiSource,/Ligimi Gör ›/);
});

test('Arena bölümü mevcut section sınıfı ile oluşturulur',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../general-ranking-live-refresh.js'),'utf8');
  assert.match(source,/arenaSection\.className='section hide'/);
});
