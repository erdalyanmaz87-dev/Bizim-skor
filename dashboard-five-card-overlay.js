(function(){
  if(typeof document==='undefined')return;
  const id='bsDashboardFiveCardOverlay';
  const cardSelector='#bsHomeDashboard .bs-home-stat:not(.admin-statistics)';

  function ensureStyle(){
    let s=document.getElementById(id);
    if(!s){s=document.createElement('style');s.id=id;document.head.appendChild(s)}
    s.textContent=`
#bsHomeDashboard .bs-home-stats{
  display:flex!important;
  grid-template-columns:none!important;
  gap:10px!important;
  overflow-x:auto!important;
  overflow-y:hidden!important;
  padding:2px 18% 8px 0!important;
  scroll-snap-type:x mandatory;
  scroll-behavior:smooth;
  -webkit-overflow-scrolling:touch;
  scrollbar-width:none;
}
#bsHomeDashboard .bs-home-stats::-webkit-scrollbar{display:none}
#bsHomeDashboard .bs-home-stat{
  display:flex!important;
  flex:0 0 min(78vw,250px)!important;
  width:auto!important;
  min-width:0!important;
  scroll-snap-align:start;
  scroll-snap-stop:always;
}
#bsHomeDashboard .bs-home-stat.champions{order:1}
#bsHomeDashboard .bs-home-stat.general{order:2}
#bsHomeDashboard .bs-home-stat.nations{order:3}
#bsHomeDashboard .bs-home-stat.league{order:4}
#bsHomeDashboard .bs-home-stat.rate{order:5}
#bsHomeDashboard .bs-home-stat.admin-statistics{display:none!important}
#bsHomeDashboard .bs-home-stat.general,#bsHomeDashboard .bs-home-stat.nations{display:flex!important}
#bsHomeDashboard .bs-home-stat.general>.bs-competition-brand .bs-competition-logo,
#bsHomeDashboard .bs-home-stat.nations>.bs-competition-brand .bs-competition-logo{
  opacity:1!important;
  filter:brightness(1.35) contrast(1.08) drop-shadow(0 0 8px rgba(255,255,255,.15))!important
}
#bsHomeDashboard .bs-dashboard-carousel-nav{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-top:5px;
  padding:0 4px;
  color:#b9d7ff;
  font:800 11px/1.2 system-ui,-apple-system,sans-serif;
}
#bsHomeDashboard .bs-dashboard-carousel-hint{
  display:inline-flex;
  align-items:center;
  gap:5px;
  white-space:nowrap;
  opacity:.9;
}
#bsHomeDashboard .bs-dashboard-carousel-dots{display:flex;align-items:center;gap:6px}
#bsHomeDashboard .bs-dashboard-carousel-dot{
  width:6px;
  height:6px;
  padding:0;
  border:0;
  border-radius:999px;
  background:rgba(157,199,255,.35);
  transition:width .18s ease,background .18s ease;
}
#bsHomeDashboard .bs-dashboard-carousel-dot.is-active{
  width:18px;
  background:#42d8ff;
}
@media(min-width:700px){
  #bsHomeDashboard .bs-home-stats{padding-right:28%!important}
  #bsHomeDashboard .bs-home-stat{flex-basis:260px!important}
}
`;
    if(s!==document.head.lastElementChild)document.head.appendChild(s);
  }

  function ensureNav(){
    const dashboard=document.getElementById('bsHomeDashboard');
    const track=dashboard?.querySelector('.bs-home-stats');
    if(!dashboard||!track)return;
    let nav=dashboard.querySelector('.bs-dashboard-carousel-nav');
    if(!nav){
      nav=document.createElement('div');
      nav.className='bs-dashboard-carousel-nav';
      const hint=document.createElement('div');
      hint.className='bs-dashboard-carousel-hint';
      hint.textContent='Kaydır →';
      const dots=document.createElement('div');
      dots.className='bs-dashboard-carousel-dots';
      nav.append(hint,dots);
      track.insertAdjacentElement('afterend',nav);
    }
    const cards=[...dashboard.querySelectorAll(cardSelector)];
    const dots=nav.querySelector('.bs-dashboard-carousel-dots');
    if(dots.childElementCount!==cards.length){
      dots.replaceChildren();
      cards.forEach((card,index)=>{
        const dot=document.createElement('button');
        dot.type='button';
        dot.className='bs-dashboard-carousel-dot'+(index===0?' is-active':'');
        dot.setAttribute('aria-label',`${index+1}. karta git`);
        dot.addEventListener('click',()=>card.scrollIntoView({behavior:'smooth',inline:'start',block:'nearest'}));
        dots.appendChild(dot);
      });
    }
    if(!track.dataset.bsCarouselBound){
      track.dataset.bsCarouselBound='1';
      let ticking=false;
      track.addEventListener('scroll',()=>{
        if(ticking)return;
        ticking=true;
        requestAnimationFrame(()=>{
          ticking=false;
          const current=[...dashboard.querySelectorAll(cardSelector)];
          if(!current.length)return;
          const left=track.scrollLeft;
          let active=0,best=Infinity;
          current.forEach((card,i)=>{const d=Math.abs(card.offsetLeft-track.offsetLeft-left);if(d<best){best=d;active=i}});
          [...dots.children].forEach((dot,i)=>dot.classList.toggle('is-active',i===active));
        });
      },{passive:true});
    }
  }

  function sync(){ensureStyle();ensureNav()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',sync,{once:true});else sync();
  window.addEventListener?.('load',sync,{once:true});
  window.addEventListener?.('focus',sync);
  setTimeout(sync,1200);
  setTimeout(sync,3200);
})();
