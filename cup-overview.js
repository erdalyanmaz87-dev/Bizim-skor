(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else root.BizimSkorCupOverview=api})(typeof globalThis!=='undefined'?globalThis:this,function(root){
const WIDTH=2800,HEIGHT=2220,labels=['Son 64','Son 32','Son 16','Çeyrek final','Yarı final','Final'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=v=>v==null?'—':Number(v).toLocaleString('tr-TR',{maximumFractionDigits:2});
let zoomValue=null,scrollLeft=0,scrollTop=0,resizeObserver=null;
function scale(width,value){const fit=Math.min(1.2,Math.max(1,Number(width)||1)/WIDTH);return value==null?fit:Math.max(fit,Math.min(1.2,Number(value)||fit))}
function node(s,round,position,x,y,width,side,bronze=false){
 const m=(s.matches||[]).find(m=>Number(m.round)===round&&Number(m.position)===position&&!!m.bronze===bronze)||{};
 const fallback=key=>bronze?`Yarı final ${key==='name_a'?1:2} mağlubu`:round===1?'Kura bekleniyor':`${labels[round-2]} · ${position*2-(key==='name_a'?1:0)} galibi`;
 const player=(key,pointKey,other)=>{const name=m[key]||fallback(key),points=m[pointKey],leading=points!=null&&m[other]!=null&&Number(points)>Number(m[other]),winner=m.winner&&m.winner===m[key];return `<div class="bsc-overview-player${leading?' is-leading':''}${winner?' is-winner':''}"><span>${esc(name)}</span><b>${number(points)}</b></div>`};
 return `<button type="button" class="bsc-overview-match${round>1?' is-future':''}${bronze?' is-bronze':''}" data-overview-match="${round}:${position}${bronze?':bronze':''}" data-overview-side="${side}" data-overview-round="${round}" data-overview-position="${position}" style="left:${x}px;top:${y-40}px;width:${width}px" aria-label="${esc(bronze?'Üçüncülük maçı':labels[round-1]+' '+position+'. eşleşme')}"><small>${bronze?'ÜÇÜNCÜLÜK':labels[round-1]+' · '+position}${m.tie_reason==='BAY'?' · BAY ile üst turda':''}</small>${player('name_a','points_a','points_b')}${player('name_b','points_b','points_a')}</button>`;
}
function render(s){
 const cols=[[22,380],[428,230],[684,175],[885,145],[1056,135]],pos=new Map();let nodes='',paths='',heads='';
 for(let side=0;side<2;side++)for(let stage=0;stage<5;stage++){
  const count=16/2**stage,[left,width]=cols[stage],x=side?WIDTH-left-width:left;
  heads+=`<span class="bsc-overview-heading" style="left:${x}px;width:${width}px">${labels[stage]}</span>`;
  for(let i=0;i<count;i++){const y=290+((2**stage-1)/2+i*2**stage)*103,position=i+1+(side?count:0);pos.set(`${side}:${stage}:${i}`,{x,width,y});nodes+=node(s,stage+1,position,x,y,width,side?'right':'left')}
 }
 for(let side=0;side<2;side++)for(let stage=0;stage<4;stage++)for(let i=0;i<16/2**(stage+1);i++){
  const a=pos.get(`${side}:${stage}:${i*2}`),b=pos.get(`${side}:${stage}:${i*2+1}`),p=pos.get(`${side}:${stage+1}:${i}`),start=side?a.x:a.x+a.width,end=side?p.x+p.width:p.x,joint=(start+end)/2;
  paths+=`<path d="M${start},${a.y}H${joint}V${b.y}H${start} M${joint},${p.y}H${end}"/>`;
 }
 const y=290+7.5*103;
 paths+=`<path class="final-link" d="M1191,${y}H1280 M1520,${y}H1609"/>`;
 nodes+=node(s,6,1,1280,y,240,'center')+node(s,6,1,1280,1420,240,'center',true);
 return `<div class="bsc-overview" data-cup-overview><div class="bsc-overview-tools"><button type="button" data-cup-zoom="out" aria-label="Uzaklaştır">−</button><button type="button" data-cup-zoom="in" aria-label="Yakınlaştır">+</button><button type="button" data-cup-zoom="fit">Sığdır</button><button type="button" data-cup-zoom="read">Okunur boyut</button><span data-cup-zoom-label></span></div><p class="bsc-overview-help">Yakınlaştırıp kaydırabilirsin. Bir eşleşmeye dokunarak turu aç.</p><div class="bsc-overview-viewport" data-cup-overview-viewport tabindex="0" aria-label="Tüm kupa ağacı; yakınlaştırma düğmeleriyle büyütüp kaydırabilirsiniz"><div class="bsc-overview-space" data-cup-overview-space><div class="bsc-overview-board" data-cup-overview-board><header><strong>BİZİMSKOR KUPASI</strong><span>${Number(s.count)||0} oyuncu · ${Math.max(0,64-(Number(s.count)||0))} BAY · ${s.start_week}–${s.start_week+5}. haftalar</span></header><svg class="bsc-overview-lines" viewBox="0 0 ${WIDTH} ${HEIGHT}" aria-hidden="true">${paths}</svg>${heads}${nodes}<div class="bsc-overview-trophy" aria-hidden="true">🏆</div><h3 class="bsc-overview-final-title">FİNAL</h3><p class="bsc-overview-final-week">${s.start_week+5}. HAFTA</p><footer><b>Yeşil: şu an önde · BAY: doğrudan üst turda</b><p>Haftalık Süper Lig sıran 100 üzerinden kupa puanına dönüşür.<br>Hafta sonunda rakibinden yüksek puanın varsa tur atlarsın.<br>Yeni turda puanlar sıfırlanır.</p><small>${s.start_week}. hafta → Son 32 · ${s.start_week+1}. hafta → Son 16</small></footer></div></div></div></div>`;
}
function apply(host,value){const viewport=host?.querySelector?.('[data-cup-overview-viewport]'),board=host?.querySelector?.('[data-cup-overview-board]'),space=host?.querySelector?.('[data-cup-overview-space]');if(!viewport||!board||!space)return;const actual=scale(viewport.clientWidth,value);board.style.transform=`scale(${actual})`;space.style.width=`${WIDTH*actual}px`;space.style.height=`${HEIGHT*actual}px`;viewport.dataset.scale=String(actual);const label=host.querySelector('[data-cup-zoom-label]');if(label)label.textContent=`%${Math.round(actual*100)}`;viewport.scrollLeft=scrollLeft;viewport.scrollTop=scrollTop;}
function bind(host){const viewport=host?.querySelector?.('[data-cup-overview-viewport]');if(!viewport)return;apply(host,zoomValue);viewport.addEventListener('scroll',()=>{scrollLeft=viewport.scrollLeft;scrollTop=viewport.scrollTop},{passive:true});resizeObserver?.disconnect();if(root.ResizeObserver){resizeObserver=new root.ResizeObserver(()=>apply(host,zoomValue));resizeObserver.observe(viewport)}}
function zoom(host,action){const viewport=host?.querySelector?.('[data-cup-overview-viewport]');if(!viewport)return;const old=Number(viewport.dataset.scale)||scale(viewport.clientWidth,null);zoomValue=action==='fit'?null:action==='read'?.75:action==='in'?old*1.5:old/1.5;const next=scale(viewport.clientWidth,zoomValue),ratio=next/old;scrollLeft=action==='fit'?0:(viewport.scrollLeft+viewport.clientWidth/2)*ratio-viewport.clientWidth/2;scrollTop=action==='fit'?0:(viewport.scrollTop+viewport.clientHeight/2)*ratio-viewport.clientHeight/2;apply(host,zoomValue)}
return Object.freeze({render,scale,bind,zoom});
});
