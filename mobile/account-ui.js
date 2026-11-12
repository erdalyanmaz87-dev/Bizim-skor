(function(){
  'use strict';
  const hooks=window.BizimSkorMobileHooks;
  if(!hooks)return;
  const client=hooks.client;
  const panel=document.createElement('div');panel.id='mobileAccountPanel';
  const status=document.createElement('p');status.id='mobileAccountMessage';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const formHost=document.createElement('div');panel.append(formHost,status);
  const account = document.getElementById('newPlayer');
  account.prepend(panel);
  const home = document.getElementById('home');
  const accountCard = account.closest('.c');
  if (home && accountCard) {
    accountCard.classList.add('mobile-first-run-account');
    home.prepend(accountCard);
  }
  let mode='welcome',busy=false,verifyType='signup',recoveryTarget='password',pendingEmail='',pendingName=localStorage.getItem('mobilePendingName')||'',pendingLink=false;
  const controller=BizimSkorMobileAccount.create({client,storage:localStorage,deviceId:hooks.deviceId,
    gateway:async body=>{const result=await client.functions.invoke('mobile-account-auth',{body});if(result.error){let code='auth_service_unavailable';try{code=(await result.error.context.json()).error||code}catch{}return {error:code}}return result.data||{error:'auth_service_unavailable'}},
    onPlayer:async data=>{hooks.showPlayer(data.player_name);window.dispatchEvent(new Event('bizimskor:session-ready'));hooks.refresh();localStorage.removeItem('mobilePendingName');render('account');},
    onLogout:()=>{hooks.clearPlayer();window.dispatchEvent(new Event('bizimskor:logged-out'));render('welcome')}
  });
  function el(tag,text,attrs={}){const node=document.createElement(tag);if(text)node.textContent=text;for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node}
  function message(text){status.textContent=text}
  function field(form,label,name,options={}){const id='mobile-'+name;form.append(el('label',label,{for:id}));const input=el('input','',{id,name,type:options.type||'text',autocomplete:options.autocomplete||'off',...options});form.append(input);return input}
  function button(parent,label,action,cls=''){const b=el('button',label,{type:'button',class:cls});b.onclick=()=>run(action);parent.append(b);return b}
  async function run(action){if(busy)return;busy=true;panel.setAttribute('aria-busy','true');panel.querySelectorAll('button').forEach(b=>b.disabled=true);message('İşlem yapılıyor…');try{await action()}catch(e){message(e.message||'İşlem tamamlanamadı.')}finally{busy=false;panel.removeAttribute('aria-busy');panel.querySelectorAll('button').forEach(b=>b.disabled=false)}}
  function form(title,submit,action){formHost.replaceChildren(el('h3',title));const f=el('form');f.onsubmit=e=>{e.preventDefault();run(()=>action(new FormData(f)))};formHost.append(f);const done=()=>f.append(el('button',submit,{type:'submit',class:'full p'}));return {f,done}}
  function policy(parent){const p=el('p',null,{class:'small'});p.append(el('a','Gizlilik',{href:'privacy.html'}),document.createTextNode(' • '),el('a','Kullanım koşulları',{href:'terms.html'}),document.createTextNode(' • '),el('a','Hesap silme',{href:'account-delete.html'}));parent.append(p)}
  function ready(state, newPlayer=false){if(state.signedIn&&state.linked){render('account');message('Hesabınıza giriş yapıldı.')}else if(state.signedIn){render(newPlayer?'create':'choose');message(newPlayer?'E-posta doğrulandı. Oyuna katılmak için oyuncu adını onayla.':'E-posta doğrulandı. Mevcut oyuncunuzu bağlayın veya yeni oyuncu oluşturun.')}else render('welcome')}
  function render(next){mode=next;message('');formHost.replaceChildren();
    if(next==='welcome'){
      formHost.append(el('h2','BizimSkor’a hoş geldin'));
      button(formHost,'Kayıt Ol',()=>render('signup'),'full p');
      button(formHost,'Giriş Yap',()=>render('login'),'full');
    }else if(next==='legacy'){
      const {f,done}=form('Mevcut test hesabıyla giriş','Giriş yap',async data=>{await hooks.legacyLogin(data.get('name'),data.get('pin'));message('Giriş yapıldı.');});
      field(f,'Oyuncu adı','name',{required:'',autocomplete:'username'});
      field(f,'Mevcut 4 haneli PIN','pin',{required:'',type:'password',inputmode:'numeric',pattern:'[0-9]{4}',maxlength:'4',autocomplete:'current-password'});done();
      button(formHost,'Eski test PIN’imi unuttum',()=>render('legacy-reset'),'full');
      button(formHost,'E-posta / kullanıcı adı ve şifreyle giriş',()=>render('login'),'full');
      button(formHost,'Giriş seçeneklerine dön',()=>render('welcome'),'full');
    }else if(next==='legacy-reset'){
      const {f,done}=form('4 haneli PIN’ini e-postayla yenile','Doğrulama kodu iste',async data=>{pendingEmail=String(data.get('email'));await controller.recover(pendingEmail);verifyType='recovery';recoveryTarget='pin';render('verify');message('Bu adres kayıtlıysa kurtarma kodu gönderilir.');});
      field(f,'Hesabına bağlı e-posta','email',{required:'',type:'email',autocomplete:'email'});done();
      formHost.append(el('p','E-postan bağlı değilse hesap sahipliği kontrolü için yönetici desteği al. Cihaz bilgisi tek başına yeterli değildir.'));
      button(formHost,'Giriş ekranı',()=>render('legacy'),'full');
    }else if(next==='login'){
      const {f,done}=form('Hesabına giriş yap','Giriş yap',async data=>ready(await controller.login(data.get('identifier'),data.get('password'))));
      field(f,'E-posta veya oyuncu adı','identifier',{required:'',autocomplete:'username'});field(f,'Şifre','password',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'current-password'});done();
      button(formHost,'Şifremi unuttum',()=>render('recover'));button(formHost,'Kayıt Ol',()=>render('signup'),'full');button(formHost,'Mevcut test hesabıyla devam et',()=>render('legacy'),'full');
    }else if(next==='signup'||next==='link-signup'){
      const linking=next==='link-signup';
      formHost.append(el('p','E-posta hizmetinin kurulumu sürüyor. Kod gelmezse mevcut test hesabınızla devam edin; tekrar kayıt oluşturmayın.',{class:'small'}));
      const notice=formHost.firstChild;
      const {f,done}=form(linking?'Hesabını e-postaya bağla':'E-posta hesabı oluştur','Doğrulama e-postası iste',async data=>{
        if(data.get('password')!==data.get('repeat'))throw new Error('Şifreler aynı olmalıdır.');if(!data.get('consent'))throw new Error('Devam etmek için koşulları kabul edin.');
        pendingLink=linking;pendingName=linking?controller.legacy.name||'':controller.normalizeName(data.get('name'));pendingEmail=String(data.get('email')).trim();
        if(linking&&!pendingName)throw new Error('Önce mevcut test hesabına giriş yap.');
        await controller.signup(pendingEmail,data.get('password'),pendingName,pendingLink);localStorage.setItem('mobilePendingName',pendingName);verifyType='signup';render('verify');message('E-postadaki doğrulama kodunu girin. Gönderim hizmeti henüz doğrulanmadı.');
      });f.prepend(notice);
      if(!linking)field(f,'Oyuncu adı','name',{required:'',maxlength:'30',value:pendingLink?'':pendingName,autocomplete:'username'});
      field(f,'E-posta','email',{required:'',type:'email',autocomplete:'email'});field(f,'Şifre (en az 8 karakter)','password',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});field(f,'Şifre tekrar','repeat',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});
      field(f,'Kullanım koşullarını ve gizlilik metnini okudum','consent',{type:'checkbox',required:''});policy(f);done();button(formHost,linking?'Hesap ayarlarına dön':'Giriş ekranı',()=>render(linking?'legacy-account':'login'),'full');
    }else if(next==='verify'){
      const {f,done}=form(verifyType==='signup'?'E-postanı doğrula':'Kurtarma kodunu doğrula','Kodu doğrula',async data=>{pendingEmail=String(data.get('email'));const state=await controller.verify(pendingEmail,data.get('code'),verifyType);if(state.recovery){render(recoveryTarget==='pin'?'pin-reset':'reset');message(recoveryTarget==='pin'?'Yeni 4 haneli PIN’inizi belirleyin.':'Yeni şifrenizi belirleyin.')}else ready(state,verifyType==='signup'&&!!pendingName&&!pendingLink)});
      field(f,'E-posta','email',{required:'',type:'email',value:pendingEmail,autocomplete:'email'});field(f,'E-postadaki kod','code',{required:'',inputmode:'numeric',autocomplete:'one-time-code'});done();formHost.append(el('p','E-posta şablonunda kod bulunmalıdır. Kod gelmiyorsa gönderim kurulumu tamamlanmamış olabilir. E-posta bağlantısıyla doğruladıysanız giriş ekranından devam edin.',{class:'small'}));button(formHost,'Giriş ekranı',()=>render('login'),'full');
    }else if(next==='recover'){
      const {f,done}=form('Şifreni yenile','Kurtarma kodu iste',async data=>{pendingEmail=String(data.get('email'));await controller.recover(pendingEmail);verifyType='recovery';recoveryTarget='password';render('verify');message('Bu adres kayıtlıysa kurtarma e-postası gönderilir. Gönderim hizmeti henüz doğrulanmadı.');});field(f,'E-posta','email',{required:'',type:'email',autocomplete:'email'});done();button(formHost,'Giriş ekranı',()=>render('login'),'full');
    }else if(next==='pin-reset'){
      const {f,done}=form('Yeni 4 haneli PIN','PIN’i yenile',async data=>{if(data.get('pin')!==data.get('repeat'))throw new Error('PIN’ler aynı olmalıdır.');await controller.resetPin(data.get('pin'));render('legacy');message('PIN’iniz yenilendi. Yeni PIN ile giriş yapın.');});
      field(f,'Yeni 4 haneli PIN','pin',{required:'',type:'password',inputmode:'numeric',pattern:'[0-9]{4}',maxlength:'4',autocomplete:'new-password'});field(f,'Yeni PIN tekrar','repeat',{required:'',type:'password',inputmode:'numeric',pattern:'[0-9]{4}',maxlength:'4',autocomplete:'new-password'});done();
    }else if(next==='reset'){
      const {f,done}=form('Yeni şifre','Şifreyi güncelle',async data=>{if(data.get('password')!==data.get('repeat'))throw new Error('Şifreler aynı olmalıdır.');const state=await controller.resetPassword(data.get('password'));ready(state);if(state.passwordUnchanged)message('E-postanız doğrulandı. Şifreniz zaten bu; aynı şifreyle devam edebilirsiniz.')});field(f,'Yeni şifre','password',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});field(f,'Yeni şifre tekrar','repeat',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});done();
    }else if(next==='choose'){
      const {f,done}=form('Oyuncu hesabını bağla','Mevcut oyuncumu bağla',async data=>{await controller.link(data.get('name'),data.get('pin'));message('Mevcut puanlarınız ve tahminleriniz korunarak hesabınız bağlandı.');});
      field(f,'Mevcut oyuncu adı','name',{required:'',value:pendingName||controller.legacy.name||'',maxlength:'100'});field(f,'Eski PIN (bu cihazda açık oturum varsa boş bırakılabilir)','pin',{type:'password',inputmode:'numeric',maxlength:'4',autocomplete:'current-password'});done();
      button(formHost,'İlk kez oynuyorum: yeni oyuncu oluştur',()=>render('create'),'full');button(formHost,'Çıkış yap',()=>controller.logout(),'full');
    }else if(next==='create'){
      const {f,done}=form('Yeni oyuncu oluştur','Oyuna katıl',async data=>{await controller.createPlayer(data.get('name'));window.BizimSkorFirstRunTour?.start();});field(f,'Oyuncu adı','name',{required:'',value:pendingLink?'':pendingName,maxlength:'30'});done();
    }else if(next==='account'){
      formHost.append(el('h3','Hesap ayarları'));button(formHost,'Şifremi değiştir',()=>render('change'),'full');button(formHost,'Hesap silme talebi',()=>render('delete'),'full');button(formHost,'Çıkış yap',()=>controller.logout(),'full');
    }else if(next==='legacy-account'){
      formHost.append(el('h3','Test hesabı ayarları'));button(formHost,'Hesabımı e-postaya bağla',()=>render('link-signup'),'full');button(formHost,'Hesap silme talebi',()=>render('legacy-delete'),'full');button(formHost,'Çıkış yap',()=>controller.logout(),'full');
    }else if(next==='change'){
      const {f,done}=form('Şifre değiştir','Şifreyi değiştir',async data=>{if(data.get('password')!==data.get('repeat'))throw new Error('Şifreler aynı olmalıdır.');await controller.changePassword(data.get('current'),data.get('password'));render('account');message('Şifreniz değiştirildi.');});field(f,'Mevcut şifre','current',{required:'',type:'password',autocomplete:'current-password'});field(f,'Yeni şifre','password',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});field(f,'Yeni şifre tekrar','repeat',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});done();button(formHost,'Geri',()=>render('account'),'full');
    }else if(next==='delete'||next==='legacy-delete'){
      const old=next==='legacy-delete';
      formHost.append(el('h3','Hesap silme talebi'),el('p','Talep yöneticinin incelemesine iletilir. Bu işlem anında silme yapmaz. İşleme alınana kadar talebinizi geri çekebilirsiniz.'));
      button(formHost,'Silme talebi gönder',async()=>{if(old)await controller.legacyDeletion();else await controller.requestDeletion('Android uygulamasından hesap silme talebi');message('Silme talebiniz alındı ve yönetici destek kutusuna iletildi.');},'full danger');button(formHost,'Talebimi geri çek',async()=>{if(old){await controller.legacyDeletion(true);message('Talebi geri çekme isteğiniz yöneticiye iletildi.')}else{await controller.cancelDeletion();message('Bekleyen silme talebi geri çekildi.')}},'full');button(formHost,'Geri',()=>render(old?'legacy-account':'account'),'full');
    }
    policy(formHost);
  }
  const profile=document.getElementById('updateProfile');profile.textContent='Hesap ayarları';profile.onclick=async()=>{document.getElementById('newPlayer').classList.remove('hide');const q=await client.auth.getSession();render(q.data?.session?'account':'legacy-account');panel.scrollIntoView({block:'center',behavior:'smooth'});};
  document.getElementById('logoutPlayer').onclick=()=>run(()=>controller.logout());
  hooks.installRestore(async()=>{const state=await controller.restore();if(state.signedIn){ready(state);if(!state.linked)document.getElementById('newPlayer').classList.remove('hide');}else{await hooks.legacyRestore();if(mode==='welcome')render('welcome')}});
  window.addEventListener('bizimskor:mobile-account',()=>{document.getElementById('newPlayer').classList.remove('hide');render('login')});
  const showMode=next=>{document.getElementById('newPlayer').classList.remove('hide');render(next==='register'?'signup':'login')};
  if(window.BizimSkorAuthActions)window.BizimSkorAuthActions=Object.freeze({...window.BizimSkorAuthActions,showMode});
  for(const [id,next] of [['showLogin','login'],['showRegister','register']]){const button=document.getElementById(id);if(button)button.onclick=()=>showMode(next)}
  render('welcome');
  window.BizimSkorMobileAccountUI={controller,render,get mode(){return mode}};
})();
