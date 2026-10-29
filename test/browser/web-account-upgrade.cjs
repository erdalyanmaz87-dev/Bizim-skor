const {chromium}=require('playwright');
const chromiumPackage=require(process.env.BIZIMSKOR_CHROMIUM_PACKAGE||'@sparticuz/chromium');
const packagedChromium=chromiumPackage.default||chromiumPackage;
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const fixture=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/web-account-ui.css"><style>body{font-family:Arial;margin:12px}.full{width:100%;margin-top:10px}button{padding:12px;border:0;border-radius:12px}input{box-sizing:border-box;padding:10px}.hide{display:none}</style><section id="home"><div id="dailyMatches">Bugünün Maçları</div></section><div id="loginBox"><input id="loginName"><input id="loginPin"><button id="openPinReset">Şifremi unuttum</button></div><div id="pinResetMount" class="hide"><input id="resetName"></div><script>
window.testState={linked:false,calls:[],legacyLogins:0,otpError:false};
if(!localStorage.getItem('fixtureInitialized')){localStorage.setItem('fixtureInitialized','1');localStorage.setItem('bizimSkorName','Erdal');localStorage.setItem('bizimSkorFriendToken','legacy-token');}
const ensureDeviceId=()=> 'fixture-device';
const showName=()=>window.dispatchEvent(new Event('bizimskor:player-shown'));
const refreshAfterAuthentication=()=>{};const recordVerifiedLaunch=()=>Promise.resolve();
const loginAction=()=>testState.legacyLogins++;const registerAction=()=>{};
window.BizimSkorAuthActions={bindActions:a=>window.testActions=a};
const user={id:'u1',email:'person@example.com',email_confirmed_at:'2026-10-29'};
const sb={supabaseUrl:'https://fixture.invalid',supabaseKey:'publishable',rpc:async(name,args)=>{testState.calls.push([name,args]);return {data:{player_name:'Erdal',linked:testState.linked}}}};
const authClient={auth:{setSession:async()=>({}),getUser:async()=>({data:{user}}),verifyOtp:async()=>testState.otpError?{error:{}}:{data:{session:{user}}},updateUser:async()=>({data:{user}}),signOut:async()=>({})},rpc:async(name,args)=>{testState.calls.push([name,args]);if(name==='mobile_account_status')return {data:{linked:testState.linked,player_name:'Erdal'}};if(name==='mobile_link_player'){testState.linked=true;return {data:{player_name:'Erdal'}}}return {data:{player_name:'Erdal',token:'new-token'}}},functions:{invoke:async(name,{body})=>{testState.calls.push(['gateway',body]);return {data:body.action==='login'?{session:{access_token:'access',refresh_token:'refresh',user}}:{needsConfirmation:true}}}}};
const supabase={createClient:()=>authClient};
</script><script src="/web-account-core.js"></script><script src="/web-account-ui.js"></script></html>`;
(async()=>{
 const browsers=[['desktop', {width:1280,height:900}],['mobile', {width:390,height:844}]];
 for(const [name,viewport] of browsers){
  const browser=await chromium.launch({headless:true,args:packagedChromium.args,executablePath:process.env.BIZIMSKOR_CHROMIUM||await packagedChromium.executablePath()});const page=await browser.newPage({viewport});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('http://account.test/**',route=>{const url=new URL(route.request().url());if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:fixture});const file=path.join(root,url.pathname);return route.fulfill({contentType:file.endsWith('.css')?'text/css':'text/javascript',body:fs.readFileSync(file)});});
  await page.goto('http://account.test/');await page.locator('#emailUpgradeDialog[open]').waitFor({timeout:5000}).catch(async e=>{console.log('PAGE ERRORS',errors);console.log(await page.locator('body').innerText());throw e;});
  assert.equal(await page.locator('#emailUpgradeCard').isVisible(),true);
  await page.screenshot({path:'/tmp/bizim-email-'+name+'.png'});await page.getByRole('button',{name:'Daha sonra, oyuna devam et'}).click();
  await page.evaluate(()=>dispatchEvent(new Event('bizimskor:player-shown')));assert.equal(await page.locator('#emailUpgradeDialog').isVisible(),false);
  await page.reload();await page.locator('#emailUpgradeDialog[open]').waitFor();
  await page.getByRole('button',{name:'E-posta bağla ve şifre oluştur',exact:true}).last().click();
  await page.getByLabel('E-posta adresin').fill('person@example.com');await page.getByLabel('Şifre (en az 8 karakter)',{exact:true}).fill('secret123');await page.getByLabel('Şifre tekrar',{exact:true}).fill('secret123');
  await page.getByRole('button',{name:'Doğrulama kodu gönder'}).click();await page.getByLabel('Doğrulama kodu',{exact:true}).waitFor();
  await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.getByLabel('Doğrulama kodu',{exact:true}).isVisible(),true);
  await page.getByLabel('Doğrulama kodu',{exact:true}).fill('123456');await page.getByRole('button',{name:'Doğrula ve hesabımı bağla'}).click();await page.getByRole('heading',{name:'Hesabın hazır ✓'}).waitFor();
  assert.equal(await page.locator('#emailUpgradeCard').isVisible(),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('bizimSkorName')),'Erdal');assert.equal(await page.evaluate(()=>localStorage.getItem('bizimSkorFriendToken')),'legacy-token');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Oyuna devam et',exact:true}).click();
  for(const identifier of ['Erdal','person@example.com']){await page.locator('#loginName').fill(identifier);await page.locator('#loginPin').fill('secret123');await page.evaluate(()=>testActions.login());assert.equal(await page.evaluate(()=>testState.calls.filter(c=>c[0]==='gateway').at(-1)[1].identifier),identifier);}
  await page.locator('#loginName').fill('Erdal');await page.locator('#loginPin').fill('1234');await page.evaluate(()=>testActions.login());assert.equal(await page.evaluate(()=>testState.legacyLogins),1);
  await page.evaluate(()=>{testState.linked=false;localStorage.setItem('bizimSkorFriendToken','other-token');dispatchEvent(new Event('bizimskor:player-shown'));});await page.locator('#emailUpgradeDialog[open]').waitFor();
  await page.evaluate(()=>{localStorage.removeItem('bizimSkorName');localStorage.removeItem('bizimSkorFriendToken');dispatchEvent(new Event('bizimskor:logged-out'));});await page.locator('#emailUpgradeDialog').waitFor({state:'hidden'});assert.equal(await page.locator('#emailUpgradeCard').isVisible(),false);
  assert.deepEqual(errors,[]);console.log('PASS '+name+': home card, per-opening reminder, dismissal, email OTP, email-app return, same identity, both login identifiers, legacy PIN, logout, 390px layout');
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1)});
