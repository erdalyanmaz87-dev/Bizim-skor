const fs=require('fs');
const assert=require('assert');
const theme=fs.readFileSync('theme-ui.js','utf8');
assert(!theme.includes("script.src='ui-integration-loader.js'"),'theme genel UI loaderını yeniden başlatmamalı');
for(const file of ['brand-assets.js','supported-team-ui.js','museum-team-logo-fix.js','admin-supported-team-stats.js']){
  assert(theme.includes(`'${file}'`),`${file} izole takım bundle içinde yüklenmeli`);
}
assert(theme.includes('ensureSupportedTeamBundle'),'izole takım bundle bootstrapı bulunmalı');
console.log('supported team isolated wiring ok');
