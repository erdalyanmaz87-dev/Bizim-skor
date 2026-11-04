// Isolated UI demonstration. No network requests and no real account storage.
// The recovery flow uses the production frontend controller with synthetic Auth.
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 let pin='2468',failures=0,blockedUntil=0,otpVerified=false;
 const values=new Map();
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const controller=BizimSkorWebAccount.create({storage,deviceId:()=> 'example-device',gameClient:{},
  gateway:async()=>({ok:true}),
  authClient:{auth:{verifyOtp:async({email,token,type})=>{
   otpVerified=email==='demo@example.com'&&token==='654321'&&type==='recovery';
   return otpVerified?{data:{session:{user:{email_confirmed_at:'2026-11-04'}}}}:{error:{}};
  }},rpc:async(name,args)=>{
   if(name!=='reset_player_pin_with_email'||!otpVerified)return {error:{}};
   pin=args.p_new_pin;failures=0;blockedUntil=0;otpVerified=false;return {data:true};
  }}
 });
 for(const button of document.querySelectorAll('[data-panel]'))button.onclick=()=>{
  for(const item of document.querySelectorAll('[data-panel]')){const selected=item===button;item.setAttribute('aria-selected',String(selected));$(item.dataset.panel).hidden=!selected;}
 };
 $('demoLogin').onsubmit=event=>{event.preventDefault();
  if(Date.now()<blockedUntil){$('loginStatus').textContent='Örnek hesap geçici olarak kilitlendi. Gerçek uygulamada 15 dakika sonra tekrar denenebilir.';return;}
  if($('demoName').value.trim().toLowerCase()!=='demo'||$('demoPin').value!==pin){
   failures++;if(failures>=5)blockedUntil=Date.now()+15*60*1000;
   $('loginStatus').textContent=failures>=5?'Beş hatalı deneme: örnek hesap 15 dakika kilitlendi.':'Oyuncu adı veya PIN hatalı.';return;
  }
  failures=0;storage.setItem('bizimSkorName','Demo');storage.setItem('bizimSkorFriendToken','example-session');$('demoPin').value='';$('loginStatus').textContent='Örnek giriş başarılı. 128 puan ve 9 tahmin aynı hesapta duruyor.';
 };
 $('demoReset').onclick=()=>{failures=0;blockedUntil=0;pin='2468';$('loginStatus').textContent='Örnek hesap sıfırlandı. PIN: 2468';};
 $('demoRecover').onsubmit=async event=>{event.preventDefault();try{await controller.recover($('recoveryEmail').value);$('demoPinReset').hidden=false;$('recoveryStatus').textContent='Bu adres kayıtlıysa kurtarma kodu gönderilir. Örnekte gerçek e-posta gönderilmez.';}catch(error){$('recoveryStatus').textContent=error.message;}};
 $('demoPinReset').onsubmit=async event=>{event.preventDefault();const button=$('demoPinReset').querySelector('button');button.disabled=true;try{
  await controller.resetPin($('recoveryEmail').value,$('recoveryCode').value,$('newPin').value,$('repeatPin').value);
  $('recoveryStatus').textContent='Örnek PIN yenilendi. Eski oyun oturumu kapandı; 128 puan ve 9 tahmin korundu. PIN ile giriş bölümünde yeni PIN’ini deneyebilirsin.';
  $('demoPinReset').reset();$('demoPinReset').hidden=true;
 }catch(error){$('recoveryStatus').textContent=error.message;}finally{button.disabled=false;}};
})();
