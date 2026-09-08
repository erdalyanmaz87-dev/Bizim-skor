(function(root){
function apply(){const doc=root.document;if(!doc||doc.getElementById('championsStyleRestore'))return;doc.head.insertAdjacentHTML('beforeend','<style id="championsStyleRestore">.champions-shell .champions-summary{background:rgba(2,12,45,.46)!important;border-color:rgba(147,197,253,.5)!important;color:#fff!important}.champions-shell .champions-summary .small{color:#dbeafe!important}.champions-shell .champions-summary .savedrow{border-color:rgba(191,219,254,.2)!important;color:#fff!important}.champions-shell .champions-summary b{color:#fff}</style>')}
if(typeof document!=='undefined'){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();setTimeout(apply,500);setTimeout(apply,2000)}
root.BizimSkorChampionsStyleRestore=Object.freeze({apply});
})(typeof globalThis!=='undefined'?globalThis:this);
