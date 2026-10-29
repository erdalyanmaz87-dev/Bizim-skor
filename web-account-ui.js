(function(){
 'use strict';
 // Native bundles own their account UI. This module is only loaded by the web page.
 if(window.BizimSkorMobileHooks||!window.BizimSkorWebAccount||typeof sb==='undefined')return;
 // Keep linking/recovery Auth proof private to this page. Cross-tab auth changes
 // must never swap the verified email while another tab is attaching a player.
 const authClient=supabase.createClient(sb.supabaseUrl,sb.supabaseKey,{auth:{persistSession:false,storageKey:'bizimSkorWebEmailAuth',detectSessionInUrl:false}});
 const controller=BizimSkorWebAccount.create({authClient,gameClient:sb,storage:localStorage,deviceId:ensureDeviceId,
  gateway:async body=>{const q=await authClient.functions.invoke('mobile-account-auth',{body});if(q.error){let error='auth_service_unavailable';try{error=(await q.error.context.json()).error||error}catch{}return {error}}return q.data;},
  onLogin:data=>{showName(data.player_name);window.dispatchEvent(new Event('bizimskor:session-ready'));refreshAfterAuthentication();Promise.resolve(recordVerifiedLaunch(data.token)).catch(()=>{});}
 });
 const card=document.createElement('section');card.id='emailUpgradeCard';card.className='bs-email-card';card.hidden=true;
 card.innerHTML='<span class="bs-email-eyebrow">HESABINI HAZIRLA</span><h3>E-postanı bağla, her yerden giriş yap</h3><p>Puanların ve tahminlerin aynı hesapta kalsın. E-postanı doğrula ve en az 8 karakterli şifreni oluştur.</p><button type="button" class="p full">E-posta bağla ve şifre oluştur</button>';
 const home=document.getElementById('home');home?.prepend(card);
 const dialog=document.createElement('dialog');dialog.id='emailUpgradeDialog';dialog.className='bs-email-dialog';dialog.setAttribute('aria-labelledby','emailUpgradeTitle');
 dialog.innerHTML='<div class="bs-email-dialog-head"><span class="bs-email-eyebrow">BİZİMSKOR HESABIN</span><button type="button" data-email-close aria-label="Kapat">×</button></div><div data-email-body></div><p data-email-status role="status" aria-live="polite"></p>';
 document.body.append(dialog);
 const body=dialog.querySelector('[data-email-body]'),status=dialog.querySelector('[data-email-status]');
 let busy=false,shownIdentity='',activeIdentity='',returnFocus=null,requestSerial=0,recoveryEmail='';
 const currentKey=()=>JSON.stringify([localStorage.getItem('bizimSkorName'),localStorage.getItem('bizimSkorFriendToken')]);
 const el=(tag,text,attrs={})=>{const n=document.createElement(tag);if(text)n.textContent=text;Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));return n;};
 function close(){if(busy)return;dialog.close();body.replaceChildren();status.textContent='';returnFocus?.focus?.();}
 dialog.querySelector('[data-email-close]').onclick=close;
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 function open(mode='intro'){returnFocus=document.activeElement;activeIdentity=currentKey();render(mode);if(!dialog.open)dialog.showModal();}
 card.querySelector('button').onclick=()=>open(controller.pending()?'verify':'signup');
 function button(label,action,cls=''){const b=el('button',label,{type:'button',class:cls});b.onclick=action;body.append(b);return b;}
 function input(form,label,name,attrs={}){const id='email-upgrade-'+name;form.append(el('label',label,{for:id}));const n=el('input','',{id,name,...attrs});form.append(n);return n;}
 function password(form,label='Şifre (en az 8 karakter)',name='password'){return input(form,label,name,{type:'password',required:'',minlength:'8',maxlength:'256',autocomplete:'new-password'});}
 function address(form,value=''){return input(form,'E-posta adresin','email',{type:'email',required:'',maxlength:'254',autocomplete:'email',value});}
 function form(title,label,job){body.append(el('h2',title,{id:'emailUpgradeTitle'}));const f=el('form');body.append(f);f.addEventListener('submit',e=>{e.preventDefault();run(()=>job(new FormData(f)));});return {f,done:()=>f.append(el('button',label,{type:'submit',class:'full p'}))};}
 async function run(job){if(busy)return;busy=true;const key=activeIdentity;dialog.setAttribute('aria-busy','true');dialog.querySelectorAll('button').forEach(b=>b.disabled=true);status.textContent='İşlem yapılıyor…';try{await job();}catch(e){if(key===currentKey())status.textContent=e.message||'İşlem tamamlanamadı. Tekrar dene.';}finally{busy=false;dialog.removeAttribute('aria-busy');dialog.querySelectorAll('button').forEach(b=>b.disabled=false);if(key!==currentKey()){dialog.close();body.replaceChildren();status.textContent='';}}}
 async function complete(job){await job();if(activeIdentity!==currentKey())return;card.hidden=true;render('done');}
 function render(mode){body.replaceChildren();status.textContent='';
  if(mode==='intro'){
   body.append(el('h2','Hesabını e-postana bağla',{id:'emailUpgradeTitle'}),el('p','E-postanı bağla ve en az 8 karakterli şifre oluştur. Aynı oyuncu adı, puanlar ve tahminlerle hem uygulamadan hem bizimskor.com’dan devam et.'));
   button('E-posta bağla ve şifre oluştur',()=>render(controller.pending()?'verify':'signup'),'full p');button('Daha sonra, oyuna devam et',close,'full');
  }else if(mode==='signup'){
   const {f,done}=form('E-posta bağla ve şifre oluştur','Doğrulama kodu gönder',async data=>{await controller.signup(data.get('email'),data.get('password'),data.get('repeat'));render('verify');status.textContent='E-postana gelen doğrulama kodunu yaz. Gelen kutunu ve spam klasörünü kontrol et.';});
   f.append(el('p',(localStorage.getItem('bizimSkorName')||'')+' hesabın korunacak. Yeni oyuncu kaydı açılmayacak.',{class:'small'}));address(f,controller.pending()?.email||'');password(f);password(f,'Şifre tekrar','repeat');done();
   button('Zaten e-posta hesabı oluşturdum',()=>render('attach'),'full');button('Daha sonra',close,'full');
  }else if(mode==='verify'){
   const p=controller.pending();if(!p)return render('signup');
   const {f,done}=form('E-postanı doğrula','Doğrula ve hesabımı bağla',async data=>complete(()=>controller.verify(data.get('code'))));
   f.append(el('p',p.email+' adresine gelen kodu yaz.'));input(f,'Doğrulama kodu','code',{required:'',inputmode:'numeric',autocomplete:'one-time-code',maxlength:'12'});done();
   button('Kod gelmedi / e-posta adresini değiştir',()=>render('signup'),'full');button('E-postam zaten doğrulandı, şifremle bağla',()=>render('attach'),'full');button('Daha sonra',close,'full');
  }else if(mode==='attach'){
   const {f,done}=form('E-posta hesabımla bağla','Mevcut oyuncuma bağla',async data=>complete(()=>controller.attach(data.get('email'),data.get('password'))));address(f,controller.pending()?.email||'');password(f).autocomplete='current-password';done();button('Şifremi unuttum',()=>render('recover'),'full');button('Geri',()=>render('signup'),'full');
  }else if(mode==='done'){
   body.append(el('h2','Hesabın hazır ✓',{id:'emailUpgradeTitle'}),el('p','E-postan bağlandı. Artık e-posta adresin veya oyuncu adın ve yeni şifrenle hem webden hem Android uygulamasından giriş yapabilirsin. Puanların ve tahminlerin korundu.'));button('Oyuna devam et',close,'full p');
  }else if(mode==='recover'){
   const {f,done}=form('E-posta şifremi yenile','Kurtarma kodu gönder',async data=>{recoveryEmail=await controller.recover(data.get('email'));render('reset');status.textContent='Bu adres kayıtlıysa kurtarma kodu gönderilir. Gelen kutunu ve spam klasörünü kontrol et.';});address(f);done();button('Eski 4 haneli PIN’imi unuttum',()=>{close();document.getElementById('pinResetMount')?.classList.remove('hide');document.getElementById('resetName')?.focus();},'full');
  }else if(mode==='reset'){
   const {f,done}=form('Yeni şifreni oluştur','Şifreyi yenile',async data=>{await controller.reset(recoveryEmail,data.get('code'),data.get('password'),data.get('repeat'));render('reset-done');});input(f,'E-postadaki kurtarma kodu','code',{required:'',inputmode:'numeric',autocomplete:'one-time-code',maxlength:'12'});password(f);password(f,'Yeni şifre tekrar','repeat');done();
  }else if(mode==='reset-done'){
   body.append(el('h2','Şifren yenilendi',{id:'emailUpgradeTitle'}),el('p','Yeni şifrenle giriş yapabilirsin. E-postanı henüz oyuncuna bağlamadıysan eski PIN’inle oyuna girip e-posta bağlama adımını tamamla.'));button('Tamam',close,'full p');
  }
  queueMicrotask(()=>body.querySelector('input,button')?.focus());
 }
 async function refresh(){const serial=++requestSerial,key=currentKey();if(key!==activeIdentity&&dialog.open){dialog.close();body.replaceChildren();status.textContent='';}if(!localStorage.getItem('bizimSkorFriendToken')){card.hidden=true;shownIdentity='';return;}
  try{const state=await controller.status();if(serial!==requestSerial||key!==currentKey())return;card.hidden=!state||state.linked;if(state&&!state.linked&&shownIdentity!==key){shownIdentity=key;open('intro');}}
  catch{if(serial===requestSerial)card.hidden=true;}
 }
 // The original legacy action remains available only for four-digit PIN input.
 if(typeof loginAction==='function'&&typeof registerAction==='function')window.BizimSkorAuthActions.bindActions({
  login:async()=>{const identifier=document.getElementById('loginName').value.trim(),value=document.getElementById('loginPin').value;
   if(!identifier.includes('@')&&/^\d{4}$/.test(value))return loginAction();
   await controller.login(identifier,value);document.getElementById('loginPin').value='';},register:registerAction});
 const recover=document.getElementById('openPinReset');if(recover)recover.onclick=()=>open('recover');
 window.addEventListener('bizimskor:player-shown',refresh);window.addEventListener('bizimskor:session-ready',refresh);window.addEventListener('bizimskor:logged-out',()=>{refresh();authClient.auth.signOut({scope:'local'}).catch(()=>{});});
 window.addEventListener('pageshow',refresh);window.addEventListener('storage',e=>{if(['bizimSkorName','bizimSkorFriendToken'].includes(e.key))refresh();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){if(!dialog.open)shownIdentity='';refresh();}});
 window.BizimSkorWebAccountUI={controller,refresh,open};
})();
