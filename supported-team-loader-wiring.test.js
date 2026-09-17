const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
assert(html.includes('<script src="ui-integration-loader.js" defer></script>'),'index.html UI entegrasyon loaderını yüklemeli');
console.log('supported team loader wiring ok');
