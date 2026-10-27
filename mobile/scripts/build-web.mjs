import {readdir,readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const repo=fileURLToPath(new URL('../../',import.meta.url));
const output=path.join(repo,'mobile/www');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const entry of await readdir(repo,{withFileTypes:true})){
 const name=entry.name;
 if(entry.isDirectory()&&name==='assets')await cp(path.join(repo,name),path.join(output,name),{recursive:true});
 if(!entry.isFile()||name.endsWith('.test.js')||['sw.js','push-sw.js'].includes(name))continue;
 if(/\.(js|css|png|svg|webmanifest)$/.test(name))await cp(path.join(repo,name),path.join(output,name));
}
let html=await readFile(path.join(repo,'index.html'),'utf8');
html=html.replace('<title>Bizim Skor</title>','<title>BizimSkor Test</title>');
html=html.replace('<body>','<body><!-- ANDROID_TECHNICAL_TEST --><div style="background:#fff3cd;color:#4d3800;padding:10px;text-align:center;font:14px Arial">Android teknik test • Mağaza sürümü değildir • Giriş ve tahminler mevcut canlı hesaba bağlıdır.</div>');
html=html.replace(/<script src="push-notifications\.js" defer><\/script>/,'');
html=html.replace("if('serviceWorker'in navigator){","if(!window.Capacitor && 'serviceWorker'in navigator){");
await writeFile(path.join(output,'index.html'),html);
console.log('Bundled technical-test web assets into mobile/www');
