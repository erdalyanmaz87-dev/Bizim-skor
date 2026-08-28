const test=require('node:test');
const assert=require('node:assert/strict');

let detectLaunchContext=()=>({launchMode:'',platform:''});
try{
  const api=require('../launch-context');
  detectLaunchContext=api.detectLaunchContext||detectLaunchContext;
}catch{}

test('iPhone ana ekran uygulamasını ayırt eder',()=>{
  assert.deepEqual(detectLaunchContext({standalone:true,displayStandalone:false,userAgent:'Mozilla/5.0 (iPhone)'}),{
    launchMode:'home_screen',platform:'iPhone'
  });
});

test('Android kurulu uygulamasını ayırt eder',()=>{
  assert.deepEqual(detectLaunchContext({standalone:false,displayStandalone:true,userAgent:'Mozilla/5.0 (Linux; Android 15)'}),{
    launchMode:'home_screen',platform:'Android'
  });
});

test('normal tarayıcı açılışını kaydeder',()=>{
  assert.deepEqual(detectLaunchContext({standalone:false,displayStandalone:false,userAgent:'Mozilla/5.0 (iPhone)'}),{
    launchMode:'browser',platform:'iPhone'
  });
});
