import {readdir,readFile,writeFile,mkdir,cp,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
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
html=html.replace('<title>Bizim Skor</title>','<title>BizimSkor Test</title>');
html=html.replace('<body>','<body><!-- ANDROID_TECHNICAL_TEST --><div style="background:#fff3cd;color:#4d3800;padding:10px;text-align:center;font:14px Arial">Android teknik test • Mağaza sürümü değildir • Giriş ve tahminler mevcut canlı hesaba bağlıdır.</div>');
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
</script><script src="account-core.js"></script><script src="account-ui.js"></script></body>`);
for(const name of ['account-core.js','account-ui.js'])await cp(path.join(repo,'mobile',name),path.join(output,name));
for(const name of ['privacy.html','terms.html','account-delete.html'])await cp(path.join(repo,'mobile/policies',name),path.join(output,name));
await writeFile(path.join(output,'index.html'),html);
console.log('Bundled technical-test web assets into mobile/www');
