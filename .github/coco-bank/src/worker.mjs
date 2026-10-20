import {action,settle,summary,CATALOG} from './engine.mjs';
import {refreshMarket} from './market.mjs';
import {renderApp} from './ui.mjs';
export const ADMIN_ID='88c250d6-3f3c-4e82-95ea-951dd914949d';
const ADMIN_EMAIL='diegopenn@icloud.com';
const ORIGINS=new Set(['https://www.cocoenforma.com','https://cocoenforma.com']);
const VERSION='1.0.0-private';
export async function authenticate(request,env,fetcher=fetch){
 const auth=request.headers.get('Authorization');if(!/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(auth||''))return false;
 const r=await fetcher(env.SUPABASE_URL+'/auth/v1/user',{headers:{Authorization:auth,apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(8000)});
 if(!r.ok)return false;const u=await r.json();return u.id===ADMIN_ID&&String(u.email||'').toLowerCase()===ADMIN_EMAIL&&!!u.email_confirmed_at;
}
async function market(env,cutoff=Date.now()){
 const row=await env.DB.prepare('SELECT body FROM market_snapshots WHERE at <= ? ORDER BY at DESC LIMIT 1').bind(cutoff).first();
 return row?JSON.parse(row.body):{prices:{},events:[],updatedAt:null,errors:['Esperando la primera actualización del mercado.']};
}
async function readState(env){const row=await env.DB.prepare('SELECT body,rev FROM game_state WHERE user_id=?').bind(ADMIN_ID).first();return {state:row?.body?JSON.parse(row.body):null,rev:row?.rev||0}}
async function commit(env,s,rev){
 if(!rev){const r=await env.DB.prepare('INSERT OR IGNORE INTO game_state(user_id,body,rev) VALUES(?,?,1)').bind(ADMIN_ID,JSON.stringify(s)).run();return r.meta.changes===1}
 const r=await env.DB.prepare('UPDATE game_state SET body=?,rev=rev+1 WHERE user_id=? AND rev=?').bind(JSON.stringify(s),ADMIN_ID,rev).run();return r.meta.changes===1;
}
async function advance(env,mutation){
 for(let attempt=0;attempt<4;attempt++){
  const {state,rev}=await readState(env),now=Date.now();
  const m=await market(env,state?Math.min(now,state.config.endsAt):now);
  const next=mutation?action(state,m,mutation,now):(state?settle(state,m,now):null);
  if(JSON.stringify(next)===JSON.stringify(state)||await commit(env,next,rev))return {state:next,market:m,summary:next?summary(next,m,Math.min(now,next.config.endsAt)):null,serverTime:now,catalog:CATALOG,version:VERSION};
 }
 throw new Error('Hay otra operación en curso. Vuelve a intentarlo.');
}
async function daily(env){
 const prior=await market(env),m=await refreshMarket(prior);
 await env.DB.prepare('INSERT OR REPLACE INTO market_snapshots(at,body) VALUES(?,?)').bind(m.updatedAt,JSON.stringify(m)).run();
 await advance(env); // Salary, expenses, orders and maturities keep progressing while the app is closed.
 return {updatedAt:m.updatedAt,assets:Object.keys(m.prices),rate:m.rate?.annualPct,errors:m.errors};
}
export default {
 async fetch(request,env){
  const url=new URL(request.url),origin=request.headers.get('Origin');
  const headers={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff','Vary':'Origin','Content-Type':'application/json; charset=utf-8'};
  if(origin&&ORIGINS.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Methods']='GET,POST,OPTIONS';headers['Access-Control-Allow-Headers']='Authorization,Content-Type';}
  const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!ORIGINS.has(origin))return json({error:'Origen no permitido.'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(url.pathname==='/health'&&request.method==='GET')return json({ok:true,version:VERSION,private:true});
  try{
   if(!await authenticate(request,env))return json({error:'Acceso privado.'},403);
   if(request.method==='GET'&&url.pathname==='/access')return json({allowed:true,version:VERSION});
   if(request.method==='GET'&&url.pathname==='/bundle')return new Response(renderApp(),{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors https://www.cocoenforma.com https://cocoenforma.com"}});
   if(request.method==='GET'&&url.pathname==='/state')return json(await advance(env));
   if(request.method==='POST'&&url.pathname==='/action'){
    if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Formato no admitido.'},415);
    const text=await request.text();if(text.length>8192)return json({error:'Petición demasiado grande.'},413);
    let a;try{a=JSON.parse(text)}catch{return json({error:'Petición inválida.'},400)}
    return json(await advance(env,a));
   }
   return json({error:'No encontrado.'},404);
  }catch(e){return json({error:e.message?.slice(0,180)||'No se pudo completar la operación.'},e.message?.includes('fetch')?503:400)}
 },
 async scheduled(event,env,ctx){ctx.waitUntil(daily(env));}
};
export {daily};
