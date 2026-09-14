(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else{root.BizimSkorSimpleNavigation=api;api.mount();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const GROUPS=[
    {key:'rankings',title:'Sıralamalar',items:[
      ['arena','🏆','Arena'],
      ['championsRanking','⭐','Şampiyonlar Ligi Genel Sıralaması'],
      ['nationsRanking','🌍','UEFA Uluslar Ligi Genel Sıralaması'],
      ['general','🇹🇷','Süper Lig Genel Sıralaması'],
      ['weeklyRankings','📊','Hafta Sıralaması']
    ]},
    {key:'football',title:'Futbol',items:[
      ['resultsWeek','📅','Fikstür'],
      ['footballCenter','⚽','Futbol Merkezi']
    ]},
    {key:'social',title:'Sosyal',items:[
      ['friendLeagues','👥','Arkadaş Liglerim'],
      ['chat','💬','Sohbet']
    ]},
    {key:'account',title:'Hesabım',items:[
      ['history','📝','Tahmin Geçmişim']
    ]},
    {key:'info',title:'Bilgi',items:[
      ['rules','📜','Kurallar']
    ]}
  ];
  const esc=value=>String(value??'').replace(/[&<>'\"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[char]));

  function canonicalTab(name){return name==='live'?'weeklyRankings':String(name||'')}
  function preferredTabNames(name){return canonicalTab(name)==='weeklyRankings'?['weeklyRankings','live']:[canonicalTab(name)]}
  function bottomTargetForTab(name){const tab=canonicalTab(name);return tab==='home'||tab==='pred'?tab:'menu'}
  function predictionProgress(completed){const rows=completed||[],total=rows.length,complete=rows.filter(Boolean).length;return{complete,total,percent:total?Math.round(complete*100/total):0}}
  function groupedItems(availableNames){
    const available=new Set((availableNames||[]).map(canonicalTab));
    return GROUPS.map(group=>({key:group.key,title:group.title,items:group.items.filter(([tab])=>available.has(tab)).map(([tab,icon,label])=>({tab,icon,label}))})).filter(group=>group.items.length);
  }
  function bottomMarkup(active='home',progress={complete:0,total:0,percent:0}){
    const items=[['home','⌂','Ana Sayfa'],['pred','✎','Tahmin Yap'],['predictionStatus','','Tahmin Durumu'],['menu','☰','Menü']];
    return `<nav id="bsSimpleBottomNav" class="bs-simple-bottom" aria-label="Ana menü">${items.map(([key,icon,label])=>`<button type="button" data-simple-nav="${key}"${active===key?' aria-current="page"':''} aria-label="${label}">${key==='predictionStatus'?`<span class="bs-simple-progress" style="--bs-progress:${progress.percent}%" aria-hidden="true"><b>%${progress.percent}</b></span>`:`<span class="bs-simple-bottom-icon" aria-hidden="true">${icon}</span>`}<span>${label}</span>${key==='menu'?'<i class="bs-simple-unread" aria-hidden="true"></i>':''}</button>`).join('')}</nav>`;
  }
  function accountRows(account){
    const rows=account?.loggedIn
      ?[['weeklyResult','📊','Haftalık Sonucum'],['update','👤','Bilgilerimi Güncelle'],['museum','🏛️','Müzem'],['logout','↪','Çıkış Yap']]
      :[['login','👤','Giriş Yap']];
    return rows.map(([action,icon,label])=>`<button type="button" class="bs-simple-row" data-simple-account="${action}"><span aria-hidden="true">${icon}</span><b>${label}</b><span class="bs-simple-chevron" aria-hidden="true">›</span></button>`).join('');
  }
  function drawerMarkup(groups,account={loggedIn:false}){
    const sections=(groups||[]).map(group=>{
      let rows=group.items.map(item=>`<button type="button" class="bs-simple-row" data-simple-tab="${esc(item.tab)}"><span aria-hidden="true">${item.icon}</span><b>${esc(item.label)}</b>${item.tab==='chat'?'<i class="bs-simple-unread" aria-hidden="true"></i>':''}<span class="bs-simple-chevron" aria-hidden="true">›</span></button>`).join('');
      if(group.key==='account')rows+=accountRows(account);
      if(group.key==='social')rows+=`<button type="button" class="bs-simple-row" data-simple-account="shareGame"><span aria-hidden="true">🟢</span><b>Oyunu Arkadaşına Öner</b><span class="bs-simple-chevron" aria-hidden="true">›</span></button>`;
      if(group.key==='social'&&account.loggedIn)rows+=`<button type="button" class="bs-simple-row bs-simple-champion-row" data-simple-account="inviteChampion"><span aria-hidden="true">🏆</span><b>Ayın Davet Şampiyonu</b><span class="bs-simple-chevron" aria-hidden="true">›</span></button>`;
      if(group.key==='info')rows+=`<button type="button" class="bs-simple-row" data-simple-account="support"><span aria-hidden="true">📩</span><b>Bize Ulaşın</b><span class="bs-simple-chevron" aria-hidden="true">›</span></button>`;
      return `<section class="bs-simple-group" data-simple-nav-group="${group.key}"><h3>${esc(group.title)}</h3>${rows}</section>`;
    }).join('');
    return `<div id="bsSimpleNavDrawer" class="bs-simple-drawer" aria-hidden="true"><button type="button" class="bs-simple-backdrop" data-simple-close aria-label="Menüyü kapat"></button><aside class="bs-simple-panel" role="dialog" aria-modal="true" aria-labelledby="bsSimpleMenuTitle" tabindex="-1"><header><div><span>Bizim Skor</span><h2 id="bsSimpleMenuTitle">Menü</h2></div><button type="button" class="bs-simple-close" data-simple-close aria-label="Menüyü kapat">×</button></header><div class="bs-simple-content">${sections}</div></aside></div>`;
  }
  function featureMarkup(){return `<div id="bsSimpleFeatureLayer" class="bs-simple-feature" aria-hidden="true"><button type="button" class="bs-simple-feature-backdrop" data-simple-feature-close aria-label="Pencereyi kapat"></button><section class="bs-simple-feature-panel" role="dialog" aria-modal="true" aria-labelledby="bsSimpleFeatureTitle" tabindex="-1"><header><div><small>BİZİM SKOR</small><h2 id="bsSimpleFeatureTitle">Tahmin Durumu</h2></div><button type="button" class="bs-simple-close" data-simple-feature-close aria-label="Pencereyi kapat">×</button></header><div class="bs-simple-feature-body"><div id="bsSimplePredictionStatus"></div><div id="bsSimpleInviteChampion" hidden></div></div></section></div>`}
  function styleMarkup(){return `<style id="bsSimpleNavigationStyles">
    body.bs-simple-nav-ready{padding-bottom:82px}
    body.bs-simple-nav-ready .tabs.bs-nav-ready,body.bs-simple-nav-ready #bsHeaderPrimaryActions{display:none!important}
    body.bs-simple-nav-ready .bs-header-actions>#bsHeaderUpdate,body.bs-simple-nav-ready .bs-header-actions>#bsHeaderSupport,body.bs-simple-nav-ready .bs-header-actions>#bsHeaderAccountAction{display:none!important}
    body.bs-simple-nav-ready .bs-header-guest-actions>#bsHeaderSupport{display:none!important}
    body.bs-simple-nav-ready .bs-header-actions>#bsHeaderPush{display:grid;place-items:center;width:42px;height:42px;padding:0;border-radius:50%;font-size:0}
    body.bs-simple-nav-ready .bs-header-actions>#bsHeaderPush:before{content:attr(data-simple-icon);font-size:20px}
    body.bs-simple-nav-ready #bsConnectionShareRow{display:none!important}
    body.bs-simple-nav-ready #bsWeeklyResultCardShell{display:contents!important}
    body.bs-simple-nav-ready #bsWeeklyResultTrigger{display:none!important}
    .bs-theme-header-host{display:flex!important;align-items:center!important;margin:0 4px 0 0!important;min-width:0!important}
    .bs-theme-header-host .bs-theme-toggle{transform:scale(.84);transform-origin:right center;margin:0!important}
    .bs-simple-bottom{position:fixed;z-index:9990;left:50%;bottom:0;transform:translateX(-50%);display:grid;grid-template-columns:repeat(4,1fr);width:min(760px,100%);padding:7px max(8px,env(safe-area-inset-right)) max(7px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left));box-sizing:border-box;border:1px solid #e2e8f0;border-bottom:0;border-radius:20px 20px 0 0;background:rgba(255,255,255,.97);box-shadow:0 -8px 26px rgba(15,23,42,.12);backdrop-filter:blur(14px)}
    .bs-simple-bottom button{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:58px;padding:4px;border:0;border-radius:13px;background:transparent;color:#64748b;font:800 11px/1.1 system-ui,-apple-system,sans-serif}
    .bs-simple-bottom button[aria-current="page"]{background:#eff6ff;color:#1d4ed8}
    .bs-simple-bottom-icon{font-size:23px;font-weight:900;line-height:1}
    .bs-simple-progress{display:grid;place-items:center;width:31px;height:31px;border-radius:50%;background:conic-gradient(#16a34a var(--bs-progress),#dbe4ee 0);position:relative}.bs-simple-progress:before{content:"";position:absolute;inset:4px;border-radius:50%;background:#fff}.bs-simple-progress b{position:relative;font-size:8px;color:#166534}
    .bs-simple-unread{display:none;position:absolute;width:8px;height:8px;border-radius:50%;background:#dc2626;box-shadow:0 0 0 2px #fff}
    .bs-simple-bottom .bs-simple-unread{top:7px;right:calc(50% - 21px)}
    .bs-simple-drawer{position:fixed;z-index:10060;inset:0;display:block;visibility:hidden;pointer-events:none}
    .bs-simple-drawer.is-open{visibility:visible;pointer-events:auto}
    .bs-simple-backdrop{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:0;background:rgba(2,6,23,.58);opacity:0;transition:opacity .2s ease}
    .bs-simple-drawer.is-open .bs-simple-backdrop{opacity:1}
    .bs-simple-panel{position:absolute;top:0;bottom:0;left:0;width:min(390px,88vw);display:flex;flex-direction:column;box-sizing:border-box;background:#f8fafc;color:#0f172a;box-shadow:18px 0 45px rgba(2,6,23,.3);transform:translateX(-105%);transition:transform .22s ease;outline:0}
    .bs-simple-drawer.is-open .bs-simple-panel{transform:translateX(0)}
    .bs-simple-panel>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:20px 18px 14px;border-bottom:1px solid #e2e8f0;background:#fff}
    .bs-simple-panel>header span{color:#2563eb;font-size:11px;font-weight:900;letter-spacing:.13em;text-transform:uppercase}.bs-simple-panel>header h2{margin:2px 0 0;font-size:25px}.bs-simple-close{display:grid;place-items:center;width:42px;height:42px;padding:0;border:1px solid #cbd5e1;border-radius:50%;background:#fff;color:#0f172a;font-size:28px;line-height:1}
    .bs-simple-content{overflow-y:auto;padding:9px 13px calc(24px + env(safe-area-inset-bottom))}
    .bs-simple-group{scroll-margin-top:10px;padding:9px 0;border-bottom:1px solid #e2e8f0}.bs-simple-group:last-child{border-bottom:0}.bs-simple-group h3{margin:2px 8px 7px;color:#64748b;font-size:11px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
    .bs-simple-row{position:relative;display:grid;grid-template-columns:31px minmax(0,1fr) auto;align-items:center;gap:7px;width:100%;min-height:48px;padding:7px 9px;border:0;border-radius:12px;background:transparent;color:#0f172a;text-align:left}.bs-simple-row:hover,.bs-simple-row:focus-visible{background:#eaf2ff}.bs-simple-row>span:first-child{font-size:21px;text-align:center}.bs-simple-row b{font-size:13px}.bs-simple-chevron{color:#94a3b8;font-size:25px}.bs-simple-row .bs-simple-unread{right:34px;top:20px}
    .bs-simple-champion-row{background:linear-gradient(135deg,#fff7d6,#fffbeb);color:#854d0e}.bs-simple-champion-row>span:first-child{filter:drop-shadow(0 2px 2px rgba(133,77,14,.2))}
    .bs-simple-nav-has-unread .bs-simple-unread{display:block}
    .bs-simple-feature{position:fixed;z-index:10055;inset:0;visibility:hidden;pointer-events:none}.bs-simple-feature.is-open{visibility:visible;pointer-events:auto}.bs-simple-feature-backdrop{position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:0;background:rgba(2,6,23,.58);opacity:0;transition:opacity .2s ease}.bs-simple-feature.is-open .bs-simple-feature-backdrop{opacity:1}
    .bs-simple-feature-panel{position:absolute;left:50%;bottom:76px;width:min(720px,calc(100% - 20px));max-height:min(74vh,650px);overflow:hidden;box-sizing:border-box;border-radius:22px;background:#f8fafc;color:#0f172a;box-shadow:0 18px 50px rgba(2,6,23,.35);transform:translate(-50%,calc(100% + 100px));transition:transform .22s ease;outline:0}.bs-simple-feature.is-open .bs-simple-feature-panel{transform:translate(-50%,0)}
    .bs-simple-feature-panel>header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid #e2e8f0;background:#fff}.bs-simple-feature-panel>header small{color:#2563eb;font-size:10px;font-weight:900;letter-spacing:.12em}.bs-simple-feature-panel>header h2{margin:2px 0 0;font-size:21px}.bs-simple-feature-body{max-height:calc(min(74vh,650px) - 72px);overflow:auto;padding:13px}.bs-simple-feature-summary{display:flex;align-items:center;gap:12px;margin-bottom:9px;padding:12px;border-radius:16px;background:#ecfdf5;color:#14532d}.bs-simple-feature-summary .bs-simple-progress{width:48px;height:48px;flex:0 0 48px}.bs-simple-feature-summary .bs-simple-progress:before{inset:5px}.bs-simple-feature-summary .bs-simple-progress b{font-size:11px}.bs-simple-feature-summary strong{display:block;font-size:15px}.bs-simple-feature-summary span{font-size:12px}.bs-simple-feature-empty{margin:0;padding:18px;text-align:center;color:#64748b}.bs-simple-feature-body .bs-week-cards{margin-bottom:0}.bs-simple-feature-body #bsInviteGrowthShell{display:block!important;margin:0}
    html[data-theme="dark"] .bs-simple-bottom{background:rgba(15,23,42,.97);border-color:#334155;box-shadow:0 -8px 26px rgba(0,0,0,.35)}html[data-theme="dark"] .bs-simple-bottom button{color:#94a3b8}html[data-theme="dark"] .bs-simple-bottom button[aria-current="page"]{background:#172554;color:#bfdbfe}
    html[data-theme="dark"] .bs-simple-panel{background:#020617;color:#e5e7eb}html[data-theme="dark"] .bs-simple-panel>header{background:#111827;border-color:#334155}html[data-theme="dark"] .bs-simple-close{background:#1e293b;color:#f8fafc;border-color:#475569}html[data-theme="dark"] .bs-simple-group{border-color:#334155}html[data-theme="dark"] .bs-simple-group h3{color:#94a3b8}html[data-theme="dark"] .bs-simple-row{color:#e5e7eb}html[data-theme="dark"] .bs-simple-row:hover,html[data-theme="dark"] .bs-simple-row:focus-visible{background:#172033}html[data-theme="dark"] .bs-simple-unread{box-shadow:0 0 0 2px #0f172a}
    html[data-theme="dark"] .bs-simple-progress{background:conic-gradient(#22c55e var(--bs-progress),#334155 0)}html[data-theme="dark"] .bs-simple-progress:before{background:#0f172a}html[data-theme="dark"] .bs-simple-progress b{color:#86efac}html[data-theme="dark"] .bs-simple-feature-panel{background:#020617;color:#e5e7eb}html[data-theme="dark"] .bs-simple-feature-panel>header{background:#111827;border-color:#334155}html[data-theme="dark"] .bs-simple-feature-summary{background:#052e16;color:#bbf7d0}html[data-theme="dark"] .bs-simple-champion-row{background:#422006;color:#fde68a}
    @media(max-width:430px){.bs-theme-header-host .bs-theme-toggle{transform:scale(.72)}}
    @media(min-width:761px){.bs-simple-bottom{bottom:12px;border-bottom:1px solid #e2e8f0;border-radius:20px}.bs-simple-panel{width:390px}}
    @media(prefers-reduced-motion:reduce){.bs-simple-backdrop,.bs-simple-panel{transition:none}}
  </style>`}

  function availableTabs(doc){return[...doc.querySelectorAll('.tab[data-tab]')].map(tab=>tab.dataset.tab)}
  function accountState(){return{loggedIn:!!String(root?.localStorage?.getItem('bizimSkorName')||'').trim()}}
  function findOriginalTab(doc,name){for(const candidate of preferredTabNames(name)){const found=doc.querySelector(`.tab[data-tab="${candidate}"]`);if(found)return found}return null}
  function currentOriginalTab(doc){return doc.querySelector('.tab[data-tab].active')?.dataset.tab||'home'}
  function setBottomActive(doc,key){doc.querySelectorAll('[data-simple-nav]').forEach(button=>{if(button.dataset.simpleNav===key)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')})}
  function cardCompletion(doc){return[...doc.querySelectorAll('#bsPredictionWeekCards .bs-week-card')].map(card=>card.classList.contains('done'))}
  function syncPredictionStatus(doc){const progress=predictionProgress(cardCompletion(doc)),button=doc.querySelector('[data-simple-nav="predictionStatus"]');if(!button)return progress;const ring=button.querySelector('.bs-simple-progress');if(ring){ring.style.setProperty('--bs-progress',`${progress.percent}%`);ring.querySelector('b').textContent=`%${progress.percent}`}button.setAttribute('aria-label',progress.total?`Tahmin Durumu: ${progress.total} turun ${progress.complete} tanesi tamamlandı, yüzde ${progress.percent}`:'Tahmin Durumu');const layer=doc.getElementById('bsSimpleFeatureLayer');if(layer?.classList.contains('is-open')&&layer.dataset.feature==='predictionStatus')renderPredictionStatus(doc);return progress}
  function placeThemeNextToName(doc){const host=doc.getElementById('conn'),user=doc.querySelector('.bs-header-user'),account=doc.querySelector('.bs-header-account');if(!host||!user||!account)return false;host.classList.add('bs-theme-header-host');if(host.parentElement!==account)account.insertBefore(host,user);return true}
  function decorateHeader(doc){const push=doc.getElementById('bsHeaderPush');if(push){const enabled=(root?.localStorage?.getItem('bizimSkorPushEnabledV1')==='1');push.dataset.simpleIcon=enabled?'🔕':'🔔';push.setAttribute('aria-label',enabled?'Bildirimleri kapat':'Bildirimleri aç');push.title=push.getAttribute('aria-label')}placeThemeNextToName(doc)}
  function renderDrawer(doc){const old=doc.getElementById('bsSimpleNavDrawer'),wasOpen=old?.classList.contains('is-open');old?.remove();doc.body.insertAdjacentHTML('beforeend',drawerMarkup(groupedItems(availableTabs(doc)),accountState()));const drawer=doc.getElementById('bsSimpleNavDrawer');if(wasOpen){drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false')}bindDrawer(doc,drawer);syncUnread(doc);return drawer}
  function closeDrawer(doc){const drawer=doc.getElementById('bsSimpleNavDrawer');if(!drawer?.classList.contains('is-open'))return;drawer.classList.remove('is-open');drawer.setAttribute('aria-hidden','true');doc.body.classList.remove('bs-simple-menu-open');doc.querySelector('[data-simple-nav="menu"]')?.setAttribute('aria-expanded','false');const opener=doc.querySelector(`[data-simple-nav="${drawer.dataset.opener||'menu'}"]`);setTimeout(()=>opener?.focus?.(),220)}
  function openDrawer(doc,mode='menu'){
    const drawer=renderDrawer(doc);drawer.dataset.opener=mode;drawer.classList.add('is-open');drawer.setAttribute('aria-hidden','false');doc.body.classList.add('bs-simple-menu-open');doc.querySelector(`[data-simple-nav="${mode}"]`)?.setAttribute('aria-expanded','true');
    setTimeout(()=>drawer.querySelector('.bs-simple-panel')?.focus?.(),0)
  }
  function ensureFeatureLayer(doc){if(!doc.getElementById('bsSimpleFeatureLayer')){doc.body.insertAdjacentHTML('beforeend',featureMarkup());doc.querySelectorAll('[data-simple-feature-close]').forEach(button=>button.addEventListener('click',()=>closeFeature(doc)))}return doc.getElementById('bsSimpleFeatureLayer')}
  function closeFeature(doc){const layer=doc.getElementById('bsSimpleFeatureLayer');if(!layer?.classList.contains('is-open'))return;layer.classList.remove('is-open');layer.setAttribute('aria-hidden','true');setBottomActive(doc,bottomTargetForTab(currentOriginalTab(doc)));setTimeout(()=>doc.querySelector(`[data-simple-nav="${layer.dataset.opener||'menu'}"]`)?.focus?.(),220)}
  function renderPredictionStatus(doc){const source=doc.getElementById('bsPredictionWeekCards'),mount=doc.getElementById('bsSimplePredictionStatus'),progress=predictionProgress(cardCompletion(doc));if(!mount)return;const detail=progress.total?`${progress.total} aktif turun ${progress.complete} tanesini tamamladın.`:'Aktif tahmin turları yükleniyor…';mount.innerHTML=`<div class="bs-simple-feature-summary"><span class="bs-simple-progress" style="--bs-progress:${progress.percent}%" aria-hidden="true"><b>%${progress.percent}</b></span><div><strong>Tahmin tamamlama oranın</strong><span>${detail}</span></div></div>${source?.innerHTML||'<p class="bs-simple-feature-empty">Tahmin kartları hazırlanıyor…</p>'}`;mount.querySelectorAll('[data-bs-card]').forEach(button=>button.addEventListener('click',()=>{source?.querySelector(`[data-bs-card="${button.dataset.bsCard}"]`)?.click();closeFeature(doc)}))}
  function moveInviteShell(doc){const shell=doc.getElementById('bsInviteGrowthShell'),mount=doc.getElementById('bsSimpleInviteChampion');if(shell&&mount&&!mount.contains(shell))mount.appendChild(shell);return!!shell}
  function openFeature(doc,type){const layer=ensureFeatureLayer(doc),status=doc.getElementById('bsSimplePredictionStatus'),invite=doc.getElementById('bsSimpleInviteChampion'),title=doc.getElementById('bsSimpleFeatureTitle');layer.dataset.feature=type;layer.dataset.opener=type==='predictionStatus'?'predictionStatus':'menu';status.hidden=type!=='predictionStatus';invite.hidden=type!=='inviteChampion';if(type==='predictionStatus'){title.textContent='Tahmin Durumu';renderPredictionStatus(doc);setBottomActive(doc,'predictionStatus')}else{title.textContent='Ayın Davet Şampiyonu';if(!moveInviteShell(doc))invite.innerHTML='<p class="bs-simple-feature-empty">Davet bilgileri yükleniyor…</p>';setTimeout(()=>moveInviteShell(doc),600)}layer.classList.add('is-open');layer.setAttribute('aria-hidden','false');setTimeout(()=>layer.querySelector('.bs-simple-feature-panel')?.focus?.(),0)}
  function openWeeklyResult(doc){const click=()=>doc.getElementById('bsWeeklyResultTrigger')?.click();if(click())return;const mount=root?.BizimSkorWeeklyResultCardBootstrap?.mount;if(typeof mount==='function'){Promise.resolve(mount(doc,root)).then(()=>click()).catch(()=>{})}}
  function triggerAccount(doc,action){if(action==='inviteChampion'){openFeature(doc,'inviteChampion');return}if(action==='shareGame'){doc.getElementById('bsShareGame')?.click();return}if(action==='weeklyResult'){openWeeklyResult(doc);return}const map={update:'bsHeaderUpdate',museum:'bsHeaderMuseumAction',logout:'bsHeaderAccountAction',login:'bsHeaderAccountAction',support:'bsHeaderSupport'};doc.getElementById(map[action])?.click()}
  function bindDrawer(doc,drawer){
    drawer.querySelectorAll('[data-simple-close]').forEach(button=>button.addEventListener('click',()=>closeDrawer(doc)));
    drawer.querySelectorAll('[data-simple-tab]').forEach(button=>button.addEventListener('click',()=>{const tab=button.dataset.simpleTab;findOriginalTab(doc,tab)?.click();setBottomActive(doc,bottomTargetForTab(tab));closeDrawer(doc)}));
    drawer.querySelectorAll('[data-simple-account]').forEach(button=>button.addEventListener('click',()=>{triggerAccount(doc,button.dataset.simpleAccount);closeDrawer(doc)}));
  }
  function syncUnread(doc){const unread=!!doc.querySelector('.tab[data-tab="chat"].has-unread');doc.body.classList.toggle('bs-simple-nav-has-unread',unread)}
  function handleKeydown(doc,event){
    const drawer=doc.getElementById('bsSimpleNavDrawer');if(!drawer?.classList.contains('is-open'))return;
    if(event.key==='Escape'){event.preventDefault();closeDrawer(doc);return}
    if(event.key!=='Tab')return;const focusable=[...drawer.querySelectorAll('button:not([disabled]),[tabindex="0"]')].filter(node=>node.offsetParent!==null);if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&doc.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&doc.activeElement===last){event.preventDefault();first.focus()}
  }
  function handleFeatureKeydown(doc,event){const layer=doc.getElementById('bsSimpleFeatureLayer');if(layer?.classList.contains('is-open')&&event.key==='Escape'){event.preventDefault();closeFeature(doc)}}
  function bindBottom(doc){doc.querySelectorAll('[data-simple-nav]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.simpleNav;if(key==='home'||key==='pred'){findOriginalTab(doc,key)?.click();setBottomActive(doc,key);closeDrawer(doc);closeFeature(doc);return}if(key==='predictionStatus'){openFeature(doc,key);return}openDrawer(doc,'menu')}))}
  function mount(doc=typeof document!=='undefined'?document:null){
    if(!doc||doc.getElementById('bsSimpleBottomNav'))return false;
    if(!doc.getElementById('bsSimpleNavigationStyles'))doc.head.insertAdjacentHTML('beforeend',styleMarkup());
    doc.body.classList.add('bs-simple-nav-ready');doc.body.insertAdjacentHTML('beforeend',bottomMarkup(bottomTargetForTab(currentOriginalTab(doc))));renderDrawer(doc);ensureFeatureLayer(doc);bindBottom(doc);decorateHeader(doc);syncUnread(doc);syncPredictionStatus(doc);
    doc.addEventListener('keydown',event=>{handleKeydown(doc,event);handleFeatureKeydown(doc,event)});
    if(typeof MutationObserver!=='undefined'){
      const tabs=doc.querySelector('.tabs');if(tabs)new MutationObserver(()=>{setBottomActive(doc,bottomTargetForTab(currentOriginalTab(doc)));syncUnread(doc);syncPredictionStatus(doc)}).observe(tabs,{subtree:true,childList:true,attributes:true,attributeFilter:['class','data-tab']});
      const header=doc.querySelector('.h');if(header)new MutationObserver(()=>decorateHeader(doc)).observe(header,{subtree:true,childList:true});
    }
    setTimeout(()=>{syncPredictionStatus(doc);moveInviteShell(doc);decorateHeader(doc)},1000);setTimeout(()=>{syncPredictionStatus(doc);moveInviteShell(doc);decorateHeader(doc)},2400);root?.addEventListener?.('bizimskor:session-ready',()=>setTimeout(()=>{renderDrawer(doc);moveInviteShell(doc);syncPredictionStatus(doc);decorateHeader(doc)},500));return true;
  }
  return Object.freeze({canonicalTab,preferredTabNames,bottomTargetForTab,predictionProgress,groupedItems,bottomMarkup,drawerMarkup,featureMarkup,styleMarkup,availableTabs,findOriginalTab,currentOriginalTab,mount,openDrawer,closeDrawer,openFeature,closeFeature,placeThemeNextToName});
});
