import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
test('static build removes previously deployed files outside the current asset allowlist',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'bs-security-build-'));
 try{
  await fs.mkdir(path.join(dir,'tools'));await fs.mkdir(path.join(dir,'assets'));await fs.mkdir(path.join(dir,'dist'));
  await fs.copyFile(new URL('../tools/build-static.mjs',import.meta.url),path.join(dir,'tools/build-static.mjs'));
  await fs.writeFile(path.join(dir,'index.html'),'<html><head><script>window.ready=true;</script></head><body>OK</body></html>');
  await fs.writeFile(path.join(dir,'vercel.json'),JSON.stringify({headers:[]}));
  await fs.writeFile(path.join(dir,'dist','old-backup.sql'),'private stale content');await fs.writeFile(path.join(dir,'dist','deleted.js'),'old vulnerable code');
  execFileSync(process.execPath,[path.join(dir,'tools/build-static.mjs')],{env:{...process.env,SECURITY_REVIEW_PREVIEW:'0'}});
  assert.equal((await fs.readdir(path.join(dir,'dist'))).includes('old-backup.sql'),false);
  assert.equal((await fs.readdir(path.join(dir,'dist'))).includes('deleted.js'),false);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
