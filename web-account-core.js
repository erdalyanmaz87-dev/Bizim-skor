(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorWebAccount=api})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const pendingKey='bizimSkorEmailUpgradePending';
 const messages={invalid_credentials:'E-posta / oyuncu adı veya şifre hatalı.',rate_limited:'Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.',invalid_player_credentials:'Oyuncu oturumu doğrulanamadı. Oyuna yeniden giriş yap.',account_already_linked:'Bu oyuncu veya e-posta zaten başka bir hesaba bağlı.',email_service_unavailable:'E-posta şu anda gönderilemiyor. Biraz sonra tekrar dene.',auth_service_unavailable:'Hesap hizmetine ulaşılamıyor. Tekrar dene.'};
 function validatePassword(value){if(typeof value!=='string'||value.length<8||value.length>256)throw new Error('Şifre en az 8, en fazla 256 karakter olmalıdır.');return value}
 function email(value){const result=String(value||'').trim();if(result.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result))throw new Error('Geçerli bir e-posta adresi yaz.');return result}
 function create({authClient,gameClient,gateway,storage,deviceId,onLogin=()=>{}}){
  const identity=()=>({name:storage.getItem('bizimSkorName'),token:storage.getItem('bizimSkorFriendToken')});
  const same=(a,b)=>a.name===b.name&&a.token===b.token;
  function unchanged(proof){if(!proof.name||!proof.token||!same(proof,identity()))throw new Error('Oyuncu oturumu değişti. Oyuna yeniden giriş yapıp devam et.');}
  async function rpc(client,name,args){const result=await client.rpc(name,args);if(result.error)throw new Error(messages[result.error.code]||'Bağlantı kurulamadı. Tekrar dene.');if(result.data?.error)throw new Error(messages[result.data.error]||'İşlem tamamlanamadı.');return result.data}
  async function request(body){const data=await gateway(body);if(data?.error)throw new Error(messages[data.error]||'İşlem tamamlanamadı. Bilgilerini kontrol et.');return data}
  async function status(){const proof=identity();if(!proof.name||!proof.token)return null;const state=await rpc(gameClient,'web_player_account_status',{p_token:proof.token});unchanged(proof);if(state?.player_name!==proof.name)throw new Error('Oyuncu oturumu doğrulanamadı.');return state}
  function pending(){try{const p=JSON.parse(storage.getItem(pendingKey)||'null');return p&&p.name===identity().name&&typeof p.email==='string'?p:null}catch{return null}}
  async function proofForLink(){const proof=identity();unchanged(proof);const state=await status();unchanged(proof);if(!state)throw new Error('Önce oyuna giriş yap.');return {...proof,name:state.player_name}}
  async function setLogin(identifier,password){validatePassword(password);const result=await request({action:'login',identifier:String(identifier||'').trim(),password});if(!result.session?.user?.email_confirmed_at)throw new Error('Önce e-postanı doğrula.');const q=await authClient.auth.setSession({access_token:result.session.access_token,refresh_token:result.session.refresh_token});if(q.error)throw new Error('Giriş tamamlanamadı.');}
  async function finish(proof){
   unchanged(proof);
   const user=await authClient.auth.getUser();unchanged(proof);
   if(user.error||!user.data?.user?.email_confirmed_at)throw new Error('Önce e-postanı doğrula.');
   const account=await rpc(authClient,'mobile_account_status',{});unchanged(proof);
   if(account.linked&&account.player_name!==proof.name)throw new Error('Bu e-posta başka bir oyuncuya bağlı. Kendi e-posta hesabını kullan.');
   if(!account.linked){await rpc(authClient,'mobile_link_player',{p_name:proof.name,p_legacy_token:proof.token,p_device_id:deviceId()});unchanged(proof);}
   const verified=await status();if(!verified?.linked)throw new Error('Hesap bağlantısı henüz tamamlanmadı. Tekrar dene.');
   storage.removeItem(pendingKey);return verified;
  }
  return {status,pending,
   async signup(address,password,repeat){validatePassword(password);if(password!==repeat)throw new Error('Şifreler aynı olmalıdır.');address=email(address);const proof=await proofForLink();
    await request({action:'signup',email:address,password,name:proof.name,existingPlayer:true});unchanged(proof);storage.setItem(pendingKey,JSON.stringify({name:proof.name,email:address}));return {needsConfirmation:true};},
   async verify(code){const p=pending();if(!p)throw new Error('Oyuncu oturumu değişti. E-posta bağlama işlemini yeniden başlat.');const proof=await proofForLink();const q=await authClient.auth.verifyOtp({email:p.email,token:String(code||'').trim(),type:'signup'});unchanged(proof);if(q.error||!q.data?.session?.user?.email_confirmed_at)throw new Error('Kod doğrulanamadı veya süresi doldu. Kodu kontrol et.');return finish(proof);},
   async attach(address,password){address=email(address);const proof=await proofForLink();await setLogin(address,password);unchanged(proof);return finish(proof);},
   async login(identifier,password){const before=identity();await setLogin(identifier,password);if(!same(before,identity()))throw new Error('Oyuncu oturumu değişti. Tekrar giriş yap.');const account=await rpc(authClient,'mobile_account_status',{});if(!account?.linked)throw new Error('Bu e-posta bir oyuncuya bağlanmamış. Önce eski PIN’inle giriş yapıp ana ekrandan hesabını bağla.');if(!same(before,identity()))throw new Error('Oyuncu oturumu değişti. Tekrar giriş yap.');const data=await rpc(authClient,'mobile_issue_player_session',{p_device_id:deviceId()});if(!same(before,identity()))throw new Error('Oyuncu oturumu değişti. Tekrar giriş yap.');if(!data?.player_name||!data?.token)throw new Error('Giriş tamamlanamadı.');storage.setItem('bizimSkorName',data.player_name);storage.setItem('bizimSkorFriendToken',data.token);await onLogin(data);return data;},
   async recover(address){address=email(address);await request({action:'recover',email:address});return address;},
   async reset(address,code,password,repeat){validatePassword(password);if(password!==repeat)throw new Error('Şifreler aynı olmalıdır.');address=email(address);const q=await authClient.auth.verifyOtp({email:address,token:String(code||'').trim(),type:'recovery'});if(q.error||!q.data?.session)throw new Error('Kod doğrulanamadı veya süresi doldu.');const changed=await authClient.auth.updateUser({password});if(changed.error)throw new Error('Şifre güncellenemedi. Tekrar dene.');return true;}
  };
 }
 return {create,validatePassword};
});
