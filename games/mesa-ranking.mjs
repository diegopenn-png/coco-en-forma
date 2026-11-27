// Shared-device games credit the signed-in account playing the first seat.
const authKey='sb-fcatttsfufjiphgohgwp-auth-token';
function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}}
function account(){
 const user=read(authKey,null)?.user;
 return user&&!user.is_anonymous?user.id:null;
}
export function newRankingMatch(){
 return {owner:account(),id:crypto.randomUUID?.()||Array.from(crypto.getRandomValues(new Uint8Array(16)),b=>b.toString(16).padStart(2,'0')).join('')};
}
function evidence(game,s){
 const players=s.players.map(({id,scores,shots})=>({id,scores,shots:shots?.map(({cell,kind})=>({cell,kind}))}));
 if(game==='ciudad')return {phase:s.phase,round:s.round,rounds:s.rounds,rollSeq:s.rollSeq,properties:s.properties,
  players:s.players.map(({id,money,salary,skill,experience,community,wellbeing,goal})=>({id,money,salary,skill,experience,community,wellbeing,goal}))};
 if(game==='generala')return {phase:s.phase,players,rules:s.rules,servedWinner:s.servedWinner,dice:s.dice,rolls:s.rolls};
 return {phase:s.phase,players,winner:s.winner,reason:s.reason};
}
export function tableRanking(game,client){
 const prefix='coco.tabla.'+game+'.',active=new Map();
 const roomScores=new Map();
 let shown=null;
 function status(key,message){
  const element=document.getElementById('rankingResult');
  if(element&&key===shown){
   if((window.CocoLocale?.sourceText(element)??element.textContent)!==message)element.textContent=message;
   element.hidden=false;
  }
 }
 async function submit(key,job){
  if(active.has(key))return active.get(key);
  const request=(async()=>{
   try{
    const api=await client(),{data}=await api.auth.getSession();
    if(data.session?.user?.id!==job.owner)return;
    const response=await api.rpc('coco_mesa_final_local',{p_juego:game,p_partida:job.id,p_estado:job.state});
    if(response.error)throw response.error;
    const message={saved:'Puntuación registrada',daily:'La partida de hoy ya estaba registrada.',incomplete:'No puntúa para la clasificación general'}[response.data];
    if(!message)throw new Error('unexpected_result');
    try{localStorage.setItem(key,JSON.stringify({owner:job.owner,id:job.id,message}));}catch{}
    status(key,message);
   }catch{status(key,'Pendiente de sincronizar');}
  })();
  active.set(key,request);
  try{await request}finally{active.delete(key)}
 }
 function retry(){
  const owner=account();if(!owner)return;
  for(const key of Object.keys(localStorage)){
   if(!key.startsWith(prefix))continue;
   const job=read(key,null);if(job?.owner===owner&&job.state)submit(key,job);
  }
 }
 window.addEventListener('online',retry);
 window.addEventListener('pageshow',retry);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)retry()});
 async function readRoom(key,id){
  if(active.has(key))return;
  const request=(async()=>{
   try{
    const api=await client(),{data,error}=await api.from('coco_mesa_resultados').select('puntos,cuenta').eq('juego',game).eq('partida',id).maybeSingle();
    if(error||!data)throw new Error('score_unavailable');
    const message=data.cuenta?'Puntuación registrada':'La partida de hoy ya estaba registrada.';
    roomScores.set(key,message);status(key,message);
   }catch{status(key,'Pendiente de sincronizar');}
  })();
  active.set(key,request);try{await request}finally{active.delete(key)}
 }
 return function finish(match,state,roomId){
  const key=roomId?'room:'+roomId:match&&prefix+match.id;shown=key;
  if(game==='naval'&&state.reason!=='fleet'){status(key,'No puntúa para la clasificación general');return;}
  if(roomId){
   if(roomScores.has(key))status(key,roomScores.get(key));
   else{status(key,'Pendiente de sincronizar');readRoom(key,roomId);}
   return;
  }
  if(!match?.owner||match.owner!==account()){status(key,'Inicia sesión para puntuar');return;}
  const prior=read(key,null);
  if(prior?.message){status(key,prior.message);return;}
  const job=prior||{...match,state:evidence(game,state)};
  if(!prior){try{localStorage.setItem(key,JSON.stringify(job))}catch{/* Attempt the network even when browser storage is full. */}}
  status(key,'Pendiente de sincronizar');submit(key,job);
 };
}
