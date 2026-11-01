import {newGame,player,transition,autoAction,currentPlayer,GameError} from '../../../games/ciudad/engine.mjs';
const TABLE='coco_city_rooms', FIELDS='id,invite_code,host_user,members,status,state,version,created_at,updated_at,expires_at,deadline';
const origins=new Set(['https://cocoenforma.com','https://www.cocoenforma.com','https://diegopenn-png.github.io']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const check=(ok,msg,status=409)=>{if(!ok)throw new GameError(msg,status)};
export function createHandler({db,auth,now=()=>Date.now(),randomUUID=()=>crypto.randomUUID(),rng}){return async req=>{
 const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
 if(origins.has(origin))Object.assign(headers,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS'});
 const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
 try{
  check(!origin||origins.has(origin),'Origen no permitido.',403);if(req.method==='OPTIONS')return new Response(null,{status:204,headers});check(req.method==='POST','Usa POST.',405);
  const token=(req.headers.get('authorization')||'').match(/^Bearer (.+)$/i)?.[1];check(token,'Entra con tu cuenta de Coco.',401);const result=await auth.getUser(token),user=result.data?.user;check(!result.error&&user&&!user.is_anonymous&&uuid.test(user.id),'Necesitas una cuenta registrada de Coco.',401);
  const raw=await req.text();check(raw.length<4096,'Solicitud demasiado grande.',413);let b;try{b=JSON.parse(raw)}catch{throw new GameError('Solicitud no válida.',400)}check(b&&typeof b==='object'&&!Array.isArray(b),'Solicitud no válida.',400);
  const uid=user.id,stamp=new Date(now()).toISOString();const run=async query=>{const r=await query;if(r.error)throw new GameError('No se pudo actualizar la sala. Vuelve a intentarlo.',503);return r.data};
  const nick=async()=>{const r=await db.from('perfiles').select('apodo').eq('id',uid).maybeSingle();return r.data?.apodo||'Jugador de Coco'};
  if(b.action==='list')return reply({rooms:await run(db.from(TABLE).select(FIELDS).contains('members',[uid]).gt('expires_at',stamp).in('status',['waiting','active','finished']).order('updated_at',{ascending:false}).limit(10))});
  if(b.action==='create'){
   const waiting=await run(db.from(TABLE).select(FIELDS).eq('host_user',uid).eq('status','waiting').maybeSingle());if(waiting&&Date.parse(waiting.expires_at)>now())return reply({room:waiting});
   if(waiting)await run(db.from(TABLE).update({status:'cancelled'}).eq('id',waiting.id).eq('version',waiting.version));
   const recent=await db.from(TABLE).select('id',{head:true,count:'exact'}).eq('host_user',uid).gt('created_at',new Date(now()-86400000).toISOString());check(!recent.error&&recent.count<20,'Continúa una sala existente; ya creaste varias hoy.',429);
   return reply({room:await run(db.from(TABLE).insert({host_user:uid,members:[uid],invite_code:randomUUID().replaceAll('-','').slice(0,16).toUpperCase(),state:newGame(uid,await nick())}).select(FIELDS).single())});
  }
  let room;
  if(b.action==='join'){
   const code=String(b.code||'').replace(/[\s-]/g,'').toUpperCase();check(/^[0-9A-F]{16}$/.test(code),'Escribe el código completo de 16 caracteres.',400);room=await run(db.from(TABLE).select(FIELDS).eq('invite_code',code).maybeSingle());check(room&&Date.parse(room.expires_at)>now(),'La sala no está disponible.',404);if(room.members.includes(uid))return reply({room});check(room.status==='waiting'&&room.members.length<6,'La sala ya comenzó o tiene seis jugadores.');
   const state=structuredClone(room.state);state.players.push(player(uid,await nick()));const updated=await run(db.from(TABLE).update({members:[...room.members,uid],state,version:room.version+1,updated_at:stamp}).eq('id',room.id).eq('version',room.version).eq('status','waiting').select(FIELDS).maybeSingle());check(updated,'Alguien entró al mismo tiempo. Vuelve a unirte.');return reply({room:updated});
  }
  check(uuid.test(String(b.id||'')),'Sala no válida.',400);room=await run(db.from(TABLE).select(FIELDS).eq('id',b.id).maybeSingle());check(room&&room.members.includes(uid),'Esta sala no está disponible para tu cuenta.',404);check(Date.parse(room.expires_at)>now(),'Esta sala ha caducado.',410);if(b.action==='get')return reply({room});check(Number.isSafeInteger(b.version)&&b.version===room.version,'La sala cambió. Actualiza antes de continuar.');
  let patch;
  if(b.action==='cancel'){check(room.host_user===uid&&room.status==='waiting','Solo el anfitrión puede cerrar una sala de espera.');patch={status:'cancelled'};}
  else if(b.action==='leave'){check(room.status==='waiting'&&room.host_user!==uid,'Solo puedes salir de una sala de espera que no hayas creado.');const state=structuredClone(room.state);state.players=state.players.filter(p=>p.id!==uid);patch={state,members:room.members.filter(id=>id!==uid)};}
  else{
   check(room.status!=='cancelled','La sala está cerrada.');let action=b.action,values=b,actor=uid;
   if(action==='timeout'){check(room.status==='active'&&room.deadline&&Date.parse(room.deadline)<=now(),'El jugador todavía tiene tiempo para decidir.');[action,values]=autoAction(room.state);actor=currentPlayer(room.state).id;}
   const state=transition(room.state,actor,action,values,rng);if(b.action==='timeout')state.log.push('Se aplicó la opción automática tras 2 minutos de espera.');patch={state,status:state.phase==='finished'?'finished':'active',deadline:new Date(now()+120000).toISOString()};
  }
  const updated=await run(db.from(TABLE).update({...patch,version:room.version+1,updated_at:stamp}).eq('id',room.id).eq('version',room.version).select(FIELDS).maybeSingle());check(updated,'Otra acción llegó antes. Actualiza la partida.');return reply({room:updated});
 }catch(e){return reply({error:e instanceof GameError?e.message:'No se pudo completar la acción. Actualiza la sala.'},e instanceof GameError?e.status:500)}
};}
