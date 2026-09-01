self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?event.data.json():{}}catch{data={body:event.data?event.data.text():''}}
  const title=data.title||'⚽ Bizim Skor';
  const options={
    body:data.body||'Bizim Skor’da yeni bir gelişme var.',
    icon:'bizim-skor-icon-v2.png',
    badge:'bizim-skor-icon-v2.png',
    data:{url:data.url||self.registration.scope},
    tag:data.tag||`bizim-skor-${Date.now()}`
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification.data?.url||self.registration.scope;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const client of list){
      if(client.url.startsWith(self.registration.scope)&&'focus' in client){client.navigate(target);return client.focus()}
    }
    return clients.openWindow?clients.openWindow(target):undefined;
  }));
});
