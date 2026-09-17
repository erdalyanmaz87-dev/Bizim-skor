(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorSupportedTeam=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const TEAMS=Object.freeze([
    {code:'galatasaray',name:'Galatasaray'},
    {code:'fenerbahce',name:'Fenerbahçe'},
    {code:'besiktas',name:'Beşiktaş'},
    {code:'trabzonspor',name:'Trabzonspor'},
    {code:'basaksehir',name:'Başakşehir'},
    {code:'kasimpasa',name:'Kasımpaşa'},
    {code:'alanyaspor',name:'Alanyaspor'},
    {code:'rizespor',name:'Çaykur Rizespor'},
    {code:'gaziantep',name:'Gaziantep FK'},
    {code:'konyaspor',name:'Konyaspor'},
    {code:'samsunspor',name:'Samsunspor'},
    {code:'eyupspor',name:'Eyüpspor'},
    {code:'goztepe-izmir',name:'Göztepe'},
    {code:'genclerbirligi',name:'Gençlerbirliği'},
    {code:'amed-sk',name:'Amed SK'},
    {code:'corum-fk',name:'Çorum FK'},
    {code:'kocaelispor',name:'Kocaelispor'},
    {code:'erzurumspor',name:'Erzurumspor'}
  ]);
  const byCode=new Map(TEAMS.map(x=>[x.code,x]));
  const norm=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const LOGO_OVERRIDES=Object.freeze({
    kocaelispor:'https://kocaelispor.com.tr/images/upload/7cad04d86cb9f4219a0e635b47121d2f.png',
    erzurumspor:'https://erzurumsporfk.org/wp-content/uploads/2022/08/cropped-ERZURUMSPOR-FK-kopya-3.png'
  });
  function logoUrl(code){
    const team=byCode.get(code);if(!team)return'';
    if(LOGO_OVERRIDES[code])return LOGO_OVERRIDES[code];
    const branded=root.BizimSkorBrandAssets?.teamLogoUrl?.(team.name);if(branded)return branded;
    const slug=code==='goztepe-izmir'?'goztepe-izmir':code==='amed-sk'?'amed':code==='corum-fk'?'corum':code;
    return `https://football-logos.cc/logos/turkey/256x256/${slug}.png`;
  }
  function normalizeTeamMap(rows=[]){return new Map(rows.filter(x=>x?.name&&x?.supported_team).map(x=>[norm(x.name),String(x.supported_team)]))}
  function playerLogoMarkup(code,label=''){const url=logoUrl(code);if(!url)return'';return `<img class="bs-supported-team-logo" src="${esc(url)}" alt="${esc(label||byCode.get(code)?.name||'Takım')}" loading="lazy" referrerpolicy="no-referrer">`}
  function teamPickerMarkup(){return `<div class="bs-supported-team-card" role="dialog" aria-modal="true"><div class="bs-supported-team-head"><span>⚽ BİZİMSKOR</span><h2>Takımını seç</h2><p>Takımını seç, BizimSkor'da rengini belli et! Seçtiğin takım tüm sıralamalarda ve Müzende adının yanında görünecek.</p></div><div class="bs-supported-team-grid">${TEAMS.map(t=>`<button type="button" class="bs-supported-team-choice" data-supported-team-code="${esc(t.code)}">${playerLogoMarkup(t.code,t.name)}<span>${esc(t.name)}</span></button>`).join('')}</div><p class="bs-supported-team-warning">⚠️ Takım seçimi tek seferliktir. Kaydettikten sonra değiştirilemez.</p><button type="button" class="bs-supported-team-save" data-supported-team-save disabled>Takımımı Kaydet</button><p class="bs-supported-team-status" data-supported-team-status></p></div>`}
  function ensureStyle(doc){if(doc.getElementById('bsSupportedTeamStyles'))return;const style=doc.createElement('style');style.id='bsSupportedTeamStyles';style.textContent=`.bs-supported-team-modal{position:fixed;inset:0;z-index:12000;display:flex;align-items:flex-end;justify-content:center;background:rgba(2,8,23,.72);backdrop-filter:blur(4px)}.bs-supported-team-modal.hide{display:none}.bs-supported-team-card{width:min(100%,580px);max-height:92vh;overflow:auto;background:#f8fafc;color:#0f172a;border-radius:24px 24px 0 0;padding:18px;box-shadow:0 -18px 60px rgba(0,0,0,.35)}.bs-supported-team-head{text-align:center}.bs-supported-team-head>span{font-size:11px;font-weight:900;letter-spacing:1.5px;color:#1d4ed8}.bs-supported-team-head h2{margin:5px 0 8px}.bs-supported-team-head p{font-size:13px;color:#475569;line-height:1.45;margin:0 0 14px}.bs-supported-team-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.bs-supported-team-choice{display:flex;min-height:86px;flex-direction:column;align-items:center;justify-content:center;gap:7px;background:#fff;color:#0f172a;border:2px solid #e2e8f0;border-radius:14px;padding:9px 5px;font-size:11px}.bs-supported-team-choice.selected{border-color:#2563eb;background:#eff6ff;box-shadow:0 0 0 2px rgba(37,99,235,.12)}.bs-supported-team-choice .bs-supported-team-logo{width:40px;height:40px}.bs-supported-team-logo{width:22px;height:22px;object-fit:contain;vertical-align:middle;display:inline-block;flex:0 0 auto}.bs-supported-team-warning{font-size:11px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:9px;margin:12px 0}.bs-supported-team-save{width:100%;background:#0f172a;color:#fff}.bs-supported-team-save:disabled{opacity:.45}.bs-supported-team-status{font-size:12px;text-align:center;min-height:18px;color:#b91c1c}.bs-supported-player-wrap{display:inline-flex;align-items:center;gap:6px}.bs-museum-team-title{display:flex;align-items:center;gap:8px}@media(min-width:620px){.bs-supported-team-modal{align-items:center}.bs-supported-team-card{border-radius:24px}.bs-supported-team-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}`;doc.head.appendChild(style)}
  function ensureModal(doc){let modal=doc.getElementById('bsSupportedTeamModal');if(modal)return modal;modal=doc.createElement('div');modal.id='bsSupportedTeamModal';modal.className='bs-supported-team-modal hide';modal.innerHTML=teamPickerMarkup();doc.body.appendChild(modal);return modal}
  function decorateRankings(doc,teamMap){
    doc.querySelectorAll('[data-player-name]').forEach(el=>{if(el.dataset?.supportedTeamDecorated==='1')return;const name=(el.dataset?.playerName||'').trim(),code=teamMap.get(norm(name));if(!code)return;const logo=playerLogoMarkup(code,byCode.get(code)?.name);if(!logo)return;el.insertAdjacentHTML('afterbegin',logo);el.classList.add('bs-supported-player-wrap');if(el.dataset)el.dataset.supportedTeamDecorated='1'});
    doc.querySelectorAll('.bs-museum-head h2').forEach(h=>{if(h.dataset?.supportedTeamDecorated==='1')return;const name=h.textContent.replace(/^🏛️\s*/,'').trim(),code=teamMap.get(norm(name));if(!code)return;h.innerHTML=`<span class="bs-museum-team-title">${playerLogoMarkup(code,byCode.get(code)?.name)}<span>🏛️ ${esc(name)}</span></span>`;h.dataset.supportedTeamDecorated='1'});
  }
  let cachedContext=null,loading=null;
  async function loadContext(){const token=root.localStorage?.getItem('bizimSkorFriendToken');if(!token||!root.sb)return null;if(cachedContext)return cachedContext;if(loading)return loading;loading=root.sb.rpc('get_supported_team_context',{p_token:token}).then(q=>{loading=null;if(q.error)throw q.error;cachedContext=q.data||{};return cachedContext}).catch(e=>{loading=null;throw e});return loading}
  function contextMap(ctx){return normalizeTeamMap(ctx?.players||[])}
  async function refresh(doc){const ctx=await loadContext();if(!ctx)return;const map=contextMap(ctx);decorateRankings(doc,map);if(!ctx.current_team)ensureModal(doc).classList.remove('hide')}
  async function saveChoice(doc,code){const token=root.localStorage?.getItem('bizimSkorFriendToken');if(!token)return;const q=await root.sb.rpc('set_supported_team_once',{p_token:token,p_team_code:code});if(q.error)throw q.error;cachedContext=null;const ctx=await loadContext();ensureModal(doc).classList.add('hide');decorateRankings(doc,contextMap(ctx))}
  function mount(doc=typeof document!=='undefined'?document:null){if(!doc)return false;ensureStyle(doc);const modal=ensureModal(doc);let selected='';modal.addEventListener('click',async e=>{const choice=e.target.closest?.('[data-supported-team-code]');if(choice){selected=choice.dataset.supportedTeamCode;modal.querySelectorAll('[data-supported-team-code]').forEach(x=>x.classList.toggle('selected',x===choice));modal.querySelector('[data-supported-team-save]').disabled=false;return}if(e.target.closest?.('[data-supported-team-save]')&&selected){const status=modal.querySelector('[data-supported-team-status]'),save=modal.querySelector('[data-supported-team-save]');save.disabled=true;status.textContent='Kaydediliyor…';try{await saveChoice(doc,selected);status.textContent=''}catch(err){status.textContent=err?.message||'Takım kaydedilemedi.';save.disabled=false}}});const run=()=>refresh(doc).catch(e=>console.warn('supported team',e));setTimeout(run,600);let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{if(cachedContext)decorateRankings(doc,contextMap(cachedContext));else run()},80)}).observe(doc.body,{childList:true,subtree:true});root.addEventListener?.('focus',()=>{if(cachedContext)decorateRankings(doc,contextMap(cachedContext))});return true}
  return Object.freeze({TEAMS,LOGO_OVERRIDES,logoUrl,normalizeTeamMap,playerLogoMarkup,teamPickerMarkup,decorateRankings,refresh,contextMap,mount});
});
