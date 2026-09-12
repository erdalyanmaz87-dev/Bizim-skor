const assert=require('assert');
const u=require('./admin-statistics-utils');
const rows=[
 {name:'Ali',last_seen:'2026-09-11T18:00:00Z',registered_at:'2026-09-11T09:00:00Z',prediction_complete:true,reminder:'yes',reminder_completed:true},
 {name:'Veli',last_seen:'2026-09-11T17:00:00Z',registered_at:'2026-09-01T09:00:00Z',prediction_complete:false,reminder:'later',reminder_completed:false},
 {name:'Ayşe',last_seen:'2026-09-10T17:00:00Z',registered_at:'2026-09-01T09:00:00Z',prediction_complete:true,reminder:null,reminder_completed:false}
];
const s=u.summarize(rows,'2026-09-11');
assert.deepStrictEqual(s,{activeToday:2,newToday:1,completed:2,incomplete:1,reminderSeen:2,reminderYes:1,reminderLater:1,reminderConverted:1,participation:67});
assert.deepStrictEqual(u.attention(rows,'2026-09-11').map(x=>x.name),['Veli']);
assert.strictEqual(u.formatClock('2026-09-11T18:05:00Z','Europe/Istanbul'),'21:05');
console.log('admin statistics utils: ok');
