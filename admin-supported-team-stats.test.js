const assert=require('assert');
const feature=require('./admin-supported-team-stats.js');
const selected=Array.from({length:8},(_,i)=>({player_name:`Oyuncu${i+1}`,supported_team:i%2?'fenerbahce':'galatasaray'}));
const unselected=Array.from({length:7},(_,i)=>({player_name:`Secmeyen${i+1}`,supported_team:null}));
const html=feature.render({selected_count:selected.length,unselected_count:unselected.length,selected,unselected});
assert(html.includes('Takım Seçen'));
assert(html.includes('Takım Seçmeyen'));
assert(html.includes('Takım Dağılımı'));
assert(html.includes('Galatasaray'));
assert(html.includes('4 kişi'));
assert(html.includes('Fenerbahçe'));
assert(html.includes('data-admin-stats-toggle'));
assert(html.includes('Tümünü Göster (8)'));
assert(html.includes('Tümünü Göster (7)'));
assert(html.includes('bs-admin-stats-extra'));
assert(html.includes('data-admin-supported-list="selected"'));
assert(html.includes('data-admin-supported-list="unselected"'));

(async()=>{
  let rpcCalls=0;
  global.MutationObserver=class{constructor(cb){this.cb=cb}observe(){}};
  global.localStorage={getItem(){return 'token'}};
  global.sb={rpc:async()=>{rpcCalls++;return{data:{selected_count:0,unselected_count:0,selected:[],unselected:[]},error:null}}};
  const body={inserted:false,querySelector(sel){return sel==='[data-admin-supported-team-summary]'?null:null},insertAdjacentHTML(){this.inserted=true}};
  const modal={classList:{contains(name){return name==='hide'?false:false}}};
  const doc={
    documentElement:{dataset:{}},
    body:{},
    addEventListener(){},
    getElementById(id){return id==='adminStatisticsModal'?modal:null},
    querySelector(sel){return sel==='#adminStatisticsModal [data-admin-stats-body]'?body:null}
  };
  feature.mount(doc);
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.strictEqual(rpcCalls,1,'Yönetici Özeti zaten açıksa takım özeti modül yüklenir yüklenmez veriyi çekmeli');
  assert.strictEqual(body.inserted,true,'Takım seçen/seçmeyen bölümü açık özete hemen eklenmeli');
  console.log('admin supported team stats ok');
})().catch(error=>{console.error(error);process.exitCode=1});
