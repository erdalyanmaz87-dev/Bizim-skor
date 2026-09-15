const fs=require('fs');
const text=fs.readFileSync('brand-preview-checklist.md','utf8');
if(!text.includes('Futbol birlikte daha güzel'))throw Error('slogan checklist missing');
if(!text.includes('Erdal-only'))throw Error('admin visibility checklist missing');
console.log('brand preview checklist ok');
