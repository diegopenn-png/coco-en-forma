// The same rules run locally and on the authoritative online table.
export const suits = ['oros', 'copas', 'espadas', 'bastos'];
const values = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
export const deck = suits.flatMap(suit => values.map(value => value + '-' + suit));
export const calls = {truco:'Truco', retruco:'Retruco', cuatro:'Vale cuatro', envido:'Envido', real:'Real envido', falta:'Falta envido'};
const envites = ['envido','real','falta'];
const raises = ['truco','retruco','cuatro'];
const valueOf = card => Number(card.split('-')[0]);
export function strength(card) {
  const specials = ['7-oros', '7-espadas', '1-bastos', '1-espadas'];
  const special = specials.indexOf(card);
  return special >= 0 ? 10 + special : [4,5,6,7,10,11,12,1,2,3].indexOf(valueOf(card));
}
export function envido(cards) {
  const groups = suits.map(suit => cards.filter(c => c.endsWith('-'+suit))
    .map(c => valueOf(c) < 10 ? valueOf(c) : 0).sort((a,b)=>b-a));
  return Math.max(...groups.map(g => g.length < 2 ? (g[0] || 0) : 20+g[0]+g[1]));
}
function deal(game, random) {
  const shuffled = deck.slice();
  for (let i=shuffled.length-1; i>0; i--) {
    const j = Math.floor(random()*(i+1));
    [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
  }
  const n=game.names.length;
  game.hands=game.names.map((_,i)=>[shuffled[i],shuffled[i+n],shuffled[i+n*2]]);
  game.original=game.hands.map(cards=>cards.slice());
  Object.assign(game,{phase:'play',folded:[],turn:game.mano,lead:game.mano,stake:1,raiseTeam:null,
    envDone:false,pending:null,suspended:null,tricks:[],table:[],lastTable:[],events:[],handWinner:null});
}
export function newMatch(names,goal=15,random=Math.random) {
  if (![2,4,6].includes(names.length)||![15,30].includes(goal)) throw Error('settings');
  const g={names:names.slice(),goal,scores:[0,0],mano:Math.floor(random()*names.length),handNo:1};
  deal(g,random); return g;
}
const advance=(g,seat)=>(seat+1)%g.names.length;
export function actor(g) {return g.pending?.answer ?? g.turn;}
function canEnv(g,s) {
  return g.folded.length===0 && !g.envDone && !g.tricks.length && g.stake===1 && g.hands[s].length===3;
}
export function legal(g,s) {
  g.folded??=[];
  if(g.phase==='between') return ['next'];
  if(g.phase!=='play'||g.folded.includes(s)||s!==actor(g)) return [];
  const p=g.pending;
  if(p?.kind==='env') {
    const choices=['accept','decline'];
    if(p.last==='envido' && p.total===2) choices.push('envido');
    if(p.last==='envido') choices.push('real');
    if(p.last!=='falta') choices.push('falta');
    return choices;
  }
  if(p) {
    const opts=['accept','decline'];
    if(p.level<4) opts.push(raises[p.level-1]);
    if(p.level===2 && canEnv(g,s)) opts.push(...envites);
    return opts;
  }
  const opts=[...g.hands[s],'fold'];
  if(g.stake<4 && (g.raiseTeam===null||g.raiseTeam===s%2)) opts.push(raises[g.stake-1]);
  if(canEnv(g,s)) opts.push(...envites);
  return opts;
}
function record(g,event) {g.events.push(event);}
function award(g,team,points) {
  g.scores[team]+=points;
  if(g.scores[team]>=g.goal){g.phase='finished';g.matchWinner=team;g.pending=null;g.suspended=null;}
}
function endHand(g,team,points=g.stake) {
  g.handWinner=team;g.phase='between';g.pending=null;g.suspended=null;
  record(g,{type:'award',team,points});award(g,team,points);
}
export function handWinner(tricks,manoTeam) {
  const [one,two,three]=tricks;
  if(tricks.length<2) return null;
  if(one===two && one!==-1)return one;
  if(one===-1 && two!==-1)return two;
  if(two===-1 && one!==-1)return one;
  if(tricks.length<3)return null;
  return three!==-1 ? three : one!==-1 ? one : manoTeam;
}
function nextSeat(g,s,eligible) {
  for(let offset=1;offset<=g.names.length;offset++){
    const candidate=(s+offset)%g.names.length;
    if(!g.folded.includes(candidate)&&eligible(candidate))return candidate;
  }
  return null;
}
function finishTurn(g,s) {
  const next=nextSeat(g,s,i=>!g.table.some(play=>play.seat===i));
  if(next!==null){g.turn=next;return;}
  const max=Math.max(...g.table.map(x=>strength(x.card)));
  const best=g.table.filter(x=>strength(x.card)===max);
  const winner=best.every(x=>x.seat%2===best[0].seat%2) ? best[0].seat%2 : -1;
  g.tricks.push(winner);g.lastTable=g.table;g.table=[];
  record(g,{type:'trick',team:winner});
  const result=handWinner(g.tricks,g.mano%2);
  if(result!==null)endHand(g,result);
  else {
    if(winner!==-1)g.lead=best[0].seat;
    else if(g.folded.includes(g.lead))g.lead=nextSeat(g,g.lead,()=>true);
    g.turn=g.lead;
  }
}
function envWinner(g) {
  let best=-1,winner=g.mano;
  for(let i=0;i<g.names.length;i++) {
    const s=(g.mano+i)%g.names.length,score=envido(g.original[s]);
    if(score>best){best=score;winner=s;}
  }
  return {seat:winner,score:best};
}
function faltaValue(g) {
  const top=Math.max(...g.scores);
  return (g.goal===30&&top<15?15:g.goal)-top;
}
function respond(g,s,choice) {
  const p=g.pending;g.pending=null;
  if(p.kind==='truco'){
    if(choice==='decline')endHand(g,p.by%2,g.stake);
    else {g.stake=p.level;g.raiseTeam=s%2;g.envDone=true;}
    return;
  }
  const winner=choice==='accept'?envWinner(g):{seat:p.by};
  const points=choice==='decline' ? p.refused : p.last==='falta' ? faltaValue(g) : p.total;
  record(g,{type:'envResult',seat:winner.seat,points,score:winner.score});
  g.envDone=true;g.pending=g.suspended;g.suspended=null;award(g,winner.seat%2,points);
}
export function move(g,s,action,random=Math.random) {
  if(!Number.isInteger(s)||s<0||s>=g.names.length||!legal(g,s).includes(action))throw Error('stale');
  if(action==='next'){
    g.mano=advance(g,g.mano);g.handNo++;deal(g,random);return;
  }
  if(deck.includes(action)){g.hands[s].splice(g.hands[s].indexOf(action),1);g.table.push({seat:s,card:action});finishTurn(g,s);return;}
  record(g,{type:'action',seat:s,action});
  if(action==='fold'){
    const unopened=!g.envDone && g.table.length===0 && !g.tricks.length && g.stake===1;
    g.folded.push(s);
    if(nextSeat(g,s,i=>i%2===s%2)===null)endHand(g,1-s%2,g.stake+(unopened?1:0));
    else finishTurn(g,s);
    return;
  }
  if(action==='accept'||action==='decline'){respond(g,s,action);return;}
  if(raises.includes(action)){
    const level=raises.indexOf(action)+2;
    if(g.pending){g.stake=g.pending.level;g.envDone=true;}
    g.pending={kind:'truco',by:s,answer:nextSeat(g,s,i=>i%2!==s%2),level,last:action};return;
  }
  if(g.pending?.kind==='truco')g.suspended=g.pending;
  const previous=g.pending?.kind==='env'?g.pending.total:0;
  g.pending={kind:'env',by:s,answer:nextSeat(g,s,i=>i%2!==s%2),last:action,refused:previous||1,
    total:previous+(action==='envido'?2:action==='real'?3:0)};
}
export function view(g,s) {
  const {hands,original,...publicGame}=g;
  return {...publicGame,seat:s,cards:hands[s].slice(),counts:hands.map(h=>h.length),
    myEnvido:envido(original[s]),options:legal(g,s)};
}
export function bot(v,random=Math.random) {
  const options=v.options,highest=Math.max(...v.cards.map(strength)),r=random();
  if(v.pending?.kind==='env'){
    if(v.myEnvido>=31 && options.includes('real') && r<0.45)return 'real';
    return v.myEnvido>=(v.pending.last==='falta'?29:24)||r<0.17?'accept':'decline';
  }
  if(v.pending) {
    if(options.includes('envido')&&v.myEnvido>=27)return 'envido';
    const raise=raises.find(x=>options.includes(x));
    if(raise&&highest>=11&&r<0.35)return raise;
    return highest>=5||r<0.32?'accept':'decline';
  }
  if(options.includes('envido')&&(v.myEnvido>=26||r<0.09))return 'envido';
  const raise=raises.find(x=>options.includes(x));
  if(raise&&((highest>=9&&r<0.55)||r<0.04))return raise;
  const sorted=v.cards.slice().sort((a,b)=>strength(a)-strength(b));
  if(!v.table.length)return sorted[r<0.5?sorted.length-1:0];
  const best=v.table.reduce((a,b)=>strength(a.card)>=strength(b.card)?a:b);
  const good=v.table.filter(x=>strength(x.card)===strength(best.card));
  if(good.every(x=>x.seat%2===v.seat%2))return sorted[0];
  return sorted.find(c=>strength(c)>strength(best.card))||sorted[0];
}
