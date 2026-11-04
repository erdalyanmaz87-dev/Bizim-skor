import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const output=path.join(root,'dist');
const preview=process.env.SECURITY_REVIEW_PREVIEW==='1';
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(output,{recursive:true});
// Only public assets enter the deployment. SQL, test files, repository metadata,
// sources, backups and release instructions are never publicly served.
for(const entry of fs.readdirSync(root,{withFileTypes:true})){
 if(entry.isFile()&&/\.(?:html|js|css|png|webp|svg|ico|webmanifest|jpg|jpeg|gif|woff2?)$/.test(entry.name)&&!entry.name.includes('.test.')&&entry.name!=='vercel.json')
  fs.copyFileSync(path.join(root,entry.name),path.join(output,entry.name));
}
fs.cpSync(path.join(root,'assets'),path.join(output,'assets'),{recursive:true});
if(preview){fs.copyFileSync(path.join(root,'security-review.html'),path.join(output,'index.html'));}
const hashes=new Set();
for(const name of fs.readdirSync(output).filter(name=>name.endsWith('.html'))){
 const html=fs.readFileSync(path.join(output,name),'utf8');
 for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/\bsrc\s*=/.test(match[1])&&match[2].trim())hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
 }
}
const policy=["default-src 'self'",`script-src 'self' https://cdn.jsdelivr.net ${[...hashes].join(' ')}`,"script-src-attr 'none'","style-src 'self' 'unsafe-inline'","img-src 'self' data: blob: https:","font-src 'self' data:",preview?"connect-src 'self'":"connect-src 'self' https://paevhzaixlozrrggnzni.supabase.co wss://paevhzaixlozrrggnzni.supabase.co","object-src 'none'","base-uri 'none'","form-action 'self'","frame-ancestors 'none'","frame-src 'self'","worker-src 'self' blob:"].join('; ');
const config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
delete config.buildCommand;delete config.outputDirectory;
config.headers.push({source:'/(.*)',headers:[{key:'Content-Security-Policy',value:policy},{key:'X-Content-Type-Options',value:'nosniff'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}]});
fs.writeFileSync(path.join(output,'vercel.json'),JSON.stringify(config,null,2)+'\n');
// Meta also travels with HTML into a future native asset bundle. frame-ancestors
// is header-only, so exclude it from the meta form.
for(const name of fs.readdirSync(output).filter(name=>name.endsWith('.html'))){
 const file=path.join(output,name),html=fs.readFileSync(file,'utf8');
 const meta=`<meta http-equiv="Content-Security-Policy" content="${policy.replace(/; frame-ancestors 'none'/,'')}">`;
 fs.writeFileSync(file,html.replace(/<head>/i,'<head>'+meta));
}
console.log(`Static ${preview?'isolated security review':'application'} build: ${hashes.size} inline script hashes, CSP enabled, output dist/`);
