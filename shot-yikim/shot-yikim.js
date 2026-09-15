const engine=window.ShotYikimEngine;
const $=id=>document.getElementById(id);
const menu=$('shotYikimMenu'),start=$('shotYikimStart'),board=$('shotYikimBoard'),viewport=$('shotYikimViewport');
const roundEl=$('shotYikimRound'),scoreEl=$('shotYikimScore'),shotsEl=$('shotYikimShots'),levelName=$('shotYikimLevelName'),statusEl=$('shotYikimStatus'),restart=$('shotYikimRestart');
let state=engine.createInitialState(),game3d=null,loading=false,roundTimer=null;

function statusText(){
  if(state.phase==='menu')return "Başlamak için OYNA'ya bas.";
  if(state.status==='game-complete')return '20 bölüm tamamlandı! Şut Yıkım 3D şampiyonusun! 🏆';
  if(state.status==='round-complete')return `${state.round}. bölüm tamamlandı! ${state.round+1}. bölüm geliyor...`;
  if(state.status==='game-over')return `Toplar bitti. ${state.round}. bölümü tekrar dene.`;
  return `${state.round}. bölüm: Kuleyi masadan aşağı indir.`;
}
function render(){menu.hidden=state.phase!=='menu';roundEl.textContent=state.round;scoreEl.textContent=state.score;shotsEl.textContent=state.shotsRemaining;levelName.textContent=`${state.round}. Bölüm · ${state.levelName}`;statusEl.textContent=statusText();restart.disabled=state.phase==='menu'||loading;}
function currentLevel(){return engine.LEVELS[state.round-1];}
function clearRoundTimer(){if(roundTimer){clearTimeout(roundTimer);roundTimer=null;}}

async function ensureGame(){
  if(game3d)return game3d;
  loading=true;start.disabled=true;statusEl.textContent='3D saha hazırlanıyor...';
  try{
    const {createGame3D}=await import('./shot-yikim-3d.js');
    game3d=await createGame3D({container:viewport,level:currentLevel(),onBlockFallen(){state=engine.recordFallen(state,1);render();},onSettled({remaining}){handleSettled(remaining);}});
    return game3d;
  }catch(error){console.error(error);statusEl.textContent='3D oyun başlatılamadı. Sayfayı yenileyip tekrar dene.';throw error;
  }finally{loading=false;start.disabled=false;}
}
function handleSettled(remaining){
  if(state.status==='game-over'||state.status==='game-complete'||state.status==='round-complete')return;
  if(remaining===0){state=engine.completeRound(state);game3d?.setEnabled(false);render();if(state.status==='round-complete'){roundTimer=setTimeout(()=>{state=engine.startNextRound(state);game3d.reset(currentLevel());game3d.setEnabled(true);render();},1100);}return;}
  if(state.shotsRemaining===0){state=engine.failRound(state);game3d?.setEnabled(false);render();return;}
  statusEl.textContent=`${state.round}. bölüm: ${remaining} parça hâlâ masada.`;
}
async function begin(){
  clearRoundTimer();state=engine.startGame();render();
  const game=await ensureGame();game.reset(currentLevel());game.setEnabled(true);render();
}
start.addEventListener('click',()=>{begin().catch(()=>{});});
restart.addEventListener('click',async()=>{if(loading)return;clearRoundTimer();state=engine.resetRound(state);render();try{const game=await ensureGame();game.reset(currentLevel());game.setEnabled(true);}catch{}render();});
viewport.addEventListener('pointerup',event=>{
  if(!game3d||loading||state.phase==='menu'||state.status==='game-over'||state.status==='game-complete'||state.status==='round-complete'||state.shotsRemaining<=0)return;
  if(game3d.shootAtClientPoint(event.clientX,event.clientY)){state=engine.recordShot(state);render();statusEl.textContent='Şut! Fizik durana kadar bekle...';}
});
render();
