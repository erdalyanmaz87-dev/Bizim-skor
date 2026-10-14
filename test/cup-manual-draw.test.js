const test=require('node:test'),assert=require('node:assert/strict'),cup=require('../cup-ui');
const base={status:'registration',count:50,start_week:8,entries:[],matches:[],manual_draw:true,revealed_pairs:0,server_now:'2026-10-14T18:00:00Z',scheduled_at:'2026-10-15T17:00:00Z'};
test('owner can prepare a manual draw now while participants see waiting state',()=>{
 const owner=cup.render({...base,is_owner:true},'draw');
 assert.match(owner,/data-cup-start/);assert.match(owner,/Kurayı başlat/);
 const viewer=cup.render({...base,is_owner:false,my_number:4},'draw');
 assert.doesNotMatch(viewer,/data-cup-start|data-cup-next/);assert.match(viewer,/yöneticinin başlatması bekleniyor/i);
});
test('drawing is advanced only by owner and reports persisted progress',()=>{
 const state={...base,status:'drawing',drawn_at:'2026-10-14T18:00:00Z',revealed_pairs:1,matches:[{round:1,position:1,name_a:'Mertshen',name_b:'Erdal'}]};
 const owner=cup.render({...state,is_owner:true},'draw');assert.match(owner,/data-cup-next/);assert.match(owner,/1 \/ 32/);assert.match(owner,/Sonraki eşleşmeyi çek/);
 assert.doesNotMatch(cup.render({...state,is_owner:false},'draw'),/data-cup-next/);
});
test('BAY is displayed with direct advancement rather than as missing opponent',()=>{
 const html=cup.render({...base,status:'drawing',revealed_pairs:1,matches:[{round:1,position:1,name_a:'BAY',name_b:'Erdal',winner:'Erdal',tie_reason:'BAY'}]},'draw');
 assert.match(html,/doğrudan.*9\. haftaya/i);assert.doesNotMatch(html,/Kura bekleniyor/);
});
test('completed draw offers no restart or advancement and lists all results',()=>{
 const html=cup.render({...base,is_owner:true,status:'running',drawn_at:'2026-10-14T18:00:00Z',revealed_pairs:32},'draw');
 assert.match(html,/KURA TAMAMLANDI/);assert.doesNotMatch(html,/data-cup-start|data-cup-next/);
});
