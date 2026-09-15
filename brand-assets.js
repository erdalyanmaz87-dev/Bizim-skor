(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorBrandAssets=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key=v=>String(v??'').trim().toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const TEAM_ALIASES={
    'galatasaray':'galatasaray','galatasaray a s':'galatasaray','galatasaray sk':'galatasaray',
    'fenerbahce':'fenerbahce','fenerbahce sk':'fenerbahce',
    'besiktas':'besiktas','besiktas jk':'besiktas',
    'trabzonspor':'trabzonspor','trabzonspor a s':'trabzonspor',
    'istanbul basaksehir':'basaksehir','basaksehir':'basaksehir','rams basaksehir':'basaksehir','rams basaksehir futbol kulubu':'basaksehir',
    'kasimpasa':'kasimpasa','kasimpasa a s':'kasimpasa',
    'alanyaspor':'alanyaspor','corendon alanyaspor':'alanyaspor',
    'caykur rizespor':'rizespor','rizespor':'rizespor',
    'gaziantep':'gaziantep','gaziantep fk':'gaziantep','gaziantep futbol kulubu':'gaziantep',
    'konyaspor':'konyaspor','tumosan konyaspor':'konyaspor','tumosam konyaspor':'konyaspor','tumos an konyaspor':'konyaspor','tumos an':'konyaspor','tumosankonyaspor':'konyaspor',
    'samsunspor':'samsunspor','reeder samsunspor':'samsunspor',
    'eyupspor':'eyupspor','ikas eyupspor':'eyupspor',
    'goztepe':'goztepe-izmir','goztepe izmir':'goztepe-izmir','goztepe a s':'goztepe-izmir',
    'genclerbirligi':'genclerbirligi','genclerbirligi sk':'genclerbirligi',
    'amed sfk':'amed-sk','amed sk':'amed-sk','amed sportif faaliyetler':'amed-sk','amed sportif faaliyetler kulubu':'amed-sk',
    'corum fk':'corum-fk','arca corum fk':'corum-fk','corum':'corum-fk',
    'kocaelispor':'kocaelispor','erzurumspor':'erzurumspor','erzurumspor fk':'erzurumspor',
    'paris saint germain':'paris-saint-germain','paris saint germain psg':'paris-saint-germain','psg':'paris-saint-germain',
    'bayern munich':'bayern-munchen','bayern munchen':'bayern-munchen','fc bayern munchen':'bayern-munchen',
    'real madrid':'real-madrid','real madrid cf':'real-madrid','liverpool':'liverpool','liverpool fc':'liverpool',
    'inter':'inter','inter milan':'inter','fc internazionale':'inter','manchester city':'manchester-city','manchester city fc':'manchester-city',
    'arsenal':'arsenal','arsenal fc':'arsenal','barcelona':'barcelona','fc barcelona':'barcelona','atletico madrid':'atletico-madrid','atletico de madrid':'atletico-madrid',
    'borussia dortmund':'borussia-dortmund','bvb':'borussia-dortmund','roma':'roma','as roma':'roma','sporting cp':'sporting-cp','sporting lisbon':'sporting-cp',
    'aston villa':'aston-villa','aston villa fc':'aston-villa','porto':'fc-porto','fc porto':'fc-porto','manchester united':'manchester-united','manchester united fc':'manchester-united',
    'club brugge':'club-brugge','club brugge kv':'club-brugge','real betis':'real-betis','real betis balompie':'real-betis',
    'psv':'psv','psv eindhoven':'psv','feyenoord':'feyenoord','lille':'lille','lille osc':'lille','bodo glimt':'bodo-glimt','bod glimt':'bodo-glimt','fk bodo glimt':'bodo-glimt','fk bod glimt':'bodo-glimt',
    'napoli':'napoli','ssc napoli':'napoli','rb leipzig':'rb-leipzig','rasenballsport leipzig':'rb-leipzig','villarreal':'villarreal','villarreal cf':'villarreal',
    'shakhtar':'shakhtar-donetsk','shakhtar donetsk':'shakhtar-donetsk','fc shakhtar donetsk':'shakhtar-donetsk','slavia praha':'slavia-praha','slavia prague':'slavia-praha',
    'slovan bratislava':'slovan-bratislava','sk slovan bratislava':'slovan-bratislava','vfb stuttgart':'vfb-stuttgart','aek athens':'aek-athens','aek':'aek-athens',
    'lask':'lask','lask linz':'lask','como 1907':'como-1907','como':'como-1907','rc lens':'rc-lens','lens':'rc-lens','viking fk':'viking-fk','viking':'viking-fk','sabah':'sabah','sabah fk':'sabah'
  };
  const TEAM_META={
    'galatasaray':['turkey','galatasaray','https://assets.football-logos.cc/logos/turkey/1500x1500/galatasaray.a30b6ee6.png'],
    'fenerbahce':['turkey','fenerbahce','https://assets.football-logos.cc/logos/turkey/1500x1500/fenerbahce.865697ea.png'],
    'besiktas':['turkey','besiktas','https://assets.football-logos.cc/logos/turkey/1500x1500/besiktas.e05ee6ce.png'],
    'trabzonspor':['turkey','trabzonspor','https://assets.football-logos.cc/logos/turkey/1500x1500/trabzonspor.dea11b78.png'],
    'basaksehir':['turkey','basaksehir','https://assets.football-logos.cc/logos/turkey/1500x1500/basaksehir.18e3925c.png'],
    'kasimpasa':['turkey','kasimpasa','https://assets.football-logos.cc/logos/turkey/1500x1500/kasimpasa.0688b67b.png'],
    'alanyaspor':['turkey','alanyaspor','https://assets.football-logos.cc/logos/turkey/1500x1500/alanyaspor.273f4ad1.png'],
    'rizespor':['turkey','rizespor','https://assets.football-logos.cc/logos/turkey/1500x1500/rizespor.bb8c7526.png'],
    'gaziantep':['turkey','gaziantep','https://assets.football-logos.cc/logos/turkey/1500x1500/gaziantep.cf6c7b60.png'],
    'konyaspor':['turkey','konyaspor','https://assets.football-logos.cc/logos/turkey/1500x1500/konyaspor.2af53489.png'],
    'samsunspor':['turkey','samsunspor','https://assets.football-logos.cc/logos/turkey/1500x1500/samsunspor.da2506aa.png'],
    'eyupspor':['turkey','eyupspor','https://assets.football-logos.cc/logos/turkey/1500x1500/eyupspor.0dcd211d.png'],
    'goztepe-izmir':['turkey','goztepe-izmir','https://assets.football-logos.cc/logos/turkey/1500x1500/goztepe-izmir.f22c729a.png'],
    'genclerbirligi':['turkey','genclerbirligi','https://assets.football-logos.cc/logos/turkey/1500x1500/genclerbirligi.e4cf70a6.png'],
    'amed-sk':['turkey','amed','https://assets.football-logos.cc/logos/turkey/1500x1500/amed.f1f25a66.png'],
    'corum-fk':['turkey','corum','https://assets.football-logos.cc/logos/turkey/1500x1500/corum.6565bf1b.png'],
    'kocaelispor':['turkey','kocaelispor'], 'erzurumspor':['turkey','erzurumspor'],
    'paris-saint-germain':['france','paris-saint-germain','https://assets.football-logos.cc/logos/france/1500x1500/paris-saint-germain.976d063a.png'],
    'bayern-munchen':['germany','bayern-munchen','https://assets.football-logos.cc/logos/germany/1500x1500/bayern-munchen.1eac18e8.png'],
    'real-madrid':['spain','real-madrid','https://assets.football-logos.cc/logos/spain/1500x1500/real-madrid.e34f5ba5.png'],
    'liverpool':['england','liverpool','https://assets.football-logos.cc/logos/england/1500x1500/liverpool.d03fd250.png'],
    'inter':['italy','inter','https://assets.football-logos.cc/logos/italy/1500x1500/inter.d4ebfb95.png'],
    'manchester-city':['england','manchester-city','https://assets.football-logos.cc/logos/england/1500x1500/manchester-city.8d2b6688.png'],
    'arsenal':['england','arsenal','https://assets.football-logos.cc/logos/england/1500x1500/arsenal.d4144b2a.png'],
    'barcelona':['spain','barcelona','https://assets.football-logos.cc/logos/spain/1500x1500/barcelona.8e8b43a3.png'],
    'atletico-madrid':['spain','atletico-madrid','https://assets.football-logos.cc/logos/spain/1500x1500/atletico-madrid.1acb70ea.png'],
    'borussia-dortmund':['germany','borussia-dortmund','https://assets.football-logos.cc/logos/germany/1500x1500/borussia-dortmund.145250de.png'],
    'roma':['italy','roma','https://assets.football-logos.cc/logos/italy/1500x1500/roma.90753835.png'],
    'sporting-cp':['portugal','sporting-cp','https://assets.football-logos.cc/logos/portugal/1500x1500/sporting-cp.ac57eada.png'],
    'aston-villa':['england','aston-villa','https://assets.football-logos.cc/logos/england/1500x1500/aston-villa.5265a6b0.png'],
    'fc-porto':['portugal','fc-porto','https://assets.football-logos.cc/logos/portugal/1500x1500/fc-porto.bef0a887.png'],
    'manchester-united':['england','manchester-united','https://assets.football-logos.cc/logos/england/1500x1500/manchester-united.104c5aa9.png'],
    'club-brugge':['belgium','club-brugge'], 'real-betis':['spain','real-betis','https://assets.football-logos.cc/logos/spain/1500x1500/real-betis.18a05d13.png'],
    'psv':['netherlands','psv','https://assets.football-logos.cc/logos/netherlands/1500x1500/psv.235a2590.png'],
    'feyenoord':['netherlands','feyenoord','https://assets.football-logos.cc/logos/netherlands/1500x1500/feyenoord.6ee42168.png'],
    'lille':['france','lille','https://assets.football-logos.cc/logos/france/1500x1500/lille.682b7a4f.png'],
    'bodo-glimt':['norway','bodo-glimt'], 'napoli':['italy','napoli','https://assets.football-logos.cc/logos/italy/1500x1500/napoli.3e57a185.png'],
    'rb-leipzig':['germany','rb-leipzig','https://assets.football-logos.cc/logos/germany/1500x1500/rb-leipzig.ea056608.png'],
    'villarreal':['spain','villarreal','https://assets.football-logos.cc/logos/spain/1500x1500/villarreal.6ced8346.png'],
    'shakhtar-donetsk':['ukraine','shakhtar-donetsk'], 'slavia-praha':['czech-republic','slavia-praha'], 'slovan-bratislava':['slovakia','slovan-bratislava'],
    'vfb-stuttgart':['germany','vfb-stuttgart','https://assets.football-logos.cc/logos/germany/1500x1500/vfb-stuttgart.f5cd8411.png'],
    'aek-athens':['greece','aek-athens'], 'lask':['austria','lask'], 'como-1907':['italy','como-1907'],
    'rc-lens':['france','rc-lens','https://assets.football-logos.cc/logos/france/1500x1500/rc-lens.05ddeba2.png'],
    'viking-fk':['norway','viking-fk'], 'sabah':['azerbaijan','sabah']
  };
  const COUNTRY_ALIASES={
    'turkiye':'turkey','turkey':'turkey','fransa':'france','france':'france','italya':'italy','italy':'italy','belcika':'belgium','belgium':'belgium',
    'ingiltere':'england','england':'england','ispanya':'spain','spain':'spain','almanya':'germany','germany':'germany','portekiz':'portugal','portugal':'portugal',
    'hollanda':'netherlands','netherlands':'netherlands','norvec':'norway','norway':'norway','ukrayna':'ukraine','ukraine':'ukraine','cekya':'czech-republic','czech republic':'czech-republic',
    'slovakya':'slovakia','slovakia':'slovakia','yunanistan':'greece','greece':'greece','avusturya':'austria','austria':'austria','azerbaycan':'azerbaijan','azerbaijan':'azerbaijan'
  };
  const COMPETITIONS={
    champions:{file:'uefa-champions-league-logo-footylogos.svg',src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/UEFA_Champions_League_Logo_Wordmark.svg'},
    super:{file:'super-lig-turkey-logo-footylogos.svg',src:'https://football-logos.cc/logos/turkey/256x256/super-lig.png'},
    nations:{file:'uefa-nations-league-logo-footylogos.svg',src:'https://commons.wikimedia.org/wiki/Special:Redirect/file/UEFA_Nations_League_logo.svg'}
  };
  function teamSlug(name){return TEAM_ALIASES[key(name)]||null}
  function teamLogoUrl(name){const slug=teamSlug(name);if(!slug)return null;const meta=TEAM_META[slug];if(!meta)return null;return meta[2]||`https://football-logos.cc/logos/${meta[0]}/256x256/${meta[1]}.png`}
  function nationalTeamLogoUrl(name){const k=key(name),country=COUNTRY_ALIASES[k]||k.replace(/ /g,'-');return country?`https://football-logos.cc/logos/${country}/256x256/${country}-national-team.png`:null}
  function fallbackMarkup(name,cls='bs-team-fallback'){const label=String(name||'?').trim();const initials=label.split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?';return `<span class="${cls}" aria-hidden="true">${esc(initials)}</span>`}
  function nationalTeamMarkup(name){const url=nationalTeamLogoUrl(name);if(!url)return `<span class="bs-team-brand">${fallbackMarkup(name)}<span class="bs-team-name">${esc(name)}</span></span>`;return `<span class="bs-team-brand"><img class="bs-team-logo" src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="bs-team-fallback" hidden aria-hidden="true">${esc(String(name||'?').trim().slice(0,2).toUpperCase())}</span><span class="bs-team-name">${esc(name)}</span></span>`}
  function teamMarkup(name,options={}){const slug=teamSlug(name),url=teamLogoUrl(name);if(!slug||!url)return `<span class="bs-team-brand">${fallbackMarkup(name)}<span class="bs-team-name">${esc(name)}</span></span>`;const file=`${slug}-logo-footylogos.svg`;return `<span class="bs-team-brand" data-team-slug="${esc(slug)}"><img class="bs-team-logo" src="${esc(url)}" data-logo-file="${file}" alt="" loading="lazy" referrerpolicy="no-referrer"><span class="bs-team-fallback" hidden aria-hidden="true">${esc(String(name||'?').trim().slice(0,2).toUpperCase())}</span><span class="bs-team-name">${esc(name)}</span></span>`}
  function competitionLogoMarkup(kind,label=''){const cfg=COMPETITIONS[kind];if(!cfg)return fallbackMarkup(label,'bs-competition-fallback');return `<span class="bs-competition-brand"><img class="bs-competition-logo" src="${esc(cfg.src)}" data-logo-file="${cfg.file}" alt="${esc(label)}" loading="lazy" referrerpolicy="no-referrer"><span>${esc(label)}</span></span>`}
  return Object.freeze({key,teamSlug,teamLogoUrl,nationalTeamLogoUrl,nationalTeamMarkup,teamMarkup,competitionLogoMarkup,fallbackMarkup,TEAM_META,COMPETITIONS});
});
