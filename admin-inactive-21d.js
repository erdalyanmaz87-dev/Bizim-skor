(function(root){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token=()=>String(root.localStorage?.getItem('bizimSkorFriendToken')||'');
  function lastActivityText(value){
    if(!value)return 'Henüz giriş kaydı yok';
    try{return new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}
    catch(_){return 'Giriş kaydı bilinmiyor'}
  }
  function replaceSummary(body,summary={}){
    const cards=[...body.querySelectorAll('.bs-admin-stats-grid>b')];
    const active=Number(summary.total_players??summary.active_players??0);
    const participation=Number(summary.participation??0);
    if(cards[0])cards[0].innerHTML=`Aktif Oyuncu <strong>${active}</strong>`;
    const participationCard=cards.find(card=>String(card.textContent||'').trim().startsWith('Katılım'));
    if(participationCard)participationCard.innerHTML=`Aktif Katılım <strong>%${participation}</strong>`;
  }
  function inactiveMarkup(rows=[]){
    return `<section class="bs-admin-stats-group" data-admin-inactive-21d><h3>3 Haftadır Oyuna Girmeyenler <small>(${rows.length})</small></h3><div class="bs-admin-stats-list compact bs-admin-stats-columns">${rows.length?rows.map(x=>`<div><button type="button" class="bs-admin-player" data-admin-player="${esc(x.player_name)}"><b>${esc(x.player_name)}</b><span>${esc(lastActivityText(x.last_activity))}</span></button></div>`).join(''):'<p>Bu grupta oyuncu yok.</p>'}</div></section>`;
  }
  function apply(body,data={}){
    if(!body)return false;
    replaceSummary(body,data.summary||{});
    body.querySelector('[data-admin-inactive-21d]')?.remove();
    const stats=body.querySelector('.bs-admin-stats');
    if(stats)stats.insertAdjacentHTML('beforeend',inactiveMarkup(data.inactive_21d||[]));
    return true;
  }
  async function waitForBody(doc,tries=30){
    for(let i=0;i<tries;i++){
      const body=doc.querySelector?.('#adminStatisticsModal [data-admin-stats-body]');
      if(body?.querySelector?.('.bs-admin-stats'))return body;
      await new Promise(resolve=>root.setTimeout(resolve,100));
    }
    return doc.querySelector?.('#adminStatisticsModal [data-admin-stats-body]')||null;
  }
  async function refresh(doc=root.document){
    if(!root.sb?.rpc||!token())return false;
    const q=await root.sb.rpc('get_admin_statistics_dashboard',{p_token:token()});
    if(q.error)throw q.error;
    const body=await waitForBody(doc);
    return apply(body,q.data||{});
  }
  function mount(doc=root.document){
    if(!doc||doc.documentElement?.dataset?.adminInactive21d==='1')return false;
    doc.documentElement.dataset.adminInactive21d='1';
    doc.addEventListener('click',event=>{
      if(event.target.closest?.('#openAdminStatistics'))root.setTimeout(()=>refresh(doc).catch(e=>console.warn('admin inactive 21d',e)),0);
    },true);
    return true;
  }
  const api=Object.freeze({lastActivityText,replaceSummary,inactiveMarkup,apply,waitForBody,refresh,mount});
  root.BizimSkorAdminInactive21d=api;
  if(typeof document!=='undefined')mount(document);
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
