import {newGame,addPlayer,lockFleet,fire,resign,viewFor,check,GameError} from '../../../games/naval/engine.mjs';
const TABLE='coco_naval_rooms';
const origins=new Set(['https://cocoenforma.com','https://www.cocoenforma.com','https://diegopenn-png.github.io']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const secureRandom=()=>crypto.getRandomValues(new Uint32Array(1))[0]/4294967296;
export function createHandler({db,auth,now=()=>Date.now(),randomUUID=()=>crypto.randomUUID(),rng=secureRandom}){
 return async req=>{
  const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if(origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'});
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
  try{
   check(!origin||origins.has(origin),'Origen no permitido.',403);
   if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
   check(req.method==='POST','Usa POST.',405);
   const token=(req.headers.get('authorization')||'').match(/^Bearer (.+)$/i)?.[1];
   check(token,'Entra con tu cuenta de Coco.',401);
   const result=await auth.getUser(token),user=result.data?.user;
   check(!result.error&&user&&!user.is_anonymous&&uuid.test(user.id),'Necesitas una cuenta registrada de Coco.',401);
   const raw=await req.text();check(raw.length<8192,'Solicitud demasiado grande.',413);
   let b;try{b=JSON.parse(raw)}catch{throw new GameError('Solicitud no válida.',400)}
   check(b&&typeof b==='object'&&!Array.isArray(b),'Solicitud no válida.',400);
   const uid=user.id,stamp=new Date(now()).toISOString();
   const run=async query=>{const r=await query;if(r.error){if(String(r.error.message).includes('naval_daily_room_limit'))throw new GameError('Ya creaste doce salas hoy. Continúa una existente.',429);throw new GameError('No se pudo actualizar la sala. Actualiza e inténtalo de nuevo.',503)}return r.data;};
   const load=async args=>run(db.rpc('coco_naval_load',args));
   const nick=async()=>{const r=await db.from('perfiles').select('apodo').eq('id',uid).maybeSingle();return r.data?.apodo||'Capitán de Coco';};
   const visible=(meta,state)=>({room:{...meta,game:viewFor(state,uid)}});
   const save=async(record,state,deadline)=>{
    const meta=await run(db.rpc('coco_naval_save',{p_id:record.meta.id,p_expected:record.meta.version,p_members:state.players.map(p=>p.id),p_status:state.phase,p_state:state,p_deadline:deadline}));
    check(meta,'La partida cambió. Actualiza antes de continuar.');return meta;
   };
   if(b.action==='list')return reply({rooms:await run(db.from(TABLE).select('id,invite_code,status,version,updated_at,expires_at').contains('members',[uid]).gt('expires_at',stamp).in('status',['waiting','placement','battle','finished']).order('updated_at',{ascending:false}).limit(12))});
   if(b.action==='create'){
    const waiting=await run(db.from(TABLE).select('id').eq('host_user',uid).eq('status','waiting').maybeSingle());
    if(waiting){const record=await load({p_id:waiting.id});if(record&&Date.parse(record.meta.expires_at)>now())return reply(visible(record.meta,record.state));if(record)await save(record,resign(record.state,uid),null);}
    const state=newGame(uid,await nick());
    const meta=await run(db.rpc('coco_naval_save',{p_id:randomUUID(),p_expected:-1,p_members:[uid],p_status:'waiting',p_state:state,p_deadline:null,p_host:uid,p_code:randomUUID().replaceAll('-','').slice(0,16).toUpperCase()}));
    return reply(visible(meta,state));
   }
   if(b.action==='join'){
    const code=String(b.code||'').replace(/[\s-]/g,'').toUpperCase();check(/^[0-9A-F]{16}$/.test(code),'Escribe el código de 16 caracteres.',400);
    const record=await load({p_code:code});check(record&&Date.parse(record.meta.expires_at)>now(),'La sala no está disponible.',404);
    if(record.meta.members.includes(uid))return reply(visible(record.meta,record.state));
    check(record.meta.status==='waiting'&&record.meta.members.length===1,'Esta sala ya tiene dos capitanes.');
    const state=addPlayer(record.state,uid,await nick()),meta=await save(record,state,null);
    return reply(visible(meta,state));
   }
   check(uuid.test(String(b.id||'')),'Sala no válida.',400);
   const record=await load({p_id:b.id});
   check(record&&record.meta.members.includes(uid),'Esta sala no está disponible para tu cuenta.',404);
   check(Date.parse(record.meta.expires_at)>now(),'La sala ha caducado.',410);
   if(b.action==='get')return reply(visible(record.meta,record.state));
   check(Number.isSafeInteger(b.version)&&b.version===record.meta.version,'La partida cambió. Actualiza antes de continuar.');
   let state,deadline=record.meta.deadline;
   if(b.action==='ready'){
    state=lockFleet(record.state,uid,b.fleet,rng);
    if(state.phase==='battle')deadline=new Date(now()+300000).toISOString();
   }else if(b.action==='fire'){
    state=fire(record.state,uid,b.cell);
    deadline=state.phase==='battle'?new Date(now()+300000).toISOString():null;
   }else if(b.action==='resign'){
    state=resign(record.state,uid);deadline=null;
   }else if(b.action==='timeout'){
    check(record.state.phase==='battle'&&record.state.turn!==uid&&deadline&&Date.parse(deadline)<=now(),'El otro capitán todavía tiene tiempo.');
    state=resign(record.state,record.state.turn,'timeout');deadline=null;
   }else throw new GameError('Acción no válida.',400);
   const meta=await save(record,state,deadline);return reply(visible(meta,state));
  }catch(e){return reply({error:e instanceof GameError?e.message:'No se pudo completar la acción. Actualiza la sala.'},e instanceof GameError?e.status:500);}
 };
}
