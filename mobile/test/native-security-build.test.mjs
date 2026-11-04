import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
test('native bundle has one account controller and no competing web account UI',async()=>{
 const html=await readFile(new URL('www/index.html',root),'utf8');
 assert.doesNotMatch(html,/<script[^>]+src="web-account-(?:core|ui)\.js/);
 assert.match(html,/<script src="account-ui\.js"><\/script>/);
});
test('native CSP authorizes only the final inline script hashes',async()=>{
 const html=await readFile(new URL('www/index.html',root),'utf8');
 const policy=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/)?.[1];
 assert.ok(policy,'Native HTML must contain CSP');assert.match(policy,/object-src 'none'/);assert.match(policy,/connect-src 'self' https:\/\/paevhzaixlozrrggnzni.supabase.co/);
 const scripts=policy.match(/script-src ([^;]+)/)?.[1]||'';assert.doesNotMatch(scripts,/unsafe-inline|unsafe-eval/);
 for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())assert.ok(scripts.includes("'sha256-"+createHash('sha256').update(m[2]).digest('base64')+"'"));
});
test('release source identity matches the existing production APK package',async()=>{
 const config=JSON.parse(await readFile(new URL('capacitor.config.json',root),'utf8'));
 assert.equal(config.appId,'com.bizimskor.app');assert.equal(config.appName,'BizimSkor');
 const gradle=await readFile(new URL('android/app/build.gradle',root),'utf8');
 assert.match(gradle,/namespace = "com\.bizimskor\.app"/);assert.match(gradle,/applicationId "com\.bizimskor\.app"/);
 const java=await readFile(new URL('android/app/src/main/java/com/bizimskor/app/MainActivity.java',root),'utf8');assert.match(java,/package com\.bizimskor\.app;/);
 const html=await readFile(new URL('www/index.html',root),'utf8');assert.doesNotMatch(html,/ANDROID_TECHNICAL_TEST|<title>BizimSkor Test<\/title>/);
});

test('native source keeps backup and cleartext traffic disabled',async()=>{const xml=await readFile(new URL('android/app/src/main/AndroidManifest.xml',root),'utf8');assert.match(xml,/android:allowBackup="false"/);assert.match(xml,/android:usesCleartextTraffic="false"/);});
