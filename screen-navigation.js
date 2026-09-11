const ROOT_SCREEN=Object.freeze({id:'home',title:'Ana Sayfa',scrollY:0,context:null});

function cloneScreen(screen={}){
  return{
    id:String(screen.id||'home'),
    title:String(screen.title||''),
    scrollY:Number.isFinite(Number(screen.scrollY))?Math.max(0,Number(screen.scrollY)):0,
    context:screen.context??null
  };
}

function createNavigationState(){
  return{stack:[cloneScreen(ROOT_SCREEN)]};
}

function currentScreen(state){
  const stack=Array.isArray(state?.stack)&&state.stack.length?state.stack:[ROOT_SCREEN];
  return cloneScreen(stack[stack.length-1]);
}

function pushScreen(state,screen){
  const base=Array.isArray(state?.stack)&&state.stack.length?state.stack.map(cloneScreen):[cloneScreen(ROOT_SCREEN)];
  const next=cloneScreen(screen);
  if(next.id==='home')return{stack:[cloneScreen(ROOT_SCREEN)]};
  return{stack:[...base,next]};
}

function popScreen(state){
  const stack=Array.isArray(state?.stack)&&state.stack.length?state.stack.map(cloneScreen):[cloneScreen(ROOT_SCREEN)];
  if(stack.length<=1)return{stack:[cloneScreen(ROOT_SCREEN)]};
  stack.pop();
  return{stack};
}

function rememberScroll(state,scrollY){
  const stack=Array.isArray(state?.stack)&&state.stack.length?state.stack.map(cloneScreen):[cloneScreen(ROOT_SCREEN)];
  const index=stack.length-1;
  stack[index]={...stack[index],scrollY:Math.max(0,Number(scrollY)||0)};
  return{stack};
}

const api=Object.freeze({ROOT_SCREEN,createNavigationState,currentScreen,pushScreen,popScreen,rememberScroll});
if(typeof module==='object'&&module.exports)module.exports=api;
else globalThis.BizimSkorScreenNavigation=api;
