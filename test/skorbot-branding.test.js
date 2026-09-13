const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const ui=fs.readFileSync(path.join(__dirname,'../robot-prediction-ui.js'),'utf8');

test('kullanıcıya görünen robot markası her yerde SkorBot olur',()=>{
  for(const text of [
    '🤖 SkorBot’un Önerisi',
    '🤖 SkorBot’un Önerisini Boş Maçlara Uygula',
    '<b>🤖 SkorBot’un önerisi:</b>',
    'SkorBot bu haftada en fazla',
    'SkorBot önerisi henüz yükleniyor',
    'SkorBot için bu haftanın maçları henüz yüklenemedi',
    'SkorBot kullanım hakkın doldu'
  ]) assert.ok(ui.includes(text),text);
});

test('eski kullanıcı metinleri ekranda kalmaz',()=>{
  for(const oldText of [
    '🤖 Robotun Önerisi',
    'Robot bu haftada en fazla',
    'Robot önerisi henüz yükleniyor',
    'Robot için bu haftanın maçları henüz yüklenemedi',
    'Robot kullanım hakkın doldu',
    'Bu maç için robot tahmini henüz hazır değil'
  ]) assert.ok(!ui.includes(oldText),oldText);
});
