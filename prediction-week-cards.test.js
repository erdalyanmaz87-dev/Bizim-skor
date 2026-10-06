const assert=require('assert');
const ui=require('./prediction-week-cards.js');
const cards=ui.buildCards(
  [{week:7,complete:false,deadline:'2026-10-10T13:00:00Z'},{week:8,complete:false,deadline:'2026-10-19T17:00:00Z'}],
  {competition:'champions',week:2,complete:false,deadline:'2026-10-14T19:00:00Z'},
  [{competition:'nations',week:3,complete:true,deadline:'2026-10-01T18:45:00Z'},{competition:'nations',week:4,complete:true,deadline:'2026-10-04T18:45:00Z'},{competition:'nations',week:5,complete:false,deadline:'2026-11-12T17:00:00Z'},{competition:'nations',week:6,complete:false,deadline:'2026-11-15T19:45:00Z'}]
);
assert.deepStrictEqual(cards.map(x=>x.label),['Süper Lig 7. Hafta','Süper Lig 8. Hafta','Şampiyonlar Ligi 2. Hafta','UEFA Uluslar Ligi 5. Hafta','UEFA Uluslar Ligi 6. Hafta']);
assert.strictEqual(cards[0].target.type,'league');
assert.strictEqual(cards[1].target.week,8);
assert.strictEqual(ui.selectionValue(cards[1]),'8');
assert.strictEqual(cards[2].target.type,'champions');
assert.strictEqual(cards[3].target.type,'nations');
assert.strictEqual(cards[3].target.week,5);
assert.strictEqual(cards[4].target.week,6);
assert.deepStrictEqual(cards.map(x=>x.theme),['super','super','champions','nations','nations']);
assert(ui.render(cards).includes('theme-super'));
assert(ui.render(cards).includes('theme-champions'));
assert(ui.render(cards).includes('theme-nations'));
assert.strictEqual(typeof ui.championsTabSelector,'function');
assert.strictEqual(ui.championsTabSelector(),'[data-tab="championsPred"]');
assert.strictEqual(ui.canEditBeforeWeekStart(Date.parse('2026-09-18T16:59:59Z'),Date.parse('2026-09-18T17:00:00Z')),true);
assert.strictEqual(ui.canEditBeforeWeekStart(Date.parse('2026-09-18T17:00:00Z'),Date.parse('2026-09-18T17:00:00Z')),false);
assert.strictEqual(cards[0].deadline,'2026-10-10T13:00:00Z');
assert.strictEqual(cards[1].deadline,'2026-10-19T17:00:00Z');
assert.strictEqual(cards[2].deadline,'2026-10-14T19:00:00Z');
assert.strictEqual(cards[3].deadline,'2026-11-12T17:00:00Z');
assert.strictEqual(cards[4].deadline,'2026-11-15T19:45:00Z');
assert.strictEqual(ui.countdownText('2026-09-08T16:45:00Z','2026-09-06T06:45:00Z'),'⏳ Tahmine son 2 gün 10 saat');
assert.strictEqual(ui.countdownText('2026-09-08T16:45:00Z','2026-09-08T10:30:00Z'),'⏳ Tahmine son 7 saat');
assert.strictEqual(ui.countdownText('2026-09-08T16:45:00Z','2026-09-08T16:03:30Z'),'⏳ Tahmine son 42 dakika');
assert.strictEqual(ui.countdownText('2026-09-08T16:45:00Z','2026-09-08T16:45:00Z'),'🔒 Tahmin süresi doldu');
assert.strictEqual(ui.countdownText('2026-09-08T16:45:00Z','2026-09-06T06:45:00Z',true),'⏳ Maçların başlamasına 2 gün 10 saat');
assert.strictEqual(ui.countdownText('2026-09-08T16:45:00Z','2026-09-08T16:03:30Z',true),'⏳ Maçların başlamasına 42 dakika');
assert.strictEqual(ui.countdownText('2026-09-08T16:45:00Z','2026-09-08T16:45:00Z',true),'⚽ Maçlar başladı');
const missingMarkup=ui.render(cards,'2026-09-06T06:45:00Z');
assert(missingMarkup.includes('data-countdown-deadline="2026-10-19T17:00:00Z"'));
assert(missingMarkup.includes('⏳ Tahmine son'));
assert(!missingMarkup.includes('undefined'));
console.log('prediction-week-cards ok');
