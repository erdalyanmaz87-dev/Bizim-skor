const assert=require('assert');
const startup=require('./startup-performance.js');

function classList(initial=[]){
  const values=new Set(initial);
  return {
    add(value){values.add(value)},
    remove(value){values.delete(value)},
    contains(value){return values.has(value)}
  };
}

const nodes={
  newPlayer:{classList:classList()},
  knownPlayer:{classList:classList(['hide'])},
  knownName:{textContent:''},
  personalWeekRank:{textContent:'—',setAttribute(name,value){this[name]=value}},
  personalSezuRank:{textContent:'—',setAttribute(name,value){this[name]=value}},
  personalGeneralRank:{textContent:'—',setAttribute(name,value){this[name]=value}}
};
const doc={getElementById:id=>nodes[id]||null};
const storage={getItem:key=>({bizimSkorName:'Erdal',bizimSkorFriendToken:'token-1'})[key]||null};

assert.deepStrictEqual(startup.primeRememberedPlayer(doc,storage),{name:'Erdal',token:'token-1'});
assert.strictEqual(nodes.newPlayer.classList.contains('hide'),true,'kayıtlı oyuncuya giriş formu gösterilmemeli');
assert.strictEqual(nodes.knownPlayer.classList.contains('hide'),false,'kayıtlı oyuncu kabuğu hemen görünmeli');
assert.strictEqual(nodes.knownName.textContent,'Erdal');
assert.strictEqual(nodes.personalWeekRank.textContent,'Yükleniyor…','boş çizgi yerine açık yükleme durumu gösterilmeli');
assert.strictEqual(nodes.personalWeekRank['aria-busy'],'true');

const started=[];
let releaseWeek;
const week=new Promise(resolve=>{releaseWeek=resolve});
const errors=[];
const jobs=startup.startIsolatedJobs({
  week:()=>{started.push('week');return week},
  live:()=>{started.push('live');return Promise.reject(new Error('canlı hata'))},
  player:()=>{started.push('player');return 'hazır'}
},(name,error)=>errors.push([name,error.message]));

assert.deepStrictEqual(started,['week','live','player'],'başlangıç işleri birbirini beklemeden başlamalı');
Promise.all([jobs.live,jobs.player]).then(async values=>{
  assert.deepStrictEqual(values,[undefined,'hazır'],'bir bölümün hatası diğer bölümün sonucunu engellememeli');
  assert.deepStrictEqual(errors,[['live','canlı hata']]);
  releaseWeek('fikstür hazır');
  assert.strictEqual(await jobs.week,'fikstür hazır');
  console.log('startup performance helpers ok');
}).catch(error=>{console.error(error);process.exitCode=1});
