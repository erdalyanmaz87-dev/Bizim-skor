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
    return '<style id="bsShareGameStyles">.bs-connection-share-row{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:8px;align-items:stretch;margin-bottom:12px}.bs-connection-share-row #conn{display:flex;align-items:center;min-width:0;min-height:48px;box-sizing:border-box;margin:0;padding:10px 12px;font-size:14px}.bs-share-game{display:flex;align-items:center;justify-content:center;min-width:0;min-height:48px;box-sizing:border-box;margin:0;padding:10px 12px;border:1px solid #16a34a;border-radius:14px;background:linear-gradient(135deg,#22c55e,#15803d);box-shadow:0 5px 14px rgba(21,128,61,.2);color:#fff;font-size:14px;line-height:1.2;font-weight:900;text-align:center;text-decoration:none}.bs-share-game:active{transform:scale(.99)}.bs-share-game:focus-visible{outline:3px solid #86efac;outline-offset:2px}</style>';
  }

  function mount(doc=typeof document!=='undefined'?document:null,host=root){
    if(!doc||doc.getElementById('bsShareGame'))return false;
    const connection=doc.getElementById('conn');if(!connection)return false;
    const row=doc.createElement('div');
    row.id='bsConnectionShareRow';
    row.className='bs-connection-share-row';
    const link=doc.createElement('a');
    link.id='bsShareGame';
    link.className='bs-share-game';
    link.href=whatsappUrl(currentGameUrl(host));
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent='🟢 Oyunu Arkadaşına Öner';
    link.setAttribute?.('aria-label','Oyunu WhatsApp ile arkadaşına öner');
    connection.insertAdjacentElement('beforebegin',row);
    row.appendChild(connection);
    row.appendChild(link);
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
