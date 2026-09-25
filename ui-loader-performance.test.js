const fs=require('fs');
const assert=require('assert');
const loader=fs.readFileSync('ui-integration-loader.js','utf8');
const reopen=fs.readFileSync('prediction-status-reopen-fix.js','utf8');
assert(loader.includes('criticalScripts'),'kritik UI scriptleri ayrı yüklenmeli');
assert(loader.includes('deferredScripts'),'ikincil scriptler ayrı yüklenmeli');
assert(loader.indexOf("'prediction-week-cards.js'")<loader.indexOf("'invite-growth-utils.js'"),'Tahmin Durumu kartları davet modüllerinden önce yüklenmeli');
assert(loader.includes('requestIdleCallback')||loader.includes('setTimeout'),'ikincil yükleme ilk çizim sonrasına bırakılmalı');
assert(!reopen.includes("observer.observe(doc.body,{subtree:true"),'Tahmin Durumu tüm body altını izlememeli');
assert(reopen.includes("observer.observe(layer"),'observer yalnız Tahmin Durumu katmanını izlemeli');

const integration=require('./ui-integration-loader.js');
const events=[];
const scripts=[];
const fakeDocument={
  scripts,
  querySelector(){return null},
  createElement(tag){
    return {
      tagName:tag.toUpperCase(),
      dataset:{},
      getAttribute(name){return name==='src'?this.src:null}
    };
  },
  head:{appendChild(node){events.push(`preload:${node.dataset.bizimUiPreload}`)}},
  body:{appendChild(node){scripts.push(node);events.push(`execute:${node.dataset.bizimUi}`);node.onload?.()}}
};

(async()=>{
  const originalDocument=global.document;
  global.document=fakeDocument;
  try{
    await integration.loadCritical();
    const preloadEvents=events.filter(value=>value.startsWith('preload:'));
    const executeEvents=events.filter(value=>value.startsWith('execute:'));
    assert.strictEqual(preloadEvents.length,integration.criticalScripts.length,'her kritik dosyanın indirmesi önceden başlatılmalı');
    assert.strictEqual(executeEvents.length,integration.criticalScripts.length,'kritik dosyaların tamamı çalıştırılmalı');
    assert.strictEqual(events.indexOf(executeEvents[0]),integration.criticalScripts.length,'ilk dosya çalışmadan bütün kritik indirmeler başlatılmış olmalı');
    assert.deepStrictEqual(executeEvents,integration.criticalScripts.map(src=>`execute:${src}`),'çalıştırma sırası bağımlılıkları korumalı');
    console.log('ui loader performance contract ok');
  }finally{global.document=originalDocument}
})().catch(error=>{console.error(error);process.exitCode=1});
