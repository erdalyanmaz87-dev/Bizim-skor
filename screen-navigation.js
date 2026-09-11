const ROOT_SCREEN=Object.freeze({id:'home',title:'Ana Sayfa',scrollY:0,context:null});
const SCREEN_REGISTRY=Object.freeze({
  home:{title:'Ana Sayfa',root:true},
  pred:{title:'Tahmin Yap'},
  arena:{title:'Arena'},
  championsRanking:{title:'Şampiyonlar Ligi Genel Sıralaması'},
  nationsRanking:{title:'UEFA Uluslar Ligi Genel Sıralaması'},
  general:{title:'Süper Lig Genel Sıralaması'},
  weeklyRankings:{title:'Hafta Sıralaması'},
  live:{title:'Hafta Sıralaması',aliasOf:'weeklyRankings'},
  resultsWeek:{title:'Fikstür'},
  footballCenter:{title:'Futbol Merkezi'},
  friendLeagues:{title:'Arkadaş Liglerim'},
  history:{title:'Tahmin Geçmişim'},
  rules:{title:'Kurallar'},
  chat:{title:'Sohbet'},
  championsPred:{title:'Şampiyonlar Ligi Tahminleri'},
  nationsPred:{title:'UEFA Uluslar Ligi Tahminleri'},
  playerProfile:{title:'Oyuncu Profili',detail:true},
  supportPlayer:{title:'Bize Ulaşın'},
  supportAdmin:{title:'Gelen Kutusu',adminOnly:true}
});

function canonicalScreenId(id){
  const key=String(id||'home');
  return SCREEN_REGISTRY[key]?.aliasOf||key;
}
function screenDefinition(id){return SCREEN_REGISTRY[canonicalScreenId(id)]||null}
function registeredScreenIds(){return Object.keys(SCREEN_REGISTRY)}
function missingRegisteredScreens(ids=[]){return ids.filter(id=>!SCREEN_REGISTRY[id]&&!SCREEN_REGISTRY[canonicalScreenId(id)])}

function cloneScreen(screen={}){
  const id=canonicalScreenId(screen.id||'home');
  const def=screenDefinition(id);
  return{
    id,
    title:String(screen.title||def?.title||''),
    scrollY:Number.isFinite(Number(screen.scrollY))?Math.max(0,Number(screen.scrollY)):0,
    context:screen.context??null
  };
}
function createNavigationState(){return{stack:[cloneScreen(ROOT_SCREEN)]};}
function currentScreen(state){const stack=Array.isArray(state?.stack)&&state.stack.length?state.stack:[ROOT_SCREEN];return cloneScreen(stack[stack.length-1]);}
function pushScreen(state,screen){const base=Array.isArray(state?.stack)&&state.stack.length?state.stack.map(cloneScreen):[cloneScreen(ROOT_SCREEN)];const next=cloneScreen(screen);if(next.id==='home')return{stack:[cloneScreen(ROOT_SCREEN)]};return{stack:[...base,next]};}
function popScreen(state){const stack=Array.isArray(state?.stack)&&state.stack.length?state.stack.map(cloneScreen):[cloneScreen(ROOT_SCREEN)];if(stack.length<=1)return{stack:[cloneScreen(ROOT_SCREEN)]};stack.pop();return{stack};}
function rememberScroll(state,scrollY){const stack=Array.isArray(state?.stack)&&state.stack.length?state.stack.map(cloneScreen):[cloneScreen(ROOT_SCREEN)];const index=stack.length-1;stack[index]={...stack[index],scrollY:Math.max(0,Number(scrollY)||0)};return{stack};}

const api=Object.freeze({ROOT_SCREEN,SCREEN_REGISTRY,canonicalScreenId,screenDefinition,registeredScreenIds,missingRegisteredScreens,createNavigationState,currentScreen,pushScreen,popScreen,rememberScroll});
if(typeof module==='object'&&module.exports)module.exports=api;
else globalThis.BizimSkorScreenNavigation=api;
