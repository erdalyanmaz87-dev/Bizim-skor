const fs=require('fs');
const assert=require('assert');
const patch=fs.readFileSync('museum-team-logo-fix.js','utf8');
const loader=fs.readFileSync('ui-integration-loader.js','utf8');

assert(patch.includes('get_supported_team_context'),'takım bağlamı sayfa başına tek yüklenmeli');
assert(patch.includes('#weeklyRankingBoard'),'Süper Lig haftalık sıralaması hedeflenmeli');
assert(patch.includes('#generalBoard'),'genel sıralama hedeflenmeli');
assert(patch.includes('#friendLeagueRanking'),'arkadaş ligi hedeflenmeli');
assert(patch.includes('#championsRankingBoard'),'Şampiyonlar Ligi hedeflenmeli');
assert(patch.includes('#championsWeeklyRankingBoard'),'Şampiyonlar Ligi haftalık hedeflenmeli');
assert(patch.includes('.league-player'),'Arena oyuncu satırları hedeflenmeli');
assert(patch.includes('.bs-museum-head h2'),'Müze başlığı hedeflenmeli');
assert(patch.includes('querySelector?.(\'.bs-supported-team-logo\')'),'aynı logo ikinci kez eklenmemeli');
assert(loader.includes("'museum-team-logo-fix.js'"),'takım logo düzeltmesi loader üzerinden yüklenmeli');
console.log('supported-team real render targets ok');
