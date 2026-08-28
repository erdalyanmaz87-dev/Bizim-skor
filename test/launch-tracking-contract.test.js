const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync('index.html','utf8');
const migrationDir=path.join('supabase','migrations');
const migrationFile=fs.existsSync(migrationDir)?fs.readdirSync(migrationDir).find(x=>x.includes('launch_tracking')):null;
const sql=migrationFile?fs.readFileSync(path.join(migrationDir,migrationFile),'utf8'):'';

test('doğrulanmış oturum açılış kaydı gönderemez',()=>{
  assert.match(sql,/friend_session_player\(p_token\)/);
  assert.match(sql,/if v_player is null then[\s\S]*raise exception/i);
});

test('açılış tablosu oyuncular tarafından doğrudan okunamaz',()=>{
  assert.match(sql,/enable row level security/i);
  assert.match(sql,/revoke all on table public\.player_launch_events from anon, authenticated/i);
  assert.doesNotMatch(sql,/create policy[\s\S]*player_launch_events/i);
});

test('uygulama doğrulanmış oturumdan sonra açılış türünü kaydeder',()=>{
  assert.match(html,/launch-context\.js/);
  assert.match(html,/record_player_launch/);
  assert.match(html,/BizimSkorLaunch\.detectLaunchContext/);
});
