import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const root=new URL('../www/',import.meta.url);
test('bundled app includes its entry and local scripts',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8');
 for(const [,src] of html.matchAll(/<script[^>]*src="([^"]+)"/g)){
  if(!src.startsWith('https://'))await readFile(new URL(src.split('?')[0],root));
 }
 assert.match(html,/ANDROID_TECHNICAL_TEST/);
 assert.match(html,/!window\.Capacitor/);
 assert.doesNotMatch(html,/<script src="push-notifications\.js"/);
});
test('test and administrative source files stay outside app bundle',async()=>{
 const files=await readdir(root);
 assert.equal(files.some(x=>x.endsWith('.test.js')),false);
 assert.equal(files.includes('admin.html'),false);
 assert.equal(files.includes('sw.js'),false);
});
test('native friend invites use public domain instead of local webview origin',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8');
 assert.doesNotMatch(html,/url=location\.origin\+location\.pathname\+'\?lig='/);
 assert.match(html,/url='https:\/\/bizimskor\.com\/\?lig='/);
});
test('email JWT storage is isolated from legacy anon plus game-token RPC client',async()=>{
 const html=await readFile(new URL('index.html',root),'utf8');
 assert.match(html,/const sb=supabase\.createClient\([^;]+persistSession:false,autoRefreshToken:false,detectSessionInUrl:false/);
 assert.match(html,/client:supabase\.createClient\(sb\.supabaseUrl,sb\.supabaseKey,\{auth:\{storageKey:'bizimskor-mobile-auth'/);
});
