const assert=require('assert');
const fs=require('fs');
const src=fs.readFileSync(require.resolve('./prediction-visibility-logo-fix.js'),'utf8');
assert.match(src,/\.saved[^`]*color:#0f172a!important/i,'saved prediction panel must have dark readable text');
assert.match(src,/opportunity-match[^`]*color:#0f172a!important/i,'light opportunity rows must use dark text');
assert.match(src,/removeAttribute\(['"]data-bs-brand-team['"]\)/,'stale logo decoration marker must be cleared');
assert.match(src,/addEventListener\(['"]change['"]/,'week changes must trigger logo repair');
assert.match(src,/MutationObserver/,'async week rendering must be observed');
console.log('prediction visibility/logo regression coverage ok');
