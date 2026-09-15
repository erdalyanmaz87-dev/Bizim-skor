(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.ShotYikimEngine=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const CONFIG=Object.freeze({maxRounds:20,fallenScore:100,roundBonus:500});
  const TABLE_TOP=.92;
  function b(id,x,y,z,sx,sy,sz,material='stone',shape='box',rotationY=0){return{id,position:{x,y,z},size:{x:sx,y:sy,z:sz},material,shape,rotationY};}
  function towerLevel(id,name,shots,opt={}){
    const blocks=[];let n=0;const add=(...args)=>blocks.push(b(`l${id}-${n++}`,...args));
    const columns=opt.columns||2,stories=opt.stories||3,depths=opt.depths||1;
    const colGap=opt.colGap||.55,segmentH=opt.segmentH||.22,postW=opt.postW||.18,postD=opt.postD||.26;
    const zGap=depths>1?.34:0;
    for(let d=0;d<depths;d++){
      const z=(d-(depths-1)/2)*zGap;
      for(let c=0;c<columns;c++){
        const x=(c-(columns-1)/2)*colGap;
        for(let s=0;s<stories;s++){
          const mat=(s+c+d+id)%5===0?'metal':((s+c+id)%3===0?'wood':'stone');
          add(x,TABLE_TOP+segmentH/2+s*segmentH,z,postW,segmentH-.012,postD,mat,'box');
        }
      }
      const topY=TABLE_TOP+stories*segmentH+.075;
      add(0,topY,z,Math.min(1.08,(columns-1)*colGap+postW+.22),.14,postD+.03,id>11?'metal':'stone','box');
      if(opt.midBridge&&stories>=3)add(0,TABLE_TOP+segmentH*2+.045,z,Math.min(.92,(columns-1)*colGap+postW+.12),.11,postD+.025,'wood','box');
      if(opt.caps){
        const capCount=Math.min(columns+1,4);
        for(let i=0;i<capCount;i++){
          const x=(i-(capCount-1)/2)*.24;
          add(x,topY+.18,z,.17,.17,postD*.92,(i+id)%2?'stone':'wood',i%2?'cylinder':'box');
        }
        add(0,topY+.34,z,.50,.13,postD+.02,'stone','box');
      }
    }
    if(opt.crossDepth&&depths>1){
      const y=TABLE_TOP+stories*segmentH*.62;
      add(0,y,0,.18,.15,zGap*(depths-1)+.42,'wood','box',Math.PI/2);
    }
    const ratio=Math.min(.82,.64+id*.008);
    const requiredFalls=Math.max(1,Math.ceil(blocks.length*ratio));
    return Object.freeze({id,name,shots,requiredFalls,blocks:Object.freeze(blocks.map(Object.freeze))});
  }
  const SPECS=[
    ['İlk Kule',6,{columns:2,stories:3,caps:true}],
    ['Çift Ayak',6,{columns:2,stories:4,caps:true}],
    ['Köprü',7,{columns:2,stories:4,midBridge:true,caps:true}],
    ['Üç Ayak',7,{columns:3,stories:3,caps:true,colGap:.42}],
    ['Yüksek Kule',8,{columns:2,stories:5,midBridge:true,caps:true}],
    ['Dar Geçit',8,{columns:3,stories:4,caps:true,colGap:.38}],
    ['Taş Köprü',9,{columns:3,stories:4,midBridge:true,caps:true,colGap:.40}],
    ['İkiz Kule',9,{columns:2,stories:5,caps:true,depths:2}],
    ['Çifte Köprü',10,{columns:2,stories:5,midBridge:true,caps:true,depths:2}],
    ['İlk Final',10,{columns:3,stories:5,midBridge:true,caps:true,colGap:.38}],
    ['Derin Kule',11,{columns:2,stories:6,caps:true,depths:2,crossDepth:true}],
    ['Çift Katman',11,{columns:3,stories:5,midBridge:true,caps:true,depths:2,colGap:.36}],
    ['Dar ve Yüksek',12,{columns:2,stories:7,midBridge:true,caps:true,postW:.16}],
    ['Kale Kulesi',12,{columns:3,stories:6,midBridge:true,caps:true,colGap:.36}],
    ['Üç Boyutlu Köprü',13,{columns:3,stories:5,midBridge:true,caps:true,depths:2,crossDepth:true,colGap:.36}],
    ['Metal Tepe',13,{columns:2,stories:7,midBridge:true,caps:true,depths:2,crossDepth:true}],
    ['Sarsılmaz mı?',14,{columns:3,stories:6,midBridge:true,caps:true,depths:2,colGap:.34}],
    ['Zırhlı Kule',15,{columns:3,stories:7,midBridge:true,caps:true,colGap:.34,postW:.17}],
    ['Yarı Final',16,{columns:3,stories:7,midBridge:true,caps:true,depths:2,crossDepth:true,colGap:.34}],
    ['Büyük Final',18,{columns:3,stories:8,midBridge:true,caps:true,depths:2,crossDepth:true,colGap:.33,postW:.16}]
  ];
  const LEVELS=Object.freeze(SPECS.map((s,i)=>towerLevel(i+1,s[0],s[1],s[2])));
  function levelFor(round){return LEVELS[Math.min(Math.max(Number(round)||1,1),LEVELS.length)-1];}
  function createStateForRound(round,score=0,phase='playing'){const safe=Math.min(Math.max(Number(round)||1,1),LEVELS.length),level=levelFor(safe);return{status:'ready',phase,round:safe,levelName:level.name,score:Number(score)||0,shotsRemaining:level.shots,fallenCount:0,requiredFalls:level.requiredFalls,maxRounds:LEVELS.length};}
  function createInitialState(){return createStateForRound(1,0,'menu');}
  function startGame(){return createStateForRound(1,0,'playing');}
  function recordShot(state){return{...state,status:'playing',phase:'playing',shotsRemaining:Math.max(0,state.shotsRemaining-1)};}
  function recordFallen(state,count){const n=Math.max(0,Number(count)||0);return{...state,score:state.score+n*CONFIG.fallenScore,fallenCount:state.fallenCount+n};}
  function completeRound(state){return{...state,score:state.score+CONFIG.roundBonus,status:state.round>=LEVELS.length?'game-complete':'round-complete'};}
  function failRound(state){return{...state,status:'game-over'};}
  function startNextRound(state){return state.round>=LEVELS.length?{...state,status:'game-complete'}:createStateForRound(state.round+1,state.score,'playing');}
  function resetRound(state){return createStateForRound(state.round,state.score,'playing');}
  return Object.freeze({CONFIG,LEVELS,createInitialState,createStateForRound,startGame,recordShot,recordFallen,completeRound,failRound,startNextRound,resetRound});
});