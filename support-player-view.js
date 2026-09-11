(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.BizimSkorSupportPlayerView=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={login_pin:'Giriş / PIN',predictions:'Tahminler',points_ranking:'Puan / Sıralama',technical:'Teknik Sorun',suggestion:'Öneri',other:'Diğer'};
  function supportButton(unread=0){return `<button type="button" id="openSupportInbox" class="full">📩 Bize Ulaşın${unread>0?` <span class="support-badge">${unread}</span>`:''}</button>`}
  function form(){return `<form id="supportRequestForm"><label>Kategori</label><select id="supportCategory"><option value="login_pin">Giriş / PIN</option><option value="predictions">Tahminler</option><option value="points_ranking">Puan / Sıralama</option><option value="technical">Teknik Sorun</option><option value="suggestion">Öneri</option><option value="other">Diğer</option></select><label>Mesajın</label><textarea id="supportMessage" maxlength="500" rows="5"></textarea><div class="small"><span id="supportCounter">0</span>/500</div><button type="submit" class="full p">Gönder</button></form>`}
  function card(row={}){return `<article class="support-card"><div><b>${esc(labels[row.category]||'Diğer')}</b><span>${esc(row.status||'new')}</span></div><p>${esc(row.message||'')}</p>${row.admin_reply?`<div class="support-reply"><b>Yönetici cevabı</b><p>${esc(row.admin_reply)}</p></div>`:''}</article>`}
  function panel(rows=[]){return `<section class="support-panel"><div class="support-head"><h2>📩 Bize Ulaşın</h2><button type="button" data-support-close>×</button></div>${form()}<h3>Mesajlarım</h3><div id="supportHistory">${rows.map(card).join('')||'<p class="small">Henüz mesajın yok.</p>'}</div></section>`}
  return Object.freeze({supportButton,form,card,panel});
});
