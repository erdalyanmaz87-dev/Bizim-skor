const fs=require('fs');
const assert=require('assert');
const bootstrap=fs.readFileSync('supported-team-bootstrap.js','utf8');
assert(bootstrap.includes("'player-identity.js'"),'player identity renderer bootstrap üzerinden yüklenmeli');
assert(!bootstrap.includes("'supported-team-ranking-logos.js'"),'sonradan DOM tarayan logo katmanı bootstrapta olmamalı');
const identity=fs.readFileSync('player