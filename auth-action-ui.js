(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorAuthActions=api;api.mount()}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  let busy=false,actions=null,waiting=null;
  function errorText(error){if(error?.code==='AUTH_TIMEOUT'||/fetch|network|offline|abort/i.test(error?.message||''))return 'Bağlantı yavaş veya kesildi. Bilgilerin kutularda duruyor. İşlem tamamlanmadıysa tekrar deneyebilirsin; kayıt yaptıysan Giriş Yap bölümünden devam et.';return error?.message||'İşlem tamamlanamadı. Lütfen tekrar dene.'}
  async function runAction({button,status,buttons=[button]},job){
    if(busy||button?.disabled)return false;busy=true;
    const oldText=button.textContent,states=buttons.map(el=>[el,el.disabled]);
    buttons.forEach(el=>el.disabled=true);button.textContent='İşlem yapılıyor…';button.setAttribute?.('aria-busy','true');if(status)status.textContent='İşlemin yapılıyor…';
    const slow=root.setTimeout(()=>{if(status)status.textContent='Bağlantı yavaş; işlemin sürüyor. Tekrar basmana gerek yok.'},3500);
    try{await job();if(status)status.textContent='';return true}catch(error){if(status)status.textContent=errorText(error);return false}finally{root.clearTimeout(slow);states.forEach(([el,value])=>el.disabled=value);button.textContent=oldText;button.removeAttribute?.('aria-busy');busy=false}
  }
  async function rpc(client,name,args){
    const controller=typeof root.AbortController==='function'?new root.AbortController():null;let timer;
    const timeout=new Promise((_,reject)=>{timer=root.setTimeout(()=>{const error=new Error('Bağlantı zaman aşımına uğradı.');error.code='AUTH_TIMEOUT';controller?.abort();reject(error)},20000)});
    try{const request=client.rpc(name,args),abortable=controller&&typeof request.abortSignal==='function'?request.abortSignal(controller.signal):request;return await Promise.race([Promise.resolve(abortable),timeout])}finally{root.clearTimeout(timer)}
  }
  function submit(mode,doc=root.document){
    const button=doc.getElementById(mode==='login'?'loginPlayer':'createPlayer'),status=doc.getElementById('authActionStatus'),buttons=['loginPlayer','createPlayer'].map(id=>doc.getElementById(id)).filter(Boolean);
    return runAction({button,status,buttons},async()=>{if(!actions){if(status)status.textContent='Oyun hazırlanıyor; bağlantı kurulunca işlemin başlayacak.';await new Promise((resolve,reject)=>{const timer=root.setTimeout(()=>{waiting=null;const error=new Error('Oyun bağlantısı henüz hazır değil.');error.code='AUTH_TIMEOUT';reject(error)},15000);waiting=()=>{root.clearTimeout(timer);waiting=null;resolve()}})}await actions[mode]()});
  }
  function showMode(mode,doc=root.document){const login=mode==='login';doc.getElementById('loginBox')?.classList.toggle('hide',!login);doc.getElementById('registerBox')?.classList.toggle('hide',login);doc.getElementById('showLogin')?.classList.toggle('p',login);doc.getElementById('showRegister')?.classList.toggle('p',!login);doc.getElementById(login?'loginName':'registerName')?.focus?.()}
  function bindActions(next){actions=next;waiting?.()}
  function mount(doc=root.document){if(!doc?.getElementById('newPlayer'))return false;const status=doc.getElementById('authActionStatus');status?.setAttribute('role','status');status?.setAttribute('aria-live','polite');['login','register'].forEach(mode=>{const switcher=doc.getElementById(mode==='login'?'showLogin':'showRegister'),button=doc.getElementById(mode==='login'?'loginPlayer':'createPlayer');if(switcher)switcher.onclick=()=>showMode(mode,doc);if(button)button.onclick=()=>submit(mode,doc)});['loginName','loginPin'].forEach(id=>doc.getElementById(id)?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit('login',doc)}}));['registerName','registerPin','registerPin2'].forEach(id=>doc.getElementById(id)?.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();submit('register',doc)}}));return true}
  return Object.freeze({runAction,rpc,submit,showMode,bindActions,mount,errorText});
});
