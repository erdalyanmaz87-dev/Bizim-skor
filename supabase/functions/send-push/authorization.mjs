// Service credentials never enter a browser. Public project keys and ordinary
// player JWTs are not administrative authorization.
async function equalSecret(actual,expected){
 if(!actual||!expected)return false;
 const hash=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
 const [a,b]=await Promise.all([hash(actual),hash(expected)]);
 let difference=0;for(let i=0;i<a.length;i++)difference|=a[i]^b[i];
 return difference===0;
}
export async function authorizePushRequest(request,{serviceKey,authorizeCron}){
 if(request.method!=='POST')return false;
 if(await equalSecret(request.headers.get('authorization')?.replace(/^Bearer\s+/i,''),serviceKey))return true;
 const secret=request.headers.get('x-cron-secret');
 if(!secret||secret.length>256)return false;
 try{return await authorizeCron(secret)===true}catch{return false}
}
