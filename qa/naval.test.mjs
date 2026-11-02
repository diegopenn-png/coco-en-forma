import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../games/naval/engine.mjs';
function ready(){let s=E.addPlayer(E.newGame('a','Ana'),'b','Beto');s=E.lockFleet(s,'a',E.randomFleet());return E.lockFleet(s,'b',E.randomFleet(),()=>0);}
test('1000 generated fleets have five legal straight ships, 17 unique cells, including deterministic RNG',()=>{
 for(let i=0;i<1000;i++){const f=E.validateFleet(E.randomFleet(i?Math.random:()=>0));assert.equal(new Set(f.flatMap(s=>s.cells)).size,17);}
 const f=E.randomFleet();f[0].cells=[8,9,10,11,12];assert.throws(()=>E.validateFleet(f));
 assert.deepEqual(E.cellsFor(99,2),[]);assert.deepEqual(E.cellsFor(90,2,true),[]);
 assert.throws(()=>E.placeShip([{id:'carrier',cells:[0,1,2,3,4]}],'patrol',3));
});
test('immutable rules enforce readiness, alternating turns, unique shots, and hidden fleets',()=>{
 let s=ready(),before=structuredClone(s);const target=s.players[1].fleet[0].cells[0];s=E.fire(s,'a',target);
 assert.deepEqual(before.players[0].shots,[]);assert.equal(s.turn,'b');assert.equal(s.last.kind,'hit');
 assert.throws(()=>E.fire(s,'a',1));assert.throws(()=>E.lockFleet(s,'a',E.randomFleet()));
 let v=E.viewFor(s,'a');assert.equal(v.opponent.fleet,null);assert.deepEqual(v.opponent.sunk,[]);assert.equal('ship' in v.last,false);assert.equal('players' in v,false);
 assert.throws(()=>E.viewFor(s,'outsider'));s=E.fire(s,'b',0);assert.throws(()=>E.fire(s,'a',target));assert.throws(()=>E.fire(s,'a','7'));
 assert.equal(E.resign(s,'b').winner,'a');assert.equal(E.viewFor(E.resign(s,'b'),'a').opponent.fleet.length,5);
});
test('all three bots finish 60 complete games legally using only public shot histories',()=>{
 for(const difficulty of ['easy','normal','hard'])for(let n=0;n<20;n++){
  let s=ready(),turns=0;
  while(s.phase==='battle'){
   const p=s.players.find(p=>p.id===s.turn),cell=E.chooseShot(p.shots,difficulty);
   assert(!p.shots.some(s=>s.cell===cell));s=E.fire(s,p.id,cell);assert(++turns<=199);
   if(s.phase==='battle')for(const p of s.players)assert.equal(E.viewFor(s,p.id).opponent.fleet,null);
  }
  const winner=s.players.find(p=>p.id===s.winner);assert.equal(winner.shots.filter(s=>s.kind==='sunk').length,5);assert.equal(winner.shots.filter(s=>s.kind!=='miss').length,17);
 }
});
