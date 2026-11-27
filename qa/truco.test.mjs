import test from 'node:test';
import assert from 'node:assert/strict';
import {actor,bot,deck,envido,handWinner,legal,move,newMatch,strength,view} from '../games/truco/engine.mjs';
import {messages} from '../games/truco/locale.mjs';
import {guideCopy} from '../games/truco/guide-copy.mjs';
import {readFileSync} from 'node:fs';
const names=n=>Array.from({length:n},(_,i)=>'Seat '+(i+1));
function random(seed){return ()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);}
test('the 40-card deck, exceptions and envido values',()=>{
 assert.equal(new Set(deck).size,40);
 const order=['4-copas','5-bastos','6-espadas','7-copas','10-copas','11-espadas','12-oros','1-copas','2-copas','3-oros','7-oros','7-espadas','1-bastos','1-espadas'];
 assert.deepEqual(order.map(strength),Array.from({length:14},(_,i)=>i));
 assert.equal(envido(['6-oros','7-oros','12-copas']),33);
 assert.equal(envido(['11-oros','10-oros','12-oros']),20);
 assert.equal(envido(['10-bastos','3-copas','6-oros']),6);
});
test('pardas respect the first won trick and triple ties respect mano',()=>{
 for(const t of [0,1]){assert.equal(handWinner([t,-1],1-t),t);assert.equal(handWinner([-1,t],1-t),t);
 assert.equal(handWinner([t,1-t,-1],1-t),t);assert.equal(handWinner([-1,-1,-1],t),t);}
});
test('interrupted truco, envido escalation, refusal and the right to raise',()=>{
 const g=newMatch(names(4),30,()=>0);
 move(g,0,'truco');move(g,1,'envido');move(g,2,'envido');move(g,3,'real');move(g,0,'falta');move(g,1,'decline');
 assert.deepEqual(g.scores,[7,0]);assert.equal(g.pending.last,'truco');assert.equal(actor(g),1);
 move(g,1,'retruco');move(g,2,'cuatro');move(g,3,'decline');assert.deepEqual(g.scores,[10,0]);
});
test('an accepted falta settles a match before a suspended call and ties go to mano',()=>{
 const g=newMatch(names(2),15,()=>0);g.original=[['6-oros','7-oros','1-copas'],['6-copas','7-copas','1-oros']];
 move(g,0,'truco');move(g,1,'falta');move(g,0,'accept');assert.equal(g.phase,'finished');assert.equal(g.matchWinner,0);assert.equal(g.pending,null);
});
test('a folded partner leaves the remaining team in play, including the next raise',()=>{
 const g=newMatch(names(4),15,()=>0);
 move(g,0,'fold');assert.equal(g.phase,'play');assert.equal(actor(g),1);assert.deepEqual(legal(g,0),[]);
 move(g,1,'truco');move(g,2,'accept');move(g,1,g.hands[1][0]);move(g,2,g.hands[2][0]);move(g,3,g.hands[3][0]);
 assert.equal(g.tricks.length,1);assert.notEqual(actor(g),0);
});
test('complete random and bot matches on every table size, both targets, private views',()=>{
 for(const n of [2,4,6]) for(const target of [15,30]) for(let seed=0;seed<50;seed++){
 const rng=random(seed+target+n),g=newMatch(names(n),target,rng);let i=0;
 while(g.phase!=='finished'&&++i<3000){
   const s=actor(g),v=view(g,s);
   assert.ok(!('original'in v)&&!('hands'in v));assert.equal(v.cards.length,g.hands[s].length);
   const action=g.phase==='between'?'next':rng()<.18?v.options[Math.floor(rng()*v.options.length)]:bot(v,rng);
   move(g,s,action,rng);
 }
 assert.equal(g.phase,'finished');assert.ok(g.scores[g.matchWinner]>=g.goal);
 }
});
test('all 15 locales have menu, guide and card names; the share route is catalogued and cacheable',()=>{
 const keys=Object.keys(messages.es).sort();assert.equal(Object.keys(messages).length,15);
 for(const [tag,loc] of Object.entries(messages)){
   assert.deepEqual(Object.keys(loc).sort(),keys);assert.ok(Object.values(loc).every(Boolean));assert.ok(guideCopy[tag].inviteHelp);
   if(tag!=='es'){const pack=JSON.parse(readFileSync(new URL('../i18n/truco/'+tag+'.json',import.meta.url)));
   assert.equal(pack.strings[messages.es.title],loc.title);assert.equal(pack.strings[guideCopy.es.qFriends],guideCopy[tag].qFriends);}
 }
 const file=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
 assert.match(file('juegos/index.html'),/href="\/juego\/truco\/"/);assert.match(file('juego/truco/index.html'),/data-play href="\/games\/truco\/"/);
 assert.match(file('sw.js'),/\.\/games\/truco\/online.mjs/);
});

