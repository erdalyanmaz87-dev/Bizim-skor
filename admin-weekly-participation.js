(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorAdminWeeklyParticipation=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
  const pct=v=>Number(v||0).toFixed(1).replace(/\.0$/,'');
  function render(rows=[]){
    const data=Array.isArray(rows)?rows:[];
    const bars=data.length?data.map(r=>{
      const value=Math.max(0,Math.min(100,Number(r.participation||0)));
      return `<div class="bs-admin-participation-row"><div class="bs-admin-participation-meta"><b>${esc(r.week)}. Hafta</b><span>${esc(r.completed)} / ${esc(r.total_players)}</span><strong>%${pct(r.participation)}</strong></div><div class="bs-admin-participation-track"><i style="width:${value}%"></i></div></div>`;
    }).join(''):'<p class="small">Henüz haftalık katılım verisi yok.</p>';
    return `<section class="bs-admin-stats-group bs-admin-weekly-participation" data-admin-weekly-participation><h3>Haftalara Göre Katılım</h3><p class="small">Tahminlerini tamamlayan oyuncuların haftalık oranı</p>${bars}</section>`;
  }
  function ensureStyle(doc){
    if(!doc||doc.getElementById('admin-weekly-participation-style'))return;
    const s=doc.createElement('style');
    s.id='admin-weekly-participation-style';
    s.textContent='.bs-admin-weekly-participation{margin-top:14px}.bs-admin-participation-row{margin:10px 0}.bs-admin-participation-meta{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;font-size:12px}.bs-admin-participation-meta span{color:#64748b}.bs-admin-participation-meta strong{font-size:14px}.bs-admin-participation-track{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden;margin-top:5px}.bs-admin-participation-track i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2563eb,#22c55e)}';
    doc.head.appendChild(s);
  }
  async function load(){
    const token=String(root.localStorage?.getItem?.('bizimSkorFriendToken')||'');
    if(!token||!root.sb)return [];
    const q=await root.sb.rpc('get_admin_weekly_participation_summary',{p_token:token});
    if(q.error)throw q.error;
    return Array.isArray(q.data)?q.data:(q.data?.rows||[]);
  }
  async function enhance(doc=typeof document!=='undefined'?document:null){
    if(!doc)return false;
    const body=doc.querySelector('#adminStatisticsModal [data-admin-stats-body]');
    if(!body||body.querySelector('[data-admin-weekly-participation]'))return false;
    ensureStyle(doc);
    try{
      const rows=await load();
      const grid=body.querySelector('.bs-admin-stats-grid');
      if(grid)grid.insertAdjacentHTML('afterend',render(rows));
      else body.insertAdjacentHTML('afterbegin',render(rows));
      return true;
    }catch(e){console.warn('admin weekly participation',e);return false;}
  }
  function ensureVisible(doc,run){
    let attempts=0;
    const tick=()=>{
      const modal=doc.getElementById('adminStatisticsModal');
      if(!modal||modal.classList.contains('hide'))return false;
      attempts+=1;
      run();
      return attempts<20;
    };
    tick();
    const id=setInterval(()=>{if(!tick())clearInterval(id)},250);
    return id;
  }
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc)return false;
    let busy=false;
    const run=()=>{if(busy)return;busy=true;Promise.resolve(enhance(doc)).finally(()=>busy=false)};
    doc.addEventListener('click',e=>{if(e.target.closest?.('#openAdminStatistics'))setTimeout(()=>ensureVisible(doc,run),50)},true);
    let timer=null;
    new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{const modal=doc.getElementById('adminStatisticsModal');if(modal&&!modal.classList.contains('hide'))run()},120)}).observe(doc.body,{childList:true,subtree:true});
    const modal=doc.getElementById('adminStatisticsModal');
    if(modal&&!modal.classList.contains('hide'))setTimeout(()=>ensureVisible(doc,run),0);
    return true;
  }
  return Object.freeze({render,load,enhance,ensureVisible,mount});
});
