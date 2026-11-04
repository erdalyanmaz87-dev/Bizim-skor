const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../web-account-core');
test('PIN recovery requires confirmed email OTP and revokes local game identity only after server success',async()=>{
 const values=new Map([['bizimSkorName','Demo'],['bizimSkorFriendToken','old-token']]);
 const calls=[];let otpError=true,result=false;
 const controller=create({storage:{getItem:k=>values.get(k)||null,removeItem:k=>values.delete(k)},deviceId:()=>'',gameClient:{},gateway:async()=>({}),authClient:{
  auth:{verifyOtp:async input=>{calls.push(['otp',input]);return otpError?{error:{}}:{data:{session:{user:{email_confirmed_at:'2026-11-04'}}}}}},
  rpc:async(name,args)=>{calls.push(['rpc',name,args]);return {data:result}}
 }});
 await assert.rejects(controller.resetPin('demo@example.com','123456','1357','1357'),/Kod/);
 assert.equal(calls.filter(x=>x[0]==='rpc').length,0);
 assert.equal(values.get('bizimSkorFriendToken'),'old-token');
 otpError=false;
 await assert.rejects(controller.resetPin('demo@example.com','123456','1357','1357'),/tamamlanamadı/);
 assert.equal(values.get('bizimSkorFriendToken'),'old-token');
 result=true;
 assert.equal(await controller.resetPin('demo@example.com','123456','1357','1357'),true);
 assert.equal(values.has('bizimSkorFriendToken'),false);
 assert.deepEqual(calls.at(-1),['rpc','reset_player_pin_with_email',{p_new_pin:'1357'}]);
 assert.equal(calls[0][1].type,'recovery');
});
