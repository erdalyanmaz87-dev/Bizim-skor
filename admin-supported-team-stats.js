(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorAdminSupportedTeamStats=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TEAM_NAMES={galatasaray:'Galatasaray',fenerbahce:'Fenerbahçe',besiktas:'Beşiktaş',trabzonspor:'Trabzonspor',basaksehir:'Başakşehir',kasimpasa:'Kasımpaşa',alanyaspor:'Alanyaspor',rizespor:'Çaykur Rizespor',gaziantep:'Gaziantep FK',konyaspor:'Konyaspor',samsunspor:'Samsunspor',eyupspor:'Eyüpspor','goztepe-izmir':'Göztepe',genclerbirligi:'Gençlerbirliği','amed-sk':'Amed SK','corum-fk':'Çorum FK',kocaelispor:'Kocaelispor',erzurumspor:'Erzurumspor'};
  function rows(title,list,detail,key){
    const id=`list-supported-team-${key}`;
    const items=list.length?list.map((x,i)=>`<div${i>=6?' class="bs-admin-stats-extra"':''}><button type="button" class="bs-admin-player" data-admin-player="${esc(x.player_name)}"><b>${esc(x.player_name)}</b><span>${esc(detail(x))}</span></button></div>`).join(''):'<p>Bu grupta oyuncu yok.</p>';
    return `<section class="bs-admin-stats-group bs-admin-supported-team-group" data-admin-supported-list="${key}"><h3>${esc(title)} <small>(${list.length})</small></h3><div id="${id}" class="bs-admin-stats-list compact bs-admin-stats-columns">${items}</div>${list.length>6?`<button type="button" class="bs-admin-stats-toggle" data-admin-stats-toggle="${id}" aria-expanded="false">Tümünü Göster (${list.length})</button>`:''}</section>`;
  }
  function teamDistribution(selected){
    const counts=new Map();
    for(const row of selected){
      const key=String(row.supported_team||'').trim();
      if(!key)continue;
      counts.set(key,(counts.get(key)||0)+1);
    }
    return [...counts.entries()]
      .map(([team,count])=>({team,count,label:TEAM_NAMES[team]||team}))
      .sort((a,b)=>b.count-a.count||a.label.localeCompare(b.label,'tr'));
  }
  function distributionMarkup(selected){
    const dist=teamDistribution(selected);
    return `<section class="bs-admin-stats-group bs-admin-supported-team-distribution"><h3>Takım Dağılımı <small>(${selected.length})</small></h3><div class="bs-admin-stats-list compact bs-admin-stats-columns">${dist.length?dist.map(x=>`<div><b>${esc(x.label)}</b><span>${x.count} kişi</span></div>`).join(''):'<p>Henüz takım seçimi yok.</p>'}</div></section>`;
  }
  function render(data={}){
    const selected=Array.isArray(data.selected)?data.selected:[],unselected=Array.isArray(data.unselected)?data.unselected:[];
    return `<section class="bs-admin-supported-team-summary" data-admin-supported-team-summary><div class="bs-admin-stats-grid"><b>Takım Seçen <strong>${Number(data.selected_count??selected.length)}</strong></b><b>Takım Seçmeyen <strong>${Number(data.unselected_count??unselected.length)}</strong></b></div>${distributionMarkup(selected)}${rows('Takım Seçen Oyuncular',selected,x=>TEAM_NAMES[x.supported_team]||x.supported_team||'—','selected')}${rows('Takım Seçmeyen Oyuncular',unselected,()=> 'Henüz seçim yapmadı','unselected')}</section>`;
  }
  async function load(){const token=String(root.localStorage?.getItem?.('bizimSkorFriendToken')||'');if(!token||!root.sb)return null;const q=await root.sb.rpc('get_admin_supported_team_summary',{p_token:token});if(q.error)throw q.error;return q.data||{};}
  async function enhance(doc=typeof document!=='undefined'?document:null){if(!doc)return false;const body=doc.querySelector('#adminStatisticsModal [data-admin-stats-body]');if(!body||body.querySelector('[data-admin-supported-team-summary]'))return false;try{const data=await load();if(!data)return false;body.insertAdjacentHTML('afterbegin',render(data));return true}catch(e){console.warn('admin supported team stats',e);return false}}
  function mount(doc=typeof document!=='undefined'?document:null){if(!doc)return false;let busy=false;const run=()=>{if(busy)return;busy=true;Promise.resolve(enhance(doc)).finally(()=>busy=false)};doc.addEventListener('click',e=>{if(e.target.closest?.('#openAdminStatistics'))setTimeout(run,250)},true);let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{const modal=doc.getElementById('adminStatisticsModal');if(modal&&!modal.classList.contains('hide'))run()},120)}).observe(doc.body,{childList:true,subtree:true});const modal=doc.getElementById('adminStatisticsModal');if(modal&&!modal.classList.contains('hide'))setTimeout(run,0);return true}
  return Object.freeze({rows,teamDistribution,distributionMarkup,render,load,enhance,mount});
});