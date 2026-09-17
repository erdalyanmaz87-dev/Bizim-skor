const fs=require('fs');
const assert=require('assert');
const supported=fs.readFileSync('supported-team-ui.js','utf8');
const museum=fs.readFileSync('player-museum.js','utf8');
assert(supported.includes('refresh,contextMap')||supported.includes('contextMap,refresh'),'supported-team-ui refresh API dışa açılmalı');
assert(museum.includes('BizimSkorSupportedTeam')&&museum.includes('.refresh'),'müze render sonrası takım logosu doğrudan yenilenmeli');
console.log('museum supported-team logo integration ok');
