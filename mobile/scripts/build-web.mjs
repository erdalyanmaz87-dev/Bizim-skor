import {readdir,readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {shouldBundle,transformWebSource} from '../store-cleanup.mjs';
const repo=fileURLToPath(new URL('../../',import.meta.url));
const output=path.join(repo,'mobile/www');
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
for(const entry of await readdir(repo,{withFileTypes:true})){
 const name=entry.name;
 if(!entry.isFile()||name.endsWith('.test.js')||['sw.js','push-sw.js'].includes(name))continue;
 if(!shouldBundle(name))continue;
 if(/\.(js|css|webmanifest)$/.test(name))await writeFile(path.join(output,name),transformWebSource(name,await readFile(path.join(repo,name),'utf8')));
 else if(/\.(png|svg)$/.test(name))await cp(path.join(repo,name),path.join(output,name));
}
let html=await readFile(path.join(repo,'index.html'),'utf8');
html=transformWebSource('index.html',html);
html=html.replace('<title>Bizim Skor</title>','<title>BizimSkor</title>');
html=html.replace(/<script\b[^>]*src="web-account-(?:core|ui)\.js[^"]*"[^>]*><\/script>/g,'');
html=html.replace(/<script src="push-notifications\.js" defer><\/script>/,'');
html=html.replace("if('serviceWorker'in navigator){","if(!window.Capacitor && 'serviceWorker'in navigator){");
html=html.replace("url=location.origin+location.pathname+'?lig='", "url='https://bizimskor.com/?lig='");
// Game RPCs accept anon + a game p_token; account RPCs require an Auth JWT.
const gameClient="supabase.createClient('https://paevhzaixlozrrggnzni.supabase.co','sb_publishable_gN4iWcOYffT1-bdQs6cBlw_ay1Rv7Do')";
if(!html.includes(gameClient))throw new Error('Game client anchor changed; review account isolation');
html=html.replace(gameClient,gameClient.slice(0,-1)+",{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}})");
html=html.replace('</head>',`<style>
#newPlayer>:not(#mobileAccountPanel),#profileForm{display:none!important}
#mobileAccountPanel{padding:8px 0;max-width:560px;margin:auto}
#mobileAccountPanel label{display:block;margin:12px 0 5px;font-size:14px}
#mobileAccountPanel input[type=checkbox]{width:24px;height:24px}
#mobileAccountPanel button{min-height:44px;cursor:pointer}
#mobileAccountPanel button:disabled{opacity:.55;cursor:wait}
#mobileAccountPanel a{color:inherit;text-decoration:underline}
#mobileAccountMessage{font-size:14px;line-height:1.5;min-height:20px}
</style></head>`);
// The email upgrade is additive: existing technical-test sessions continue while
// the sender and OTP mail templates are configured. Never recreate an old player.
html=html.replace('</body>',`<script>
window.BizimSkorMobileHooks={client:supabase.createClient(sb.supabaseUrl,sb.supabaseKey,{auth:{storageKey:'bizimskor-mobile-auth',persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}}),deviceId:ensureDeviceId,showPlayer:showName,clearPlayer:clearRememberedPlayer,refresh:refreshAfterAuthentication,
legacyRestore:restoreRememberedPlayer,installRestore:fn=>{restoreRememberedPlayer=fn},
legacyLogin:async(name,pin)=>{const previous=localStorage.getItem('bizimSkorFriendToken');document.getElementById('loginName').value=name;document.getElementById('loginPin').value=pin;try{await loginAction();if(!localStorage.getItem('bizimSkorFriendToken')||localStorage.getItem('bizimSkorFriendToken')===previous)throw new Error('Oyuncu adı veya PIN doğrulanamadı.')}finally{document.getElementById('loginPin').value='';}}};
</script><script src="android-ui.js"></script><script src="account-core.js"></script><script src="account-ui.js"></script><script src="native-reminders.js"></script></body>`);
for(const name of ['account-core.js','account-ui.js','android-ui.js','native-reminders.js'])await cp(path.join(repo,'mobile',name),path.join(output,name));
const flagCodes=Object.values((await import('../android-ui.js')).default.codes);
await mkdir(path.join(output,'flags'),{recursive:true});
for(const code of new Set(flagCodes))await cp(path.join(repo,'mobile/node_modules/flag-icons/flags/4x3',code+'.svg'),path.join(output,'flags',code+'.svg'));
await cp(path.join(repo,'mobile/node_modules/flag-icons/LICENSE'),path.join(output,'flags/LICENSE.txt'));
for(const name of ['privacy.html','terms.html','account-delete.html'])await cp(path.join(repo,'mobile/policies',name),path.join(output,name));
// Hash the final native HTML after all Android-only transforms and hooks.
const hashes=[];
for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi))if(!/\bsrc\s*=/.test(m[1])&&m[2].trim())hashes.push("'sha256-"+createHash('sha256').update(m[2]).digest('base64')+"'");
const policy=["default-src 'self'",`script-src 'self' https://cdn.jsdelivr.net ${hashes.join(' ')}`,"script-src-attr 'none'","style-src 'self' 'unsafe-inline'","img-src 'self' data: blob: https:","font-src 'self' data:","connect-src 'self' https://paevhzaixlozrrggnzni.supabase.co wss://paevhzaixlozrrggnzni.supabase.co","object-src 'none'","base-uri 'none'","form-action 'self'","frame-src 'self'","worker-src 'self' blob:"].join('; ');
html=html.replace(/<head>/i,`<head><meta http-equiv="Content-Security-Policy" content="${policy}">`);
await writeFile(path.join(output,'index.html'),html);
console.log('Bundled production web assets with CSP into mobile/www');
