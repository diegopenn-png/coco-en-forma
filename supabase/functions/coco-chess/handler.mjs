import {Chess} from '../../../games/ajedrez/vendor/chess.mjs';
import {dailyAction} from './daily.mjs';
const TABLE='coco_chess_games';
const FIELDS='id,invite_code,white_user,black_user,white_name,black_name,status,pgn,result,end_reason,version,draw_offer,created_at,updated_at,expires_at';
const origins=new Set(['https://cocoenforma.com','https://www.cocoenforma.com','https://diegopenn-png.github.io']);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
class HttpError extends Error{constructor(status,message){super(message);this.status=status}}
function check(condition,status,message){if(!condition)throw new HttpError(status,message)}
function nickname(value){return String(value||'Jugador de Coco').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,40)||'Jugador de Coco'}
function outcome(chess){
 if(chess.isCheckmate())return {result:chess.turn()==='w'?'0-1':'1-0',end_reason:'Jaque mate.'};
 if(chess.isStalemate())return {result:'1/2-1/2',end_reason:'Tablas por ahogado.'};
 if(chess.isInsufficientMaterial())return {result:'1/2-1/2',end_reason:'Tablas por material insuficiente.'};
 if(chess.isThreefoldRepetition())return {result:'1/2-1/2',end_reason:'Tablas por tercera repetición.'};
 if(chess.isDrawByFiftyMoves())return {result:'1/2-1/2',end_reason:'Tablas por 50 movimientos.'};
 return null;
}
export function createHandler({db,auth,randomUUID=()=>crypto.randomUUID(),now=()=>Date.now(),dailyAI}){
 return async req=>{
  const origin=req.headers.get('origin'),headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin'};
  if(origins.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Access-Control-Allow-Headers']='authorization,apikey,content-type,x-client-info';headers['Access-Control-Allow-Methods']='POST, OPTIONS'}
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  try{
   check(!origin||origins.has(origin),403,'Origen no permitido.');
   if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
   check(req.method==='POST',405,'Usa POST.');
   const token=(req.headers.get('authorization')||'').match(/^Bearer (.+)$/i)?.[1];
   check(token,401,'Inicia sesión con tu cuenta de Coco.');
   const verified=await auth.getUser(token),user=verified.data?.user;
   check(!verified.error&&user&&!user.is_anonymous,401,'Inicia sesión con una cuenta registrada de Coco.');
   check(uuid.test(user.id),401,'La cuenta no es válida.');
   const raw=await req.text();check(raw.length<=2048,413,'Solicitud demasiado grande.');
   let body;try{body=JSON.parse(raw)}catch{throw new HttpError(400,'Solicitud no válida.')}
   check(body&&typeof body==='object'&&!Array.isArray(body),400,'Solicitud no válida.');
   const uid=user.id,action=body.action,stamp=new Date(now()).toISOString();
   const run=async query=>{const r=await query;if(r.error)throw new HttpError(503,'No se pudo actualizar la sala. Inténtalo otra vez.');return r.data};
   if(typeof action==='string'&&action.startsWith('daily_'))return reply(await dailyAction({db,uid,body,now,check,run,outcome,ai:dailyAI}));
   const name=async()=>{const r=await db.from('perfiles').select('apodo').eq('id',uid).maybeSingle();return nickname(r.data?.apodo)};
   if(action==='list'){
    const rooms=await run(db.from(TABLE).select(FIELDS).or(`white_user.eq.${uid},black_user.eq.${uid}`).gt('expires_at',stamp).in('status',['waiting','active','finished']).order('updated_at',{ascending:false}).limit(10));
    return reply({rooms});
   }
   if(action==='create'){
    const waiting=await run(db.from(TABLE).select(FIELDS).eq('white_user',uid).eq('status','waiting').maybeSingle());
    if(waiting&&Date.parse(waiting.expires_at)>now())return reply({room:waiting});
    if(waiting)await run(db.from(TABLE).update({status:'cancelled',version:waiting.version+1,updated_at:stamp}).eq('id',waiting.id).eq('version',waiting.version));
    const recent=await db.from(TABLE).select('id',{count:'exact',head:true}).eq('white_user',uid).gt('created_at',new Date(now()-86400000).toISOString());
    check(!recent.error,503,'No se pudo comprobar la sala.');check(recent.count<30,429,'Ya creaste varias salas hoy. Continúa una de tus partidas.');
    const room=await run(db.from(TABLE).insert({invite_code:randomUUID().replaceAll('-','').slice(0,16).toUpperCase(),white_user:uid,white_name:await name()}).select(FIELDS).single());
    return reply({room});
   }
   let room;
   if(action==='join'){
    const code=String(body.code||'').replace(/[\s-]/g,'').toUpperCase();check(/^[0-9A-F]{16}$/.test(code),400,'Escribe el código completo de la sala.');
    room=await run(db.from(TABLE).select(FIELDS).eq('invite_code',code).maybeSingle());
    check(room&&Date.parse(room.expires_at)>now(),404,'Esta sala no está disponible. Comprueba el código.');
    if(room.white_user===uid||room.black_user===uid)return reply({room});
    check(room.status==='waiting'&&!room.black_user,409,'Esta sala ya tiene dos jugadores.');
    const joined=await run(db.from(TABLE).update({black_user:uid,black_name:await name(),status:'active',version:room.version+1,updated_at:stamp}).eq('id',room.id).eq('version',room.version).eq('status','waiting').is('black_user',null).select(FIELDS).maybeSingle());
    check(joined,409,'Otro jugador entró antes. Pide una sala nueva.');return reply({room:joined});
   }
   check(uuid.test(String(body.id||'')),400,'Sala no válida.');
   room=await run(db.from(TABLE).select(FIELDS).eq('id',body.id).maybeSingle());
   check(room&&(room.white_user===uid||room.black_user===uid),404,'Esta sala no está disponible para tu cuenta.');
   check(Date.parse(room.expires_at)>now(),410,'Esta sala ha caducado. Crea otra partida.');
   if(action==='get')return reply({room});
   check(Number.isSafeInteger(body.version)&&body.version===room.version,409,'La partida cambió. Actualiza el tablero.');
   let patch;
   if(action==='cancel'){
    check(room.status==='waiting'&&room.white_user===uid,409,'Solo puedes cancelar una sala que sigue esperando.');patch={status:'cancelled'};
   }else{
    check(room.status==='active',409,'La partida no está en juego.');
    const side=room.white_user===uid?'w':'b';
    if(action==='move'){
     const chess=new Chess();if(room.pgn)chess.loadPgn(room.pgn);
     check(chess.turn()===side,409,'Es el turno del otro jugador.');check(!chess.isGameOver(),409,'La partida ya terminó.');
     check(/^[a-h][1-8]$/.test(body.from)&&/^[a-h][1-8]$/.test(body.to)&&(!body.promotion||/^[qrbn]$/.test(body.promotion)),400,'Jugada no válida.');
     try{chess.move({from:body.from,to:body.to,...(body.promotion?{promotion:body.promotion}:{})})}catch{throw new HttpError(400,'Ese movimiento no es legal.')}
     const end=outcome(chess);patch={pgn:chess.pgn(),...(end?{...end,status:'finished',draw_offer:null}:{}),...(room.draw_offer&&room.draw_offer!==uid?{draw_offer:null}:{})};
    }else if(action==='resign')patch={status:'finished',result:side==='w'?'0-1':'1-0',end_reason:`El jugador de ${side==='w'?'blancas':'negras'} abandona.`,draw_offer:null};
    else if(action==='draw'){
     check(room.draw_offer!==uid,409,'Tu propuesta de tablas está pendiente.');
     patch=room.draw_offer?{status:'finished',result:'1/2-1/2',end_reason:'Tablas por acuerdo de ambos jugadores.',draw_offer:null}:{draw_offer:uid};
    }else if(action==='decline')patch={draw_offer:null};
    else throw new HttpError(400,'Acción no válida.');
   }
   const updated=await run(db.from(TABLE).update({...patch,version:room.version+1,updated_at:stamp}).eq('id',room.id).eq('version',room.version).select(FIELDS).maybeSingle());
   check(updated,409,'La partida cambió. Actualiza el tablero.');return reply({room:updated});
  }catch(e){return reply({error:e instanceof HttpError?e.message:'No se pudo completar la petición. Inténtalo otra vez.'},e instanceof HttpError?e.status:500)}
 };
}
