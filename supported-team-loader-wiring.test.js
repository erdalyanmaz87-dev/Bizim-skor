const fs=require('fs');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const theme=fs.readFileSync('theme-ui.js','utf8');
const wiredDirectly=html.includes('<script src="ui-integration-loader.js" defer></script>');
const wiredViaTheme=theme.includes("script.src='ui-integration-loader.js'")&&theme.includes('ensureIntegrationLoader');
assert(wiredDirectly||wiredViaTheme,'UI entegrasyon loaderı gerçek sayfa yükleme zincirine bağlı olmalı');
console.log('supported team loader wiring ok');
