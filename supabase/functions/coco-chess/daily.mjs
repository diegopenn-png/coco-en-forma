import {Chess} from '../../../games/ajedrez/vendor/chess.mjs';
import {chooseMove} from '../../../games/ajedrez/engine.mjs';

const TABLE='coco_chess_daily';
export function madridDay(time){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(time));
 return ['year','month','day'].map(k=>parts.find(p=>p.type===k).value).join('-');
}
// The client supplies only a move. Position, opponent, result and points belong to the server.
export async function dailyAction({db,uid,body,now,check,run,outcome,ai=chooseMove}){
 const day=madridDay(now()),action=body.action;
 check(['daily_get','daily_start','daily_move','daily_resign'].includes(action),400,'Acción no válida.');
 if(action==='daily_start')await run(db.from(TABLE).upsert({user_id:uid,day},{onConflict:'user_id,day',ignoreDuplicates:true}));
 const daily=await run(db.from(TABLE).select('*').eq('user_id',uid).eq('day',day).maybeSingle());
 if(action==='daily_get'||action==='daily_start')return {daily,day};
 check(daily&&daily.id===body.id,410,'La partida del día cambió. Vuelve a Partida del día.');
 check(daily.status==='active',409,'Ya terminaste la partida del día. Tus puntos están guardados.');
 check(Number.isSafeInteger(body.version)&&body.version===daily.version,409,'La partida cambió. Actualiza para continuar.');
 const game=new Chess();if(daily.pgn)game.loadPgn(daily.pgn);
 let end;
 if(action==='daily_resign')end={result:'0-1',end_reason:'Has abandonado la partida del día.'};
 else{
  check(game.turn()==='w'&&!game.isGameOver(),409,'Actualiza la partida para continuar.');
  check(/^[a-h][1-8]$/.test(body.from)&&/^[a-h][1-8]$/.test(body.to)&&(!body.promotion||/^[qrbn]$/.test(body.promotion)),400,'Jugada no válida.');
  let legal=false;try{legal=Boolean(game.move({from:body.from,to:body.to,...(body.promotion?{promotion:body.promotion}:{})}))}catch{}
  check(legal,400,'Ese movimiento no es legal.');
  end=outcome(game);
  if(!end){
   const move=ai(game,{level:2,maxDepth:2,timeMs:250});
   check(move,503,'Coco no pudo responder. Tu jugada no se ha guardado; vuelve a intentarlo.');
   game.move(move);end=outcome(game);
  }
 }
 const updated=await run(db.rpc('coco_chess_daily_commit',{p_id:daily.id,p_user:uid,p_version:daily.version,p_pgn:game.pgn(),p_result:end?.result||'*',p_reason:end?.end_reason||''}));
 check(updated,409,'La partida cambió o terminó el día. Actualiza para continuar.');
 return {daily:updated,day};
}

