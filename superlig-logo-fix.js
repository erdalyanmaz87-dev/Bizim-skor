(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorSuperLigLogoFix=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const normalize=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const TEAM_KEYS={
    'kocaelispor':'kocaelispor',
    'erzurumspor':'erzurumspor',
    'erzurumspor fk':'erzurumspor',
    'c rizespor':'rizespor',
    'caykur rizespor':'rizespor',
    'rizespor':'rizespor'
  };
  const LOGOS={
    kocaelispor:'https://kocaelispor.com.tr/images/upload/7cad04d86cb9f4219a0e635b47121d2f.png',
    erzurumspor:'https://erzurumsporfk.org/wp-content/uploads/2025/08/erzurumsporfklogo.png',
    rizespor:'https://assets.football-logos.cc/logos/turkey/1500x1500/rizespor.bb8c7526.png'
  };
  function teamKey(name){return TEAM_KEYS[normalize(name)]||null}
  function logoFor(name){const key=teamKey(name);return key?LOGOS[key]||null:null}
  function patchBrand(node){
    if(!node)return false;
    const nameNode=node.querySelector?.('.bs-team-name');
    const name=String(nameNode?.textContent||'').trim();
    const src=logoFor(name);
    if(!src)return false;
    let img=node.querySelector?.('img.bs-team-logo');
    const fallback=node.querySelector?.('.bs-team-fallback');
    if(!img){
      img=(node.ownerDocument||root.document).createElement('img');
      img.className='bs-team-logo';
      img.alt='';
      img.loading='eager';
      img.decoding='async';
      img.referrerPolicy='no-referrer';
      node.insertBefore(img,node.firstChild||null);
    }
    if(img.getAttribute('src')!==src)img.setAttribute('src',src);
    img.hidden=false;
    img.onerror=()=>{img.hidden=true;if(fallback)fallback.hidden=false};
    if(fallback)fallback.hidden=true;
    node.dataset.bsLogoFixed='1';
    return true;
  }
  function patch(doc=root.document){
    if(!doc?.querySelectorAll)return false;
    let changed=false;
    doc.querySelectorAll('.bs-team-brand').forEach(node=>{changed=patchBrand(node)||changed});
    return changed;
  }
  function mount(doc=root.document){
    if(!doc?.body)return false;
    patch(doc);
    let queued=false;
    const run=()=>{queued=false;patch(doc)};
    new MutationObserver(()=>{if(queued)return;queued=true;(root.requestAnimationFrame||root.setTimeout)(run,0)}).observe(doc.body,{childList:true,subtree:true});
    root.addEventListener?.('load',()=>root.setTimeout?.(()=>patch(doc),100));
    root.addEventListener?.('bizimskor:session-ready',()=>root.setTimeout?.(()=>patch(doc),100));
    return true;
  }
  return Object.freeze({normalize,teamKey,logoFor,patchBrand,patch,mount,LOGOS});
});
