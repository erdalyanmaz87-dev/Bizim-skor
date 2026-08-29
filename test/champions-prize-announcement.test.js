const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=name=>fs.existsSync(path.join(root,name))?fs.readFileSync(path.join(root,name),'utf8'):'';
const ui=read('champions-prize-announcement.js');
const html=read('index.html');
const sql=read('supabase/migrations/20260829164919_champions_prize_announcement.sql');

test('ödül duyurusu yalnız doğrulanmış oyuncuya sunulur',()=>{
  assert.match(sql,/friend_session_player\(p_token\)/i);
  assert.match(sql,/now\(\)\s*>=\s*a\.starts_at/i);
  assert.match(sql,/now\(\)\s*<\s*a\.ends_at/i);
  assert.match(sql,/not exists[\s\S]*game_announcement_acknowledgements/i);
});

test('duyuru onayı oyuncu ve kampanya bazında sunucuda saklanır',()=>{
  assert.match(sql,/primary key\s*\(announcement_id,\s*player_name\)/i);
  assert.match(sql,/insert into public\.game_announcement_acknowledgements/i);
  assert.match(sql,/on conflict\s*\(announcement_id,\s*player_name\)\s*do nothing/i);
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/revoke all on table public\.game_announcement_acknowledgements from anon, authenticated/i);
});

test('kampanya veritabanında uygulandığı andan itibaren beş gün sürer',()=>{
  assert.match(sql,/now\(\)\s*\+\s*interval\s*'5 days'/i);
});

test('modal top görselini, ödül metnini ve tamam düğmesini gösterir',()=>{
  assert.match(ui,/champions-prize-ball-v1\.webp/);
  assert.match(ui,/Şampiyonlar Ligi Büyük Ödülü/);
  assert.match(ui,/Sezon sonu Şampiyonlar Ligi sıralamasını 1\. bitiren yarışmacıya bu futbol topu hediye!/);
  assert.match(ui,/Tamam, Tahmine Başla/);
  assert.match(html,/champions-prize-announcement\.js/);
});

test('tamam düğmesi güvenli RPC başarılı olunca modalı kapatır',()=>{
  assert.match(ui,/get_pending_game_announcement/);
  assert.match(ui,/acknowledge_game_announcement/);
  assert.match(ui,/if\(q\.error\)throw q\.error/);
  assert.match(ui,/close\(\)/);
});

test('girişsiz veya kampanyası bitmiş oyuncuya modal açılmaz',()=>{
  assert.match(ui,/if\(!token\)return false/);
  assert.match(ui,/if\(!row\)return false/);
});
