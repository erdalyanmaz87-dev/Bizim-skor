import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const corePath=path.join(root,'supabase/functions/admin-statistics/core.mjs');
const dashboardPath=path.join(root,'admin-statistics-dashboard.js');

test('yönetici istatistik çekirdeği oyuncuları istenen gruplara ayırır',async()=>{
  assert.equal(fs.existsSync(corePath),true,'admin-statistics core.mjs eksik');
  const {buildAdminStatistics}=await import(pathToFileURL(corePath).href+`?t=${Date.now()}`);
  const data=buildAdminStatistics({
    now:'2026-09-13T00:10:00+03:00',
    players:[
      {name:'Ayşe',is_active:true,created_at:'2026-09-01T10:00:00Z',last_seen:'2026-09-12T20:00:00Z'},
      {name:'Bora',is_active:true,created_at:'2026-09-01T10:00:00Z',last_seen:'2026-09-12T19:00:00Z'},
      {name:'Cem',is_active:true,created_at:'2026-09-01T10:00:00Z',last_seen:'2026-09-12T18:00:00Z'}
    ],
    fixtures:[
      {id:1,season:'2026/27',week:5,kickoff:'2026-09-13T16:00:00Z'},
      {id:2,season:'2026/27',week:5,kickoff:'2026-09-14T16:00:00Z'}
    ],
    predictions:[
      {player_name:'Ayşe',fixture_id:1},{player_name:'Ayşe',fixture_id:2},{player_name:'Bora',fixture_id:1}
    ],
    launches:[
      {player_name:'Ayşe',launched_at:'2026-09-12T21:03:00Z'},
      {player_name:'Ayşe',launched_at:'2026-09-12T21:30:00Z'},
      {player_name:'Bora',launched_at:'2026-09-12T22:00:00Z'}
    ],
    subscriptions:[{player_name:'Ayşe'},{player_name:'Cem'}],
    reminderEvents:[
      {player_name:'Bora',week:5,competition:'super',event_type:'later',occurred_at:'2026-09-12T19:00:00Z'},
      {player_name:'Bora',week:5,competition:'super',event_type:'yes',occurred_at:'2026-09-12T20:00:00Z'},
      {player_name:'Bora',week:5,competition:'super',event_type:'completed',occurred_at:'2026-09-12T20:10:00Z'},
      {player_name:'Cem',week:5,competition:'super',event_type:'later',occurred_at:'2026-09-12T20:30:00Z'}
    ]
  });

  assert.equal(data.week,5);
  assert.deepEqual(data.completed.map(x=>x.player_name),['Ayşe']);
  assert.deepEqual(data.incomplete.map(x=>x.player_name),['Bora','Cem']);
  assert.deepEqual(data.notifications.map(x=>x.player_name),['Ayşe','Cem']);
  assert.deepEqual(data.reminder_yes.map(x=>x.player_name),['Bora']);
  assert.deepEqual(data.reminder_later.map(x=>x.player_name),['Cem']);
  assert.equal(data.reminder_yes[0].reminder_completed,true);
  assert.equal(data.summary.completed,1);
  assert.equal(data.summary.incomplete,2);
  assert.equal(data.summary.notifications_enabled,2);
  assert.equal(data.summary.reminder_yes,1);
  assert.equal(data.summary.reminder_later,1);
});

test('yönetici asistanı isim listelerini ayrı başlıklarda gösterir',()=>{
  const source=fs.readFileSync(dashboardPath,'utf8');
  assert.match(source,/Güncel Hafta Tahmin Yapanlar/);
  assert.match(source,/Güncel Hafta Tahmin Yapmayanlar/);
  assert.match(source,/Bildirimleri Açanlar/);
  assert.match(source,/24 Saat Uyarısı · Evet/);
  assert.match(source,/24 Saat Uyarısı · Daha Sonra/);
});
