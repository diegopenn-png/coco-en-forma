// Parent secrets never enter the game state or the browser persistence layer.
const TTL=5*60*1000;
const hex=bytes=>Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');
const random=()=>hex(crypto.getRandomValues(new Uint8Array(32)));
export async function digest(value){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))}
export async function hashPin(pin,salt){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 return hex(await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256));
}
function equal(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0}
async function row(env,id){return env.DB.prepare('SELECT * FROM parental_guard WHERE user_id=?').bind(id).first()}
export async function parentStatus(env,id){const p=await row(env,id);return {configured:!!p?.pin_hash,lockedUntil:p?.blocked_until||0}}
async function attempt(env,id,now){
 await env.DB.prepare('INSERT OR IGNORE INTO parental_guard(user_id) VALUES(?)').bind(id).run();
 // Reserve the attempt atomically so concurrent requests cannot skip the limit.
 const p=await env.DB.prepare(`UPDATE parental_guard SET
 failures=CASE WHEN failures>=5 THEN 1 ELSE failures+1 END,
 blocked_until=CASE WHEN failures=4 THEN ? ELSE 0 END
 WHERE user_id=? AND blocked_until<=? RETURNING *`).bind(now+TTL,id,now).first();
 if(!p)throw Error('Demasiados intentos. Espera 5 minutos antes de volver a probar.');
 return p;
}
export async function requireParent(env,id,request,token,now=Date.now()){
 const p=await row(env,id);
 if(!p?.pin_hash||typeof token!=='string'||token.length!==64||p.ticket_expires<=now||!equal(p.ticket_hash,await digest(token))||!equal(p.auth_hash,await digest(request.headers.get('Authorization')||'')))throw Error('Entra con el PIN parental. El acceso de adulto dura 5 minutos.');
}
export async function parentAction(env,id,email,request,a,now=Date.now(),fetcher=fetch){
 if(a.type==='parent_lock'){
  await env.DB.prepare('UPDATE parental_guard SET ticket_hash=NULL,ticket_expires=0,auth_hash=NULL WHERE user_id=?').bind(id).run();return {locked:true};
 }
 const creating=a.type==='parent_set_pin';
 if(!creating&&a.type!=='parent_unlock')throw Error('Acción parental desconocida.');
 if(!/^\d{6}$/.test(a.pin||''))throw Error('El PIN debe tener exactamente 6 números.');
 if(creating&&(typeof a.password!=='string'||!a.password||a.password.length>256))throw Error('Introduce la contraseña de tu cuenta de Coco.');
 const p=await attempt(env,id,now);
 if(creating){
  const r=await fetcher(env.SUPABASE_URL+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({email,password:a.password}),signal:AbortSignal.timeout(10000)});
  const result=r.ok?await r.json():null;
  if(result?.user?.id!==id||String(result.user.email||'').toLowerCase()!==email||!result.user.email_confirmed_at)throw Error('No se pudo verificar la contraseña del adulto. Revisa los datos de tu cuenta de Coco.');
  // Dispose of the temporary password-verification session, not the current app session.
  if(result.access_token){try{await fetcher(env.SUPABASE_URL+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:'Bearer '+result.access_token},signal:AbortSignal.timeout(5000)})}catch{}}
 }else if(!p.pin_hash||!equal(p.pin_hash,await hashPin(a.pin,p.salt))){throw Error('PIN incorrecto. Después de 5 intentos se bloquea durante 5 minutos.');}
 const salt=creating?random():p.salt,pinHash=creating?await hashPin(a.pin,salt):p.pin_hash;
 const token=random(),expires=now+TTL;
 const result=await env.DB.prepare(`UPDATE parental_guard SET salt=?,pin_hash=?,failures=0,blocked_until=0,ticket_hash=?,ticket_expires=?,auth_hash=?,revision=revision+1 WHERE user_id=? AND revision=?`).bind(salt,pinHash,await digest(token),expires,await digest(request.headers.get('Authorization')||''),id,p.revision).run();
 if(result.meta.changes!==1)throw Error('El acceso parental cambió. Vuelve a entrar.');
 return {token,expires,configured:true};
}
