export async function getNativeTargets(sb){const q=await sb.rpc('list_native_push_targets');if(q.error)throw new Error('native_targets_unavailable');return (q.data||[]).map(row=>({...row,transport:'fcm',endpoint:'fcm:'+row.device_id}))}
export async function deliverNative(sb,fcm,row,payload){
 try{await fcm.send({token:row.fcm_token,...payload});return true}
 catch(error){if(error?.unregistered){const q=await sb.from('native_push_devices').update({enabled:false,fcm_token:null}).eq('device_id',row.device_id).eq('revision',row.revision).eq('fcm_token',row.fcm_token);if(q.error)throw new Error('native_cleanup_unavailable')}throw error}
}
