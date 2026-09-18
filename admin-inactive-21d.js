(function(root){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token=()=>String(root.localStorage?.getItem('bizimSkorFriendToken')||'');
  function lastActivityText(value){
    if(!value)return 'Henüz giriş kaydı yok';
    try{return new Intl.DateTimeFormat('tr-TR',{timeZone:'Europe/Istanbul',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}
    catch(_){return 'Giriş kaydı bilinmiyor'}
  }
  function summaryCard(label,value,attr){return `<b ${attr}>${label} <strong>${Number(value||0)}</strong></b>`}
  function replaceSummary(body,summary={}){
    const grid=body.querySelector('.bs-admin-stats-grid');
    if(!grid)return false;
    grid.querySelectorAll('[data-admin-activity-card]').forEach(x=>x.remove());
    const total=Number(summary.total_registered??summary.total_players??0);
    const inactive=Number(summary.inactive_21d??0);
    const active=Number(summary.total_players??summary.active_players??Math.max(0,total-inactive));
    grid.insertAdjacentHTML('afterbegin',summaryCard('Toplam Oyuncu',total,'data-admin-activity-card="total"')+summaryCard('21 Gündür Oyuna Girmeyen',inactive,'data-admin-activity-card="inactive"')+summaryCard('Aktif Oyuncu',active,'data-admin-activity-card="active"'));
    const oldTotal=[...grid.querySelectorAll('b')].find(card=>!card.hasAttribute('data-admin-activity-card')&&String(card.textContent||'').trim().startsWith('Toplam Oyuncu'));
    oldTotal?.remove();
    const participationCard=[...grid.querySelectorAll('b')].find(card=>String(card.textContent||'').trim().startsWith('Katılım')||String(card.textContent||'').trim().startsWith('Aktif Katılım'));
    if(participationCard)participationCard.innerHTML=`Aktif Katılım <strong>%${Number(summary.participation??0)}</strong>`;
    return true;
  }
  function listMarkup(id,rows=[]){
    const items=rows.map((x,i)=>`<div${i>=6?' class="bs-admin-stats-extra"':''}><button type="button" class="bs-admin-player" data-admin-player="${esc(x.player_name)}"><b>${esc(x.player_name)}</b><span>${esc(lastActivityText(x.last_activity))}</span></button></div>`).join('');
    return `<div id="${id}" class="bs-admin-stats-list compact bs-admin-stats-columns">${items||'<p>Bu grupta oyuncu yok.</p>'}</div>${rows.length>6?`<button type="button" class="bs-admin-stats-toggle" data-admin-stats-toggle="${id}" aria-expanded="false">Tümünü Göster (${rows.length})</button>`:''}`;
  }
  function inactiveMarkup(rows=[]){
    const id='list-21-gundur-oyuna-girmeyenler';
    return `<section class="bs-admin-stats-group" data-admin-inactive-21d><h3>21 Gündür Oyuna Girmeyenler <small>(${rows.length})</small></h3>${listMarkup(id,rows)}</section>`;
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
  const api=Object.freeze({lastActivityText,summaryCard,replaceSummary,listMarkup,inactiveMarkup,apply,waitForBody,refresh,mount});
  root.BizimSkorAdminInactive21d=api;
  if(typeof document!=='undefined')mount(document);
  if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
