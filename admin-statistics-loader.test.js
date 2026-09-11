const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('ui-integration-loader.js','utf8');
assert.strictEqual(src.split('async function loadAll(').length-1,1);
assert(src.includes('admin-statistics-utils.js'));
assert(src.includes('admin-statistics-dashboard.js'));
assert(src.includes('admin-statistics-dashboard.css'));
console.log('admin statistics loader ok');
