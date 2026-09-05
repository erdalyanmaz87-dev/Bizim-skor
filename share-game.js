(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorShareGame=api;api.start()}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const fallbackUrl='https://bizim-skor-live.vercel.app';

  function shareText(url=fallbackUrl){
    return `⚽ Bizim Skor’a sen de katıl!\nSüper Lig ve Şampiyonlar Ligi maçlarının skorlarını tahmin et, arkadaşlarınla yarış. 🎯\n${url}`;
  }

  function whatsappUrl(url=fallbackUrl){
    return `https://wa.me/?text=${encodeURIComponent(shareText(url))}`;
  }

  function currentGameUrl(host=root){
    const origin=host?.location?.origin,pathname=host?.location?.pathname;
    return origin&&origin!=='null'?`${origin}${pathname||'/'}`:fallbackUrl;
  }

  function styleMarkup(){
    return '<style id="bsShareGameStyles">.bs-share-game{display:flex;align-items:center;justify-content:center;width:100%;min-height:48px;box-sizing:border-box;margin:-2px 0 12px;padding:11px 16px;border:1px solid #16a34a;border-radius:14px;background:linear-gradient(135deg,#22c55e,#15803d);box-shadow:0 5px 14px rgba(21,128,61,.2);color:#fff;font-size:15px;font-weight:900;text-decoration:none}.bs-share-game:active{transform:scale(.99)}.bs-share-game:focus-visible{outline:3px solid #86efac;outline-offset:2px}</style>';
  }

  function mount(doc=typeof document!=='undefined'?document:null,host=root){
    if(!doc||doc.getElementById('bsShareGame'))return false;
    const tabs=doc.querySelector('.tabs');if(!tabs)return false;
    const link=doc.createElement('a');
    link.id='bsShareGame';
    link.className='bs-share-game';
    link.href=whatsappUrl(currentGameUrl(host));
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent='🟢 Oyunu Arkadaşına Öner';
    link.setAttribute?.('aria-label','Oyunu WhatsApp ile arkadaşına öner');
    tabs.insertAdjacentElement('afterend',link);
    if(!doc.getElementById('bsShareGameStyles'))doc.head.insertAdjacentHTML('beforeend',styleMarkup());
    return true;
  }

  function start(){
    if(typeof document==='undefined')return;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(),{once:true});
    else mount();
  }

  return Object.freeze({shareText,whatsappUrl,currentGameUrl,styleMarkup,mount,start});
});
