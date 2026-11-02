// Shared rules for browser play and the authoritative online handler.
export class GameError extends Error { constructor(message,status=409){super(message);this.status=status;} }
const check=(ok,message)=>{if(!ok)throw new GameError(message)};
export const CATEGORIES=Object.freeze([
 ...Array.from({length:6},(_,i)=>({id:String(i+1),name:['Unos','Doses','Treses','Cuatros','Cincos','Seises'][i],example:Array(3).fill(i+1),help:`Suma todos los dados con ${i+1}.`})),
 {id:'straight',name:'Escalera',example:[1,2,3,4,5],help:'1–2–3–4–5 o 2–3–4–5–6. 20 puntos; 25 en la primera tirada.'},
 {id:'full',name:'Full',example:[2,2,5,5,5],help:'Tres iguales y dos iguales distintos. 30 puntos; 35 en la primera tirada.'},
 {id:'poker',name:'Póker',example:[4,4,4,4,2],help:'Al menos cuatro iguales. 40 puntos; 45 en la primera tirada.'},
 {id:'generala',name:'Generala',example:[6,6,6,6,6],help:'Cinco iguales. 50 puntos. La regla de servida se elige antes de empezar.'},
 {id:'double',name:'Doble generala',example:[3,3,3,3,3],help:'Cinco iguales después de haber anotado una generala de 50. 100 puntos.'}
]);
export function player(id,name){return {id,name:String(name||'Jugador').trim().slice(0,24)||'Jugador',scores:{}}}
export function newGame(id,name,rules={}){return {v:1,host:id,phase:'waiting',players:[player(id,name)],turn:0,round:1,rolls:0,dice:[],seq:0,rules:{servedWins:rules.servedWins!==false},log:[],results:[]}}
export const currentPlayer=s=>s.players[s.turn];
export const total=p=>Object.values(p.scores).reduce((a,b)=>a+b,0);
export function points(category,dice,rolls,scores={}){
 if(dice.length!==5||dice.some(x=>!Number.isInteger(x)||x<1||x>6)||rolls<1)return 0;
 const counts=Array.from({length:6},(_,i)=>dice.filter(x=>x===i+1).length),max=Math.max(...counts),sorted=[...dice].sort().join(''),served=rolls===1?5:0;
 if(/^[1-6]$/.test(category))return counts[+category-1]*(+category);
 if(category==='straight')return ['12345','23456'].includes(sorted)?20+served:0;
 if(category==='full')return counts.includes(3)&&counts.includes(2)?30+served:0;
 if(category==='poker')return max>=4?40+served:0;
 if(category==='generala')return max===5?50:0;
 if(category==='double')return max===5&&scores.generala===50?100:0;
 return 0;
}
export function die(rng){if(rng){const v=rng();check(v>=0&&v<1,'Tirada no válida.');return 1+Math.floor(v*6)}const a=new Uint32Array(1);do{crypto.getRandomValues(a)}while(a[0]>=4294967292);return 1+a[0]%6}
function finish(s,servedWinner=null){s.phase='finished';s.servedWinner=servedWinner;s.results=s.players.map(p=>({id:p.id,name:p.name,total:total(p)})).sort((a,b)=>b.total-a.total);s.winners=servedWinner?[servedWinner]:s.results.filter(p=>p.total===s.results[0].total).map(p=>p.id)}
function log(s,message){s.log.push(message);s.log=s.log.slice(-80)}
export function transition(input,actor,action,values={},rng){
 const s=structuredClone(input),p=currentPlayer(s);
 if(action==='start'){check(s.phase==='waiting'&&s.host===actor,'Solo el anfitrión puede empezar.');check(s.players.length>=1&&s.players.length<=6,'Entre una y seis personas.');check(new Set(s.players.map(p=>p.id)).size===s.players.length,'Los jugadores deben ser distintos.');s.phase='turn';return s}
 check(s.phase==='turn','La partida no está en curso.');check(p.id===actor,'Es el turno de otra persona.');
 if(action==='roll'){
  check(s.rolls<3,'Ya hiciste tus tres tiradas. Elige dónde anotar.');
  const held=values.held??[false,false,false,false,false];check(Array.isArray(held)&&held.length===5&&held.every(x=>typeof x==='boolean'),'Elige qué dados guardar.');check(s.rolls>0||held.every(x=>!x),'La primera tirada usa los cinco dados.');check(held.some(x=>!x),'Libera al menos un dado o anota tu jugada.');
  s.dice=held.map((keep,i)=>keep?s.dice[i]:die(rng));s.rolls++;s.seq++;
  log(s,`${p.name} · tirada ${s.rolls}: ${s.dice.join(' · ')}`);
  if(s.rules.servedWins&&s.rolls===1&&new Set(s.dice).size===1){log(s,`${p.name} consigue generala servida y gana la partida.`);finish(s,p.id)}
 }else if(action==='score'){
  check(s.rolls>0,'Tira los dados antes de anotar.');const cat=CATEGORIES.find(c=>c.id===values.category);check(cat,'Casilla no válida.');check(!Object.hasOwn(p.scores,cat.id),'Esa casilla ya está ocupada.');const n=points(cat.id,s.dice,s.rolls,p.scores);p.scores[cat.id]=n;log(s,`${p.name} anota ${n} en ${cat.name}.`);
  if(s.players.every(q=>Object.keys(q.scores).length===CATEGORIES.length))finish(s);
  else{s.turn=(s.turn+1)%s.players.length;if(s.turn===0)s.round++;s.dice=[];s.rolls=0}
 }else throw new GameError('Acción no válida.',400);
 return s;
}
// Explainable heuristic: it never sees future dice or alters their randomness.
export function advice(s){
 const p=currentPlayer(s),available=CATEGORIES.filter(c=>!Object.hasOwn(p.scores,c.id));
 const candidates=available.map(c=>({category:c.id,points:points(c.id,s.dice,s.rolls,p.scores)}));
 const weighted=x=>x.points-(x.category==='double'?20:x.category==='generala'?10:0);
 const best=[...candidates].sort((a,b)=>weighted(b)-weighted(a)||a.points-b.points)[0];
 if(s.rolls===0)return {action:'roll',held:[false,false,false,false,false],reason:'La primera tirada usa los cinco dados.'};
 if(s.rolls>=3||best.points>=25||best.category==='straight'&&best.points>0)return {action:'score',category:best.category,reason:`Puedes anotar ${best.points} en ${CATEGORIES.find(c=>c.id===best.category).name}.`};
 const counts=Array.from({length:6},(_,i)=>s.dice.filter(n=>n===i+1).length);
 let target=counts.map((n,i)=>({value:i+1,weight:n*10+(Object.hasOwn(p.scores,String(i+1))?0:5)+(i+1)/10})).sort((a,b)=>b.weight-a.weight)[0].value;
 let held=s.dice.map(n=>n===target);
 if(!Object.hasOwn(p.scores,'straight')&&Math.max(...counts)<3&&new Set(s.dice).size>=4){const run=s.dice.includes(1)?[1,2,3,4,5]:[2,3,4,5,6],seen=new Set();held=s.dice.map(n=>{const keep=run.includes(n)&&!seen.has(n);seen.add(n);return keep});}
 if(held.every(Boolean))return {action:'score',category:best.category,reason:'Ya tienes cinco iguales: elige la casilla que prefieras.'};
 return {action:'roll',held,reason:`Una opción es guardar ${held.filter(Boolean).length} dados y volver a tirar los demás. Tú decides.`};
}
export function autoAction(s){if(!s.rolls)return ['roll',{}];const a=advice({...s,rolls:3});return ['score',{category:a.category}]}
