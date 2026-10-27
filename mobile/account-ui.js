(function(){
  'use strict';
  const hooks=window.BizimSkorMobileHooks;
  if(!hooks)return;
  const client=hooks.client;
  const panel=document.createElement('div');panel.id='mobileAccountPanel';
  const status=document.createElement('p');status.id='mobileAccountMessage';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const formHost=document.createElement('div');panel.append(formHost,status);
  document.getElementById('newPlayer').prepend(panel);
  let mode='legacy',busy=false,verifyType='signup',pendingEmail='',pendingName=localStorage.getItem('mobilePendingName')||'',pendingLink=false;
  const controller=BizimSkorMobileAccount.create({client,storage:localStorage,deviceId:hooks.deviceId,
    gateway:async body=>{const result=await client.functions.invoke('mobile-account-auth',{body});if(result.error){let code='auth_service_unavailable';try{code=(await result.error.context.json()).error||code}catch{}return {error:code}}return result.data||{error:'auth_service_unavailable'}},
    onPlayer:async data=>{hooks.showPlayer(data.player_name);window.dispatchEvent(new Event('bizimskor:session-ready'));hooks.refresh();localStorage.removeItem('mobilePendingName');render('account');},
    onLogout:()=>{hooks.clearPlayer();render('legacy')}
  });
  function el(tag,text,attrs={}){const node=document.createElement(tag);if(text)node.textContent=text;for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);return node}
  function message(text){status.textContent=text}
  function field(form,label,name,options={}){const id='mobile-'+name;form.append(el('label',label,{for:id}));const input=el('input','',{id,name,type:options.type||'text',autocomplete:options.autocomplete||'off',...options});form.append(input);return input}
  function button(parent,label,action,cls=''){const b=el('button',label,{type:'button',class:cls});b.onclick=()=>run(action);parent.append(b);return b}
  async function run(action){if(busy)return;busy=true;panel.setAttribute('aria-busy','true');panel.querySelectorAll('button').forEach(b=>b.disabled=true);message('İşlem yapılıyor…');try{await action()}catch(e){message(e.message||'İşlem tamamlanamadı.')}finally{busy=false;panel.removeAttribute('aria-busy');panel.querySelectorAll('button').forEach(b=>b.disabled=false)}}
  function form(title,submit,action){formHost.replaceChildren(el('h3',title));const f=el('form');f.onsubmit=e=>{e.preventDefault();run(()=>action(new FormData(f)))};formHost.append(f);const done=()=>f.append(el('button',submit,{type:'submit',class:'full p'}));return {f,done}}
  function policy(parent){const p=el('p',null,{class:'small'});p.append(el('a','Gizlilik',{href:'privacy.html'}),document.createTextNode(' • '),el('a','Kullanım koşulları',{href:'terms.html'}),document.createTextNode(' • '),el('a','Hesap silme',{href:'account-delete.html'}));parent.append(p)}
  function ready(state){if(state.signedIn&&state.linked){render('account');message('Hesabınıza giriş yapıldı.')}else if(state.signedIn){render('choose');message('E-posta doğrulandı. Mevcut oyuncunuzu bağlayın veya yeni oyuncu oluşturun.')}else render('login')}
  function render(next){mode=next;message('');formHost.replaceChildren();
    if(next==='legacy'){
      const {f,done}=form('Mevcut test hesabıyla giriş','Giriş yap',async data=>{await hooks.legacyLogin(data.get('name'),data.get('pin'));message('Giriş yapıldı.');});
      field(f,'Oyuncu adı','name',{required:'',autocomplete:'username'});
      field(f,'Mevcut 4 haneli PIN','pin',{required:'',type:'password',inputmode:'numeric',pattern:'[0-9]{4}',maxlength:'4',autocomplete:'current-password'});done();
      button(formHost,'Eski test PIN’imi unuttum',()=>render('legacy-reset'),'full');
      button(formHost,'E-posta / kullanıcı adı ve şifreyle giriş',()=>render('login'),'full');
      button(formHost,'Yeni hesap / mevcut hesabı e-postaya bağla',()=>render('signup'),'full');
    }else if(next==='legacy-reset'){
      const {f,done}=form('Eski test PIN’ini yenile','PIN’i yenile',async data=>{if(data.get('pin')!==data.get('repeat'))throw new Error('PIN’ler aynı olmalıdır.');await controller.legacyResetPin(data.get('name'),data.get('pin'));render('legacy');message('Test PIN’iniz yenilendi. Yeni PIN ile giriş yapın.');});
      f.append(el('p','Yalnızca eski test hesabının kayıtlı cihazında çalışır. E-posta hesabı şifresi için e-posta kurtarmayı kullanın.',{class:'small'}));
      field(f,'Mevcut oyuncu adı','name',{required:'',autocomplete:'username'});field(f,'Yeni 4 haneli test PIN’i','pin',{required:'',type:'password',inputmode:'numeric',pattern:'[0-9]{4}',maxlength:'4',autocomplete:'new-password'});field(f,'PIN tekrar','repeat',{required:'',type:'password',inputmode:'numeric',pattern:'[0-9]{4}',maxlength:'4',autocomplete:'new-password'});done();button(formHost,'Giriş ekranı',()=>render('legacy'),'full');
    }else if(next==='login'){
      const {f,done}=form('Hesabına giriş yap','Giriş yap',async data=>ready(await controller.login(data.get('identifier'),data.get('password'))));
      field(f,'E-posta veya oyuncu adı','identifier',{required:'',autocomplete:'username'});field(f,'Şifre','password',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'current-password'});done();
      button(formHost,'Şifremi unuttum',()=>render('recover'));button(formHost,'Kayıt ol / eski hesabımı bağla',()=>render('signup'),'full');button(formHost,'Mevcut test hesabıyla devam et',()=>render('legacy'),'full');
    }else if(next==='signup'){
      formHost.append(el('p','E-posta hizmetinin kurulumu sürüyor. Kod gelmezse mevcut test hesabınızla devam edin; tekrar kayıt oluşturmayın.',{class:'small'}));
      const notice=formHost.firstChild;
      const {f,done}=form('E-posta hesabı oluştur','Doğrulama e-postası iste',async data=>{
        if(data.get('password')!==data.get('repeat'))throw new Error('Şifreler aynı olmalıdır.');if(!data.get('consent'))throw new Error('Devam etmek için koşulları kabul edin.');
        pendingLink=data.get('existing')==='on';pendingName=pendingLink?String(data.get('name')).trim():controller.normalizeName(data.get('name'));pendingEmail=String(data.get('email')).trim();
        await controller.signup(pendingEmail,data.get('password'),pendingName,pendingLink);localStorage.setItem('mobilePendingName',pendingName);verifyType='signup';render('verify');message('E-postadaki doğrulama kodunu girin. Gönderim hizmeti henüz doğrulanmadı.');
      });f.prepend(notice);
      field(f,'Oyuncu adı (mevcutsa aynı adı yazın)','name',{required:'',maxlength:'100',value:controller.legacy.name||pendingName,autocomplete:'username'});
      field(f,'E-posta','email',{required:'',type:'email',autocomplete:'email'});field(f,'Şifre (en az 8 karakter)','password',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});field(f,'Şifre tekrar','repeat',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});
      const existing=field(f,'Mevcut oyuncu hesabımı bağlayacağım','existing',{type:'checkbox'});existing.checked=!!controller.legacy.name;
      field(f,'Kullanım koşullarını ve gizlilik metnini okudum','consent',{type:'checkbox',required:''});policy(f);done();button(formHost,'Giriş ekranı',()=>render('login'),'full');
    }else if(next==='verify'){
      const {f,done}=form(verifyType==='signup'?'E-postanı doğrula':'Kurtarma kodunu doğrula','Kodu doğrula',async data=>{pendingEmail=String(data.get('email'));const state=await controller.verify(pendingEmail,data.get('code'),verifyType);if(state.recovery){render('reset');message('Yeni şifrenizi belirleyin.')}else ready(state)});
      field(f,'E-posta','email',{required:'',type:'email',value:pendingEmail,autocomplete:'email'});field(f,'E-postadaki kod','code',{required:'',inputmode:'numeric',autocomplete:'one-time-code'});done();formHost.append(el('p','E-posta şablonunda kod bulunmalıdır. Kod gelmiyorsa gönderim kurulumu tamamlanmamış olabilir. E-posta bağlantısıyla doğruladıysanız giriş ekranından devam edin.',{class:'small'}));button(formHost,'Giriş ekranı',()=>render('login'),'full');
    }else if(next==='recover'){
      const {f,done}=form('Şifreni yenile','Kurtarma kodu iste',async data=>{pendingEmail=String(data.get('email'));await controller.recover(pendingEmail);verifyType='recovery';render('verify');message('Bu adres kayıtlıysa kurtarma e-postası gönderilir. Gönderim hizmeti henüz doğrulanmadı.');});field(f,'E-posta','email',{required:'',type:'email',autocomplete:'email'});done();button(formHost,'Giriş ekranı',()=>render('login'),'full');
    }else if(next==='reset'){
      const {f,done}=form('Yeni şifre','Şifreyi güncelle',async data=>{if(data.get('password')!==data.get('repeat'))throw new Error('Şifreler aynı olmalıdır.');ready(await controller.resetPassword(data.get('password')))});field(f,'Yeni şifre','password',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});field(f,'Yeni şifre tekrar','repeat',{required:'',type:'password',minlength:'8',maxlength:'256',autocomplete:'new-password'});done();
    }else if(next==='choose'){
      const {f,done}=form('Oyuncu hesabını bağla','Mevcut oyuncumu bağla',async data=>{await controller.link(data.get('name'),data.get('pin'));message('Mevcut puanlarınız ve tahminleriniz korunarak hesabınız bağlandı.');});
      field(f,'Mevcut oyuncu adı','name',{required:'',value:pendingName||controller.legacy.name||'',maxlength:'100'});field(f,'Eski PIN (bu cihazda açık oturum varsa boş bırakılabilir)','pin',{type:'password',inputmode:'numeric',maxlength:'4',autocomplete:'current-password'});done();
      button(formHost,'İlk kez oynuyorum: yeni oyuncu oluştur',()=>render('create'),'full');button(formHost,'Çıkış yap',()=>controller.logout(),'full');
    }else if(next==='create'){
      const {f,done}=form('Yeni oyuncu oluştur','Oyuna katıl',async data=>{await controller.createPlayer(data.get('name'));message('Oyuncu hesabınız oluşturuldu.');});field(f,'Oyuncu adı','name',{required:'',value:pendingLink?'':pendingName,maxlength:'30'});done();button(formHost,'Mevcut oyuncumu bağlayacağım',()=>render('choose'),'full');
    }else if(next==='account'){
      formHost.append(el('h3','Hesap ayarları'));button(formHost,'Şifremi değiştir',()=>render('change'),'full');button(formHost,'Hesap silme talebi',()=>render('delete'),'full');button(formHost,'Çıkış yap',()=>controller.logout(),'full');
    }else if(next==='legacy-account'){
      formHost.append(el('h3','Test hesabı ayarları'));button(formHost,'Mevcut hesabımı e-postaya bağla',()=>render('signup'),'full');button(formHost,'Hesap silme talebi',()=>render('legacy-delete'),'full');button(formHost,'Çıkış yap',()=>controller.logout(),'full');
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
  hooks.installRestore(async()=>{const state=await controller.restore();if(state.signedIn){ready(state);if(!state.linked)document.getElementById('newPlayer').classList.remove('hide');}else{await hooks.legacyRestore();render('legacy')}});
  window.addEventListener('bizimskor:mobile-account',()=>{document.getElementById('newPlayer').classList.remove('hide');render('login')});
  const showMode=next=>{document.getElementById('newPlayer').classList.remove('hide');render(next==='register'?'signup':'login')};
  if(window.BizimSkorAuthActions)window.BizimSkorAuthActions=Object.freeze({...window.BizimSkorAuthActions,showMode});
  for(const [id,next] of [['showLogin','login'],['showRegister','register']]){const button=document.getElementById(id);if(button)button.onclick=()=>showMode(next)}
  render('legacy');
  window.BizimSkorMobileAccountUI={controller,render,get mode(){return mode}};
})();
