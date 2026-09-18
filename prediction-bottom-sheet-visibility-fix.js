(function(root){
  if(typeof document==='undefined')return;
  const STYLE_ID='bsPredictionBottomSheetVisibilityFixStyles';
  function ensureStyle(doc=document){
    if(doc.getElementById(STYLE_ID))return;
    const style=doc.createElement('style');
    style.id=STYLE_ID;
    style.textContent='#bsPredictionBottomSheet.open>.bs-pred-sheet,#bsPredictionBottomSheet.open>.bs-pred-sheet.hide{display:block!important}';
    doc.head.appendChild(style);
  }
  function repair(doc=document){
    const panel=doc.querySelector('#bsPredictionBottomSheet>.bs-pred-sheet');
    if(!panel)return false;
    panel.classList.remove('hide');
    return true;
  }
  function mount(doc=document){
    ensureStyle(doc);
    const bind=()=>{
      const panel=doc.querySelector('#bsPredictionBottomSheet>.bs-pred-sheet');
      if(!panel)return false;
      repair(doc);
      if(root.MutationObserver&&!panel.__bsVisibilityObserver){
        const observer=new root.MutationObserver(()=>repair(doc));
        observer.observe(panel,{attributes:true,attributeFilter:['class']});
        panel.__bsVisibilityObserver=observer;
      }
      return true;
    };
    if(!bind())[40,120,300,700].forEach(ms=>root.setTimeout?.(bind,ms));
    doc.addEventListener('click',event=>{
      if(event.target?.closest?.('[data-bs-prediction-open]'))root.setTimeout?.(()=>repair(doc),0);
    },true);
    return true;
  }
  root.BizimSkorPredictionBottomSheetVisibilityFix=Object.freeze({ensureStyle,repair,mount});
  mount(document);
})(typeof globalThis!=='undefined'?globalThis:this);
