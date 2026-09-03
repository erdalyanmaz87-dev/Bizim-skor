(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else {root.BizimSkorFootballCenterBootstrap=api;api.start();}
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  const competitions=['super_lig','champions_league'];
  const categories=['standings','top_scorers','top_assists'];
  const state={competition:'super_lig',category:'standings',cache:new Map()};

  function tabMarkup(){return '<button class="tab" data-tab="footballCenter">📊 Futbol Merkezi</button>'}
  function sectionMarkup(){return '<section id="footballCenter" class="hide"><div id="footballCenterCard" class="c"><button id="footballCenterBack" type="button">← Ana Sayfa</button><h2><span>📊</span> Futbol Merkezi</h2><p class="small">Puan durumu ve oyuncu istatistiklerini tek ekranda takip et.</p><div class="football-center-pills"><button data-football-competition="super_lig" class="active">Süper Lig</button><button data-football-competition="champions_league">Şampiyonlar Ligi</button></div><div class="football-center-categories"><button data-football-category="standings" class="active">Puan Durumu</button><button data-football-category="top_scorers">Gol Krallığı</button><button data-football-category="top_assists">Asist Krallığı</button></div><div id="footballCenterContent"><p class="small">Veriler yükleniyor…</p></div></div></section>'}
  function themeClass(competition){return competition==='champions_league'?'football-center-champions':''}

  function ensureStyles(){
    if(!document.getElementById('footballCenterBaseStyles')){
      const style=document.createElement('style');style.id='footballCenterBaseStyles';style.textContent='.football-center-pills{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}.football-center-categories{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0}.football-center-pills button,.football-center-categories button{background:#e2e8f0;color:#334155}.football-center-pills button.active,.football-center-categories button.active{background:#0f172a;color:#fff}.football-center-table-wrap{overflow-x:auto}.football-center-table-wrap table{min-width:440px}.football-center-updated,.football-center-empty,.football-center-error{font-size:12px;color:#64748b}.football-center-error{padding:12px;border-radius:10px;background:#fee2e2;color:#991b1b}@media(max-width:430px){.football-center-categories{grid-template-columns:1fr}}';document.head.appendChild(style);
    }
    if(!document.querySelector('link[data-football-center-theme]')){const link=document.createElement('link');link.rel='stylesheet';link.href='football-center-theme.css';link.dataset.footballCenterTheme='1';document.head.appendChild(link)}
  }

  function loadUtils(){
    if(root.BizimSkorFootballCenter)return Promise.resolve();
    return new Promise((resolve,reject)=>{const existing=document.querySelector('script[data-football-center-utils]');if(existing){existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',reject,{once:true});return}const script=document.createElement('script');script.src='football-center-utils.js';script.dataset.footballCenterUtils='1';script.onload=resolve;script.onerror=reject;document.head.appendChild(script)});
  }

  function applyTheme(){const card=document.getElementById('footballCenterCard');if(!card)return;card.classList.toggle('football-center-champions',state.competition==='champions_league')}
  function render(){const content=document.getElementById('footballCenterContent'),rows=state.cache.get(state.competition)||[];if(!content||!root.BizimSkorFootballCenter)return;try{content.innerHTML=root.BizimSkorFootballCenter.renderFootballCenterMarkup(root.BizimSkorFootballCenter.buildViewModel(rows,state.competition,state.category))}catch{content.innerHTML=root.BizimSkorFootballCenter.renderFootballCenterMarkup({error:true})}}
  async function load(){const content=document.getElementById('footballCenterContent');if(state.cache.has(state.competition)){render();return}content.innerHTML='<p class="small">Veriler yükleniyor…</p>';const {data,error}=await sb.rpc('get_football_center_snapshot',{p_competition:state.competition});if(error){content.innerHTML='<p class="football-center-error">Veriler şu anda yüklenemedi. <button id="footballCenterRetry">Tekrar dene</button></p>';document.getElementById('footballCenterRetry').onclick=load;return}state.cache.set(state.competition,data||[]);render()}
  async function selectCompetition(value){if(!competitions.includes(value))return;state.competition=value;document.querySelectorAll('[data-football-competition]').forEach(button=>button.classList.toggle('active',button.dataset.footballCompetition===value));applyTheme();await load()}
  function selectCategory(value){if(!categories.includes(value))return;state.category=value;document.querySelectorAll('[data-football-category]').forEach(button=>button.classList.toggle('active',button.dataset.footballCategory===value));render()}
  async function open(){document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('section').forEach(x=>x.classList.add('hide'));document.querySelector('[data-tab="footballCenter"]')?.classList.add('active');document.getElementById('footballCenter')?.classList.remove('hide');applyTheme();await load()}

  async function mount(){
    if(document.getElementById('footballCenter'))return;
    ensureStyles();await loadUtils();
    const tabs=document.querySelector('.tabs'),chat=document.getElementById('chat');if(!tabs||!chat)return;
    const friend=tabs.querySelector('[data-tab="friendLeagues"]');if(friend)friend.insertAdjacentHTML('beforebegin',tabMarkup());else tabs.insertAdjacentHTML('beforeend',tabMarkup());
    chat.insertAdjacentHTML('beforebegin',sectionMarkup());
    document.querySelector('[data-tab="footballCenter"]').addEventListener('click',open);
    document.querySelectorAll('.tab:not([data-tab="footballCenter"])').forEach(button=>button.addEventListener('click',()=>document.getElementById('footballCenter')?.classList.add('hide')));
    document.querySelectorAll('[data-football-competition]').forEach(button=>button.addEventListener('click',()=>selectCompetition(button.dataset.footballCompetition)));
    document.querySelectorAll('[data-football-category]').forEach(button=>button.addEventListener('click',()=>selectCategory(button.dataset.footballCategory)));
    document.getElementById('footballCenterBack').addEventListener('click',()=>document.querySelector('[data-tab="home"]')?.click());
  }
  function start(){const run=()=>mount().catch(error=>console.warn('football center bootstrap',error));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run,{once:true});else run()}
  return{tabMarkup,sectionMarkup,themeClass,start,mount};
});
