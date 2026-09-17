const fs=require('fs');
const assert=require('assert');
const src=fs.readFileSync('dense-ranking-ui.js','utf8');
assert(src.includes('BizimSkorPlayerIdentity'),'dense ranking oyuncu kimliğini doğrudan render etmelidir');
assert(src.includes('identity(r.name)'),'haftalık sıralama adı logo+isim kimliğiyle üretilmelidir');
assert(src.includes('identity(r.name)')&&src.includes('generalBoard'),'genel sıralama da aynı kimlik rendererını kullanmalıdır');
console.log('dense ranking player identity ok');
