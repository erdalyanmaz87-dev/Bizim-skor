const test=require('node:test');
const assert=require('node:assert/strict');

function freshModule(){
  delete require.cache[require.resolve('../general-ranking-live-refresh')];
  return require('../general-ranking-live-refresh');
}

test('Ligim eklenirken mevcut results canlı aboneliği korunur',()=>{
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

test('Ligim oturumu yoksa ana sıralama mount akışını engellemez',()=>{
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
