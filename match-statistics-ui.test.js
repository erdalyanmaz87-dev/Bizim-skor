const test=require('node:test');
const assert=require('node:assert/strict');
const ui=require('./match-statistics-ui.js');

const snapshot={
  fixture_id:44,week:5,home_team:'A <spor>',away_team:'B',fetched_at:'2026-09-05T08:57:00Z',
  home:{name:'A <spor>',rank:2,points:9,form:['W','D','L'],recent_matches:[{date:'2026-09-01T17:00:00Z',home_team:'A <spor>',away_team:'C',home_score:2,away_score:0}]},
  away:{name:'B',rank:7,points:5,form:['D'],recent_matches:[]},
  head_to_head:[{date:'2026-05-01T17:00:00Z',home_team:'B',away_team:'A <spor>',home_score:1,away_score:1}]
};

test('istatistik ekranı veriyi kaçışlı, dikey ve Türkçe başlıklarla gösterir',()=>{
  const html=ui.renderSnapshot(snapshot);
  assert.match(html,/A &lt;spor&gt;/);
  assert.doesNotMatch(html,/A <spor>/);
  assert.match(html,/Lig Durumu/);
  assert.match(html,/Son 5 Maç/);
  assert.match(html,/Aralarındaki Son 5 Maç/);
  assert.match(html,/2\. sıra • 9 puan/);
  assert.match(html,/2 - 0/);
  assert.match(html,/Son güncelleme:/);
});

test('form işaretlerini eskiden yeniye dizer ve yön oku gösterir',()=>{
  const html=ui.renderForm(['W','D','L']);
  assert.ok(html.indexOf('form-loss')<html.indexOf('form-draw'));
  assert.ok(html.indexOf('form-draw')<html.indexOf('form-win'));
  assert.match(html,/match-stats-form-arrow/);
  assert.match(html,/→/);
});

test('son maçları eskiden yeniye doğru yukarıdan aşağıya dizer',()=>{
  const html=ui.renderMatches([
    {date:'2026-09-01T17:00:00Z',home_team:'Yeni',away_team:'Maç',home_score:2,away_score:0},
    {date:'2026-08-01T17:00:00Z',home_team:'Eski',away_team:'Maç',home_score:1,away_score:1}
  ]);
  assert.ok(html.indexOf('Eski')<html.indexOf('Yeni'));
});

test('taslak skorlar ve sayfa konumu istatistikten dönüşte aynen korunur',()=>{
  const inputs=[{id:'h0',value:'2'},{id:'a0',value:'1'},{id:'h1',value:''}];
  const doc={querySelectorAll(selector){return selector==='#fx input.s'?inputs:[]},getElementById(id){return inputs.find(input=>input.id===id)||null}};
  const draft=ui.captureDraft(doc,{scrollY:417});
  inputs[0].value='';inputs[1].value='';
  let restoredScroll=null;
  ui.restoreDraft(doc,{scrollTo(x,y){restoredScroll=[x,y]}},draft);
  assert.deepEqual(inputs.map(input=>input.value),['2','1','']);
  assert.deepEqual(restoredScroll,[0,417]);
});

test('buton yalnız Supabase önbellek RPC çağrısını kullanır',async()=>{
  const calls=[];
  const result=await ui.loadSnapshot({rpc(name,args){calls.push({name,args});return Promise.resolve({data:snapshot,error:null})}},44);
  assert.equal(result.fixture_id,44);
  assert.deepEqual(calls,[{name:'get_match_statistics',args:{p_fixture_id:44}}]);
});

test('veri hazırlanmamışsa anlaşılır hata verir',async()=>{
  await assert.rejects(()=>ui.loadSnapshot({rpc(){return Promise.resolve({data:null,error:null})}},44),/henüz hazırlanmadı/i);
});