test('played cards stay in their trick and seat until the next deal',()=>{
 for(const n of [2,4,6]){
  const g=newMatch(names(n),30,random(n)),laid=[];
  while(g.phase==='play'){
   const seat=actor(g),card=g.hands[seat][0];laid.push({seat,card,trick:g.tricks.length});move(g,seat,card);
   assert.deepEqual(view(g,0).played,laid);
  }
  assert.ok(laid.length>=2*n);move(g,0,'next');assert.deepEqual(view(g,0).played,[]);
 }
});
test('accepted envido announces every count in seat order, while refused envido keeps totals private',()=>{
 for(const choice of ['accept','decline']){
  const g=newMatch(names(4),15,()=>0);
  move(g,0,'envido');assert.deepEqual(view(g,1).envidoCalls,[]);
  move(g,1,choice);const v=view(g,2);
  assert.deepEqual(v.envidoCalls,choice==='accept'?g.original.map((cards,seat)=>({seat,score:envido(cards)})):[]);
  assert.deepEqual(v.played,[]);assert(!('original' in v));
 }
});
test('legacy hands recover only publicly played cards across a resumed trick',()=>{
 const g=newMatch(names(2),15,()=>0),laid=[];
 for(let i=0;i<3;i++){const s=actor(g),card=g.hands[s][0];laid.push(card);move(g,s,card);}
 delete g.played;assert.deepEqual(view(g,0).played.map(p=>p.card).sort(),laid.sort());
 const s=actor(g),card=g.hands[s][0];move(g,s,card);assert.equal(view(g,0).played.length,4);
});

test('the opening seat rotates even if the same team keeps winning',()=>{
 for(const size of [2,4,6]){
  const rng=random(53+size),g=newMatch(names(size),30,rng),first=g.mano;
  for(let i=0;i<=size;i++){
   const leader=(first+i)%size,other=(leader+1)%size;
   assert.equal(g.mano,leader);assert.equal(actor(g),leader);assert.equal(g.lead,leader);
   assert.ok(legal(g,leader).includes('envido'));assert.deepEqual(legal(g,other),[]);
   if(leader%2)move(g,leader,g.hands[leader][0]);
   move(g,actor(g),'truco');move(g,actor(g),'decline');
   assert.equal(g.handWinner,0);move(g,other,'next',rng);
  }
 }
});
test('Coco opens with envido for any suited pair, leaving the lead intact after the answer',()=>{
 for(const [cards,points] of [
  [['10-copas','12-copas','1-espadas'],20],
  [['4-bastos','1-bastos','3-oros'],25],
  [['7-oros','6-oros','3-oros'],33],
  [['7-copas','4-espadas','2-oros'],7]
 ]){
  const g=newMatch(['Diego','Coco'],15,()=>.51);
  g.hands[1]=cards.slice();g.original[1]=cards.slice();
  assert.equal(actor(g),1);assert.equal(view(g,1).myEnvido,points);
  for(const r of [0,.5,.99]){
   const decision=bot(view(g,1),()=>r);
   if(points>=20)assert.equal(decision,'envido');else assert.notEqual(decision,'envido');
  }
  if(points>=20){
   move(g,1,'envido');assert.equal(actor(g),0);assert.deepEqual(g.table,[]);
   move(g,0,'accept');assert.equal(actor(g),1);
   assert.deepEqual(view(g,0).envidoCalls.map(x=>x.seat),[1,0]);
  }
 }
});
