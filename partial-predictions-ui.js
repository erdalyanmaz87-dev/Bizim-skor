(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;else{root.BizimSkorPartialPredictions=api;api.mount();}})(typeof globalThis!=='undefined'?globalThis:this,function(root){
const SEASON='2026/27';
const configs={
  super_lig:{button:'save',home:(f,i)=>`h${i}`,away:(f,i)=>`a${i}`},
  champions_league:{button:'championsSave',home:f=>`clh${f.id}`,away:f=>`cla${f.id}`},
  nations_league:{button:'nationsSave',home:f=>`nlh${f.id}`,away:f=>`nla${f.id}`}
};
function fixtureId(f){return Number(f?.id??f?.fixture_id)}
function normalizePartialScores(fixtures,scores){
  const source=new Map((scores||[]).map(row=>[Number(row.fixture_id),row]));
  const rows=[];
  for(const fixture of fixtures||[]){
    const id=fixtureId(fixture),row=source.get(id)||{},h=String(row.home_score??'').trim(),a=String(row.away_score??'').trim();
    if(h===''&&a==='')continue;
    if(h===''||a==='')throw new Error('Bir maça tahmin girdiysen iki skor kutusunu da doldur.');
    const home=Number(h),away=Number(a);
    if(!Number.isInteger(home)||!Number.isInteger(away)||home<0||home>20||away<0||away>20)throw new Error('Skorlar 0 ile 20 arasında tam sayı olmalıdır.');
    rows.push({fixture_id:id,home_score:home,away_score:away,robot_applied:!!row.robot_applied});
  }
  if(!rows.length)throw new Error('Kaydetmek için en az 1 maçın skorunu doldur.');
  return{rows,completed:rows.length,total:(fixtures||[]).length};
}
function confirmationMessage(completed,total){return completed<total?`${completed}/${total} maç için tahmin yaptınız. ${total-completed} maç boş kalacak. Yine de kaydetmek istiyor musunuz?`:''}
function contextFor(kind){
  if(kind==='super_lig'){const ctx=root.BizimSkorPredictionContext?.()||{};return{fixtures:ctx.fixtures||[],week:Number(ctx.week||root.selectedPredictionWeek||0)}}
  if(kind==='champions_league'){const api=root.BizimSkorChampionsUI;return{fixtures:api?.getFixtures?.()||[],week:Number(api?.currentWeek?.()||2)}}
  const api=root.BizimSkorNationsUI;return{fixtures:api?.getFixtures?.()||[],week:Number(api?.currentWeek?.()||1)}
}
function scoreRowsFromDom(kind,fixtures){const cfg=configs[kind];return(fixtures||[]).map((fixture,index)=>{const home=document.getElementById(cfg.home(fixture,index)),away=document.getElementById(cfg.away(fixture,index)),h=home?.value??'',a=away?.value??'';return{fixture_id:fixtureId(fixture),home_score:h,away_score:a,robot_applied:!!home&&!!away&&home.dataset.robotScore===String(h)&&away.dataset.robotScore===String(a)}})}
function countCompleteFromDom(kind,fixtures){let completed=0;for(const row of scoreRowsFromDom(kind,fixtures)){const h=String(row.home_score??'').trim(),a=String(row.away_score??'').trim();if(h!==''&&a!=='')completed++}return completed}
function progressId(kind){return`partialPredictionProgress-${kind}`}
function updateProgress(kind){
  if(typeof document==='undefined')return;
  const button=document.getElementById(configs[kind].button);if(!button||button.classList.contains('hide'))return;
  const {fixtures}=contextFor(kind);if(!fixtures.length)return;
  let el=document.getElementById(progressId(kind));
  if(!el){el=document.createElement('div');el.id=progressId(kind);el.className='partial-prediction-progress';button.insertAdjacentElement('beforebegin',el)}
  const completed=countCompleteFromDom(kind,fixtures);el.textContent=`${completed} / ${fixtures.length} maç tamamlandı`;
}
function updateAllProgress(){Object.keys(configs).forEach(updateProgress)}
function ensureStyle(){if(typeof document==='undefined'||document.getElementById('partialPredictionStyle'))return;const s=document.createElement('style');s.id='partialPredictionStyle';s.textContent='.partial-prediction-progress{margin:10px 0 4px;padding:9px 12px;border-radius:12px;background:rgba(255,255,255,.12);border:1px solid rgba(148,163,184,.35);text-align:center;font-size:13px;font-weight:800}.partial-confirm-backdrop{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:22px}.partial-confirm-box{width:min(420px,100%);background:#fff;color:#111827;border-radius:22px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.35)}.partial-confirm-box p{margin:0 0 18px;font-size:17px;line-height:1.45}.partial-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.partial-confirm-actions button{min-height:48px}.partial-confirm-actions .save-partial{background:#0f172a;color:#fff}.partial-confirm-actions .complete-first{background:#e5e7eb;color:#111827}';document.head.appendChild(s)}
function askPartialConfirmation(completed,total){const message=confirmationMessage(completed,total);if(!message)return Promise.resolve(true);if(typeof document==='undefined')return Promise.resolve(true);return new Promise(resolve=>{const old=document.getElementById('partialPredictionConfirm');old?.remove();const wrap=document.createElement('div');wrap.id='partialPredictionConfirm';wrap.className='partial-confirm-backdrop';wrap.innerHTML=`<div class="partial-confirm-box" role="dialog" aria-modal="true"><p>${message}</p><div class="partial-confirm-actions"><button type="button" class="complete-first">Eksikleri Tamamla</button><button type="button" class="save-partial">Kaydet</button></div></div>`;const done=value=>{wrap.remove();resolve(value)};wrap.querySelector('.complete-first').onclick=()=>done(false);wrap.querySelector('.save-partial').onclick=()=>done(true);wrap.addEventListener('click',event=>{if(event.target===wrap)done(false)});document.body.appendChild(wrap)})}
async function rpcSave(kind,week,rows){const token=root.localStorage?.getItem('bizimSkorFriendToken');if(!token)throw new Error('Tahmin yapmak için hesabınıza yeniden giriş yapın.');if(!root.sb?.rpc)throw new Error('Bağlantı hazır değil.');if(kind==='super_lig')return root.sb.rpc('save_super_league_week_predictions',{p_token:token,p_week:week,p_predictions:rows});if(kind==='champions_league')return root.sb.rpc('save_champions_league_predictions',{p_token:token,p_season:SEASON,p_week:week,p_predictions:rows});return root.sb.rpc('save_nations_league_predictions',{p_token:token,p_season:SEASON,p_week:week,p_predictions:rows})}
async function refreshAfterSave(kind,week){if(kind==='super_lig'){await root.renderPredictionArea?.(false,false);root.loadLive?.();root.BizimSkorPredictionWeekCards?.refresh?.();root.BizimSkorHomePriority?.refresh?.();return}if(kind==='champions_league'){await root.BizimSkorChampionsUI?.loadPrediction?.(false);root.BizimSkorPredictionWeekCards?.refresh?.();root.BizimSkorHomePriority?.refresh?.();return}await root.BizimSkorNationsUI?.loadPrediction?.(week,false);root.BizimSkorPredictionWeekCards?.refresh?.();root.BizimSkorHomePriority?.refresh?.()}
async function saveKind(kind,button){const ctx=contextFor(kind);if(!ctx.fixtures.length)throw new Error('Fikstür henüz hazır değil.');const checked=normalizePartialScores(ctx.fixtures,scoreRowsFromDom(kind,ctx.fixtures));if(!(await askPartialConfirmation(checked.completed,checked.total)))return false;button.disabled=true;try{const q=await rpcSave(kind,ctx.week,checked.rows);if(q?.error)throw q.error;root.alert?.(`${checked.completed}/${checked.total} maç tahminin kaydedildi ✅`);await refreshAfterSave(kind,ctx.week);return true}finally{button.disabled=false;setTimeout(updateAllProgress,80)}}
function kindForButton(button){return Object.keys(configs).find(kind=>configs[kind].button===button?.id)||null}
function mount(){if(typeof document==='undefined')return;ensureStyle();document.addEventListener('input',event=>{if(event.target?.matches?.('input[id^="h"],input[id^="a"],input[id^="clh"],input[id^="cla"],input[id^="nlh"],input[id^="nla"]'))updateAllProgress()});document.addEventListener('click',event=>{const button=event.target?.closest?.('#save,#championsSave,#nationsSave');if(!button)return;const kind=kindForButton(button);if(!kind)return;event.preventDefault();event.stopImmediatePropagation();saveKind(kind,button).catch(error=>root.alert?.(error?.message||String(error)))},true);let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;(root.requestAnimationFrame||root.setTimeout)(()=>{queued=false;updateAllProgress()},0)});observer.observe(document.documentElement,{subtree:true,childList:true});setTimeout(updateAllProgress,250)}
return Object.freeze({normalizePartialScores,confirmationMessage,contextFor,scoreRowsFromDom,countCompleteFromDom,updateProgress,askPartialConfirmation,saveKind,mount});
});
