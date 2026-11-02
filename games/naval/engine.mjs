// Pure rules shared by the browser and the authoritative online service.
export const SIZE = 10;
export const SHIPS = Object.freeze([
  {id:'carrier', name:'Portaaviones', size:5},
  {id:'cruiser', name:'Crucero', size:4},
  {id:'frigate', name:'Fragata', size:3},
  {id:'submarine', name:'Submarino', size:3},
  {id:'patrol', name:'Patrullero', size:2}
]);
export class GameError extends Error {
  constructor(message, status=409) { super(message); this.status=status; }
}
export function check(ok, message, status=409) { if(!ok) throw new GameError(message,status); }
export const coordinate = cell => String.fromCharCode(65+Math.floor(cell/SIZE))+(cell%SIZE+1);
export const validCell = n => Number.isInteger(n)&&n>=0&&n<SIZE*SIZE;
export const player = (id,name) => ({id,name:String(name||'Capitán').trim().slice(0,24)||'Capitán',fleet:null,shots:[]});
export function newGame(id,name) {
  return {v:1,phase:'waiting',players:[player(id,name)],turn:null,winner:null,reason:null,last:null};
}
export function cellsFor(start,size,vertical=false) {
  if(!validCell(start)||!Number.isInteger(size)||size<1||size>SIZE) return [];
  const row=Math.floor(start/SIZE),col=start%SIZE;
  if((vertical?row:col)+size>SIZE) return [];
  return Array.from({length:size},(_,i)=>start+i*(vertical?SIZE:1));
}
export function placeShip(fleet,id,start,vertical=false) {
  const spec=SHIPS.find(s=>s.id===id);
  check(spec,'Elige un barco válido.',400);
  const cells=cellsFor(start,spec.size,vertical),others=fleet.filter(s=>s.id!==id);
  check(cells.length===spec.size,'El barco sale del tablero. Prueba otra casilla.');
  check(!others.some(s=>s.cells.some(c=>cells.includes(c))),'Los barcos no pueden superponerse.');
  return [...others,{id,cells}];
}
export function validateFleet(fleet) {
  check(Array.isArray(fleet)&&fleet.length===SHIPS.length,'Coloca los cinco barcos.',400);
  const all=new Set();
  return SHIPS.map(spec=>{
    const found=fleet.filter(s=>s&&s.id===spec.id);
    check(found.length===1,'La flota tiene barcos repetidos o desconocidos.',400);
    const cells=found[0].cells;
    check(Array.isArray(cells)&&cells.length===spec.size&&cells.every(validCell),'Comprueba el tamaño de cada barco.',400);
    const ordered=[...cells].sort((a,b)=>a-b),vertical=ordered[1]-ordered[0]===SIZE;
    check(JSON.stringify(cellsFor(ordered[0],spec.size,vertical))===JSON.stringify(ordered),'Cada barco debe ocupar casillas seguidas en una línea.',400);
    for(const cell of ordered){check(!all.has(cell),'Los barcos no pueden superponerse.',400);all.add(cell);}
    return {id:spec.id,cells:ordered};
  });
}
export function randomFleet(rng=Math.random) {
  const shuffle=values=>{for(let i=values.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[values[i],values[j]]=[values[j],values[i]];}return values;};
  function visit(index,placed,used) {
    if(index===SHIPS.length) return placed;
    const spec=SHIPS[index],options=[];
    for(let cell=0;cell<100;cell++)for(const vertical of [false,true]){
      const cells=cellsFor(cell,spec.size,vertical);
      if(cells.length===spec.size&&!cells.some(c=>used.has(c)))options.push(cells);
    }
    for(const cells of shuffle(options)){
      const next=visit(index+1,[...placed,{id:spec.id,cells}],new Set([...used,...cells]));
      if(next)return next;
    }
    return null;
  }
  return visit(0,[],new Set());
}
export function addPlayer(input,id,name) {
  check(input.phase==='waiting'&&input.players.length===1,'La sala ya tiene dos capitanes.');
  check(!input.players.some(p=>p.id===id),'Ya estás en esta partida.');
  const s=structuredClone(input);s.players.push(player(id,name));s.phase='placement';return s;
}
export function lockFleet(input,actor,fleet,rng=Math.random) {
  check(input.phase==='placement','La colocación ya terminó.');
  const s=structuredClone(input),p=s.players.find(p=>p.id===actor);
  check(p,'No participas en esta partida.',403);check(!p.fleet,'Tu flota ya está preparada.');
  p.fleet=validateFleet(fleet);
  if(s.players.length===2&&s.players.every(p=>p.fleet)){
    s.phase='battle';s.turn=s.players[rng()<0.5?0:1].id;
  }
  return s;
}
export function fire(input,actor,cell) {
  check(input.phase==='battle','La batalla no está en curso.');
  check(input.turn===actor,'Es el turno del otro capitán.');
  check(validCell(cell),'Elige una casilla del tablero.',400);
  const s=structuredClone(input),p=s.players.find(p=>p.id===actor),enemy=s.players.find(p=>p.id!==actor);
  check(p&&enemy,'No participas en esta partida.',403);
  check(!p.shots.some(shot=>shot.cell===cell),'Ya disparaste a esa casilla.');
  const ship=enemy.fleet.find(ship=>ship.cells.includes(cell));
  const shot={cell,kind:ship?'hit':'miss'};
  if(ship&&ship.cells.every(c=>c===cell||p.shots.some(shot=>shot.cell===c))){
    shot.kind='sunk';shot.ship=ship.id;shot.cells=[...ship.cells];
  }
  p.shots.push(shot);s.last={actor,...shot};
  if(enemy.fleet.every(ship=>ship.cells.every(c=>p.shots.some(shot=>shot.cell===c)))){
    s.phase='finished';s.winner=actor;s.reason='fleet';s.turn=null;
  }else s.turn=enemy.id;
  return s;
}
export function resign(input,actor,reason='resign') {
  check(['waiting','placement','battle'].includes(input.phase),'La partida ya terminó.');
  check(input.players.some(p=>p.id===actor),'No participas en esta partida.',403);
  const s=structuredClone(input);
  s.winner=s.phase==='battle'?s.players.find(p=>p.id!==actor).id:null;
  s.phase=s.winner?'finished':'cancelled';s.turn=null;s.reason=reason;return s;
}
// Explicit allow-list: no rival placements or unsunk ship identifiers leave the server.
export function viewFor(s,actor) {
  const own=s.players.find(p=>p.id===actor),enemy=s.players.find(p=>p.id!==actor);
  check(own,'No participas en esta partida.',403);
  const sunk=(own.shots||[]).filter(shot=>shot.kind==='sunk').map(shot=>({id:shot.ship,cells:[...shot.cells]}));
  const finished=s.phase==='finished';
  return structuredClone({v:s.v,phase:s.phase,turn:s.turn,winner:s.winner,reason:s.reason,last:s.last,
    me:{id:own.id,name:own.name,ready:!!own.fleet,fleet:own.fleet,shots:own.shots},
    opponent:enemy?{id:enemy.id,name:enemy.name,ready:!!enemy.fleet,shots:enemy.shots,
      sunk,fleet:finished?enemy.fleet:null}:null});
}
// AI receives ONLY its own shot results. It cannot inspect a rival fleet.
export function chooseShot(shots,difficulty='normal',rng=Math.random) {
  const played=new Set(shots.map(s=>s.cell)),available=Array.from({length:100},(_,i)=>i).filter(c=>!played.has(c));
  check(available.length,'No quedan casillas disponibles.');
  const pick=xs=>xs[Math.min(xs.length-1,Math.floor(rng()*xs.length))];
  if(difficulty==='easy')return pick(available);
  const sunk=shots.filter(s=>s.kind==='sunk'),blocked=new Set([...shots.filter(s=>s.kind==='miss').map(s=>s.cell),...sunk.flatMap(s=>s.cells)]);
  const hits=shots.filter(s=>s.kind==='hit'&&!blocked.has(s.cell)).map(s=>s.cell);
  const adjacent=c=>[c-SIZE,c+SIZE,...(c%SIZE?[c-1]:[]),...(c%SIZE<SIZE-1?[c+1]:[])].filter(validCell);
  if(difficulty==='normal'){
    const targets=available.filter(c=>hits.some(h=>adjacent(h).includes(c)));
    return pick(targets.length?targets:available.filter(c=>(Math.floor(c/SIZE)+c%SIZE)%2===0).length?available.filter(c=>(Math.floor(c/SIZE)+c%SIZE)%2===0):available);
  }
  const remaining=SHIPS.filter(ship=>!sunk.some(s=>s.ship===ship.id)),weights=new Map(available.map(c=>[c,0]));
  for(const ship of remaining)for(let start=0;start<100;start++)for(const vertical of [false,true]){
    const cells=cellsFor(start,ship.size,vertical);
    if(cells.length!==ship.size||cells.some(c=>blocked.has(c)))continue;
    const matches=hits.filter(h=>cells.includes(h)).length;
    const weight=hits.length?(matches?25*matches*matches:0):1;
    for(const cell of cells)if(weights.has(cell))weights.set(cell,weights.get(cell)+weight);
  }
  const max=Math.max(...weights.values());
  return pick(max?available.filter(c=>weights.get(c)===max):available);
}
