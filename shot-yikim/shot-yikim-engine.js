(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ShotYikimEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const CONFIG=Object.freeze({maxRounds:20,fallenScore:100,roundBonus:500});
  const MATERIALS=['wood','stone','metal'];
  function block(id,x,y,z,sx,sy,sz,material='stone',shape='box',rotationY=0){return{id,position:{x,y,z},size:{x:sx,y:sy,z:sz},material,shape,rotationY};}
  function makeLevel(id,name,shots,tiers,depthCount=1){const blocks=[];const baseY=1.06;let n=0;for(let t=0;t<tiers.length;t++){const count=tiers[t];const width=0.62;const spacing=count===1?0:width/(count-1);const sx=Math.max(.18,Math.min(.28,.72/Math.max(2,count)));const sy=.17;const sz=depthCount>1?.22:.28;for(let d=0;d<depthCount;d++){const z=(d-(depthCount-1)/2)*.25;for(let i=0;i<count;i++){const x=count===1?0:-width/2+i*spacing;const material=MATERIALS[(id+t+i+d)%MATERIALS.length];const shape=(id>7&&(i+t+d)%6===0)?'cylinder':'box';blocks.push(block(`l${id}-${n++}`,x,baseY+t*.18,z,sx,sy,sz,material,shape,(t%2)*Math.PI/2));}}}return Object.freeze({id,name,shots,blocks:Object.freeze(blocks.map(Object.freeze))});}
  const layouts=[
    ['Isınma',5,[2,1],1],['İki Kat',5,[2,2],1],['Piramit',6,[3,2,1],1],['Metal Tepe',6,[3,2,1],1],['Dişli Kule',7,[3,3,1],1],['Geniş Taban',7,[4,3,2],1],['Dört Kat',8,[4,3,2,1],1],['Yuvarlak Tehlike',8,[4,3,2,1],1],['Kale Kapısı',9,[5,4,2],1],['İlk Final',9,[5,4,3,1],1],
    ['Derinlik Başlıyor',10,[4,3,2],2],['Çift Hat',10,[5,4,2],2],['Dar Boğaz',10,[5,4,3],2],['Çifte Duvar',11,[5,4,3,2],2],['Yüksek Kule',11,[5,4,3,2,1],2],['Metal Gövde',12,[6,5,4,2],2],['Sarsılmaz mı?',12,[6,5,4,3,2],2],['Zırhlı Piramit',13,[6,5,4,3,2,1],2],['Yarı Final',13,[7,6,5,4,2],2],['Büyük Final',14,[7,6,5,4,3,2],3]
  ];
  const LEVELS=Object.freeze(layouts.map((v,i)=>makeLevel(i+1,v[0],v[1],v[2],v[3])));
  function levelFor(round){return LEVELS[Math.min(Math.max(Number(round)||1,1),LEVELS.length)-1];}
  function createStateForRound(round,score=0,phase='playing'){const safe=Math.min(Math.max(Number(round)||1,1),LEVELS.length),level=levelFor(safe);return{status:'ready',phase,round:safe,levelName:level.name,score:Number(score)||0,shotsRemaining:level.shots,maxRounds:LEVELS.length};}
  function createInitialState(){return createStateForRound(1,0,'menu');}
  function startGame(){return createStateForRound(1,0,'playing');}
  function recordShot(state){return{...state,status:'playing',phase:'playing',shotsRemaining:Math.max(0,state.shotsRemaining-1)};}
  function recordFallen(state,count){return{...state,score:state.score+Math.max(0,Number(count)||0)*CONFIG.fallenScore};}
  function completeRound(state){return{...state,score:state.score+CONFIG.roundBonus,status:state.round>=LEVELS.length?'game-complete':'round-complete'};}
  function failRound(state){return{...state,status:'game-over'};}
  function startNextRound(state){return state.round>=LEVELS.length?{...state,status:'game-complete'}:createStateForRound(state.round+1,state.score,'playing');}
  function resetRound(state){return createStateForRound(state.round,state.score,'playing');}
  return Object.freeze({CONFIG,LEVELS,createInitialState,createStateForRound,startGame,recordShot,recordFallen,completeRound,failRound,startNextRound,resetRound});
});