const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../champions-league-ui.js'),'utf8');
const migrations=fs.readdirSync(path.join(__dirname,'../supabase/migrations'))
  .filter(name=>name.endsWith('.sql'))
  .map(name=>fs.readFileSync(path.join(__dirname,'../supabase/migrations',name),'utf8'))
  .join('\n');

test('Tahmin Geçmişim Şampiyonlar Ligi haftasını ayrı seçenek olarak sunar',()=>{
  assert.match(html,/champions:1/);
  assert.match(html,/Şampiyonlar Ligi • 1\. Hafta/);
  assert.match(html,/BizimSkorChampionsUI\.loadHistory/);
});

test('Şampiyonlar Ligi geçmişi güvenli oturumla yüklenir',()=>{
  assert.match(ui,/function loadHistory/);
  assert.match(ui,/get_champions_league_history/);
  assert.match(ui,/bizimSkorFriendToken/);
});

test('geçmiş özeti Süper Lig gibi üç kutu ve alt sonuç açıklaması gösterir',()=>{
  for(const label of ['Haftalık Puan','Geçici Sıra','Katılan']){
    assert.match(ui,new RegExp(label));
  }
  assert.doesNotMatch(ui,/<span>Sonuçlanan<\/span>/);
  assert.match(ui,/\$\{completed\}\/\$\{total\} maç sonuçlandı\./);
  assert.match(ui,/predicted_home/);
  assert.match(ui,/real_home/);
});

test('katılımcı sayısı yalnız haftanın bütün maçlarını tahmin edenleri kapsar',()=>{
  assert.match(migrations,/create or replace function public\.get_champions_league_history/i);
  assert.match(migrations,/having count\(distinct p\.fixture_id\)\s*=\s*v_fixture_count/i);
  assert.match(migrations,/friend_session_player\(p_token\)/i);
  assert.match(migrations,/grant execute on function public\.get_champions_league_history[\s\S]*?to anon/i);
});
