import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createHandler} from '../supabase/functions/coco-chess/handler.mjs';
import {Chess} from '../games/ajedrez/vendor/chess.mjs';
const white='11111111-1111-4111-8111-111111111111',black='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333';
function fixture(){
 const rows=[];let seq=0;
 const db={from(table){
  let op='select',payload,filters=[],single=false,head=false,count=false,max=Infinity;
  const q={select(fields,opts={}){head=opts.head;count=opts.count;return q},insert(value){op='insert';payload=value;return q},update(value){op='update';payload=value;return q},eq(k,v){filters.push(r=>r[k]===v);return q},is(k,v){return q.eq(k,v)},gt(k,v){filters.push(r=>r[k]>v);return q},in(k,v){filters.push(r=>v.includes(r[k]));return q},or(filter){const parts=filter.split(',').map(x=>x.split('.'));filters.push(r=>parts.some(([k,,v])=>r[k]===v));return q},order(){return q},limit(n){max=n;return q},maybeSingle(){single=true;return q},single(){single=true;return q},then(resolve,reject){return Promise.resolve().then(()=>{
   if(table==='perfiles')return {data:{apodo:'Jugador '+(++seq)},error:null};
   if(op==='insert'){rows.push({id:randomUUID(),black_user:null,black_name:null,status:'waiting',pgn:'',result:'*',end_reason:'',version:0,draw_offer:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),expires_at:new Date(Date.now()+30*86400000).toISOString(),...payload});return {data:structuredClone(rows.at(-1)),error:null}}
   const found=rows.filter(r=>filters.every(f=>f(r))).slice(0,max);if(op==='update')found.forEach(r=>Object.assign(r,payload));return {data:head?null:structuredClone(single?found[0]||null:found),count:count?found.length:null,error:null};
  }).then(resolve,reject)}};return q;
 }};
 const auth={getUser:async token=>({data:{user:[white,black,other].includes(token)?{id:token}:token==='anonymous'?{id:other,is_anonymous:true}:null}})};
 const handler=createHandler({db,auth});
 async function call(user,action,body={},origin='https://cocoenforma.com'){
  const response=await handler(new Request('https://test/functions/v1/coco-chess',{method:'POST',headers:{Origin:origin,...(user?{Authorization:'Bearer '+user}:{}),'Content-Type':'application/json'},body:JSON.stringify({action,...body})}));return {status:response.status,...await response.json()};
 }
 return {rows,call};
}
async function started(f){const {room}=await f.call(white,'create');const joined=await f.call(black,'join',{code:room.invite_code});return joined.room}
test('rooms require registered auth and reject disallowed origins',async()=>{
 const f=fixture();assert.equal((await f.call(null,'list')).status,401);assert.equal((await f.call('anonymous','create')).status,401);assert.equal((await f.call(white,'create',{},'https://evil.example')).status,403);assert.equal(f.rows.length,0);
});
test('private invite supports exactly two distinct registered players',async()=>{
 const f=fixture();const created=await f.call(white,'create');assert.equal(created.status,200);assert.equal((await f.call(white,'create')).room.id,created.room.id);
 const self=await f.call(white,'join',{code:created.room.invite_code});assert.equal(self.room.status,'waiting');
 const joined=await f.call(black,'join',{code:created.room.invite_code.toLowerCase()});assert.equal(joined.room.status,'active');
 assert.equal((await f.call(other,'join',{code:created.room.invite_code})).status,409);assert.equal((await f.call(other,'get',{id:created.room.id})).status,404);assert.deepEqual((await f.call(other,'list')).rooms,[]);
});
test('server rejects forged positions, illegal moves, opponent moves and stale retries',async()=>{
 const f=fixture();let room=await started(f);
 assert.equal((await f.call(black,'move',{id:room.id,version:room.version,from:'e7',to:'e5'})).status,409);
 assert.equal((await f.call(white,'move',{id:room.id,version:room.version,from:'e2',to:'e5',pgn:'fake'})).status,400);
 const move=await f.call(white,'move',{id:room.id,version:room.version,from:'e2',to:'e4',pgn:'fake',white_user:other});assert.equal(move.status,200);assert.match(move.room.pgn,/1\. e4/);assert.equal(move.room.white_user,white);
 assert.equal((await f.call(white,'move',{id:room.id,version:room.version,from:'d2',to:'d4'})).status,409);
 room=move.room;assert.equal((await f.call(black,'move',{id:room.id,version:room.version,from:'e7',to:'e5'})).status,200);
});
test('simultaneous joins and moves accept only one version',async()=>{
 const f=fixture();const {room}=await f.call(white,'create');
 const joins=await Promise.all([f.call(black,'join',{code:room.invite_code}),f.call(other,'join',{code:room.invite_code})]);assert.deepEqual(joins.map(x=>x.status).sort(),[200,409]);
 const live=joins.find(x=>x.status===200).room;
 const moves=await Promise.all([f.call(white,'move',{id:live.id,version:live.version,from:'e2',to:'e4'}),f.call(white,'move',{id:live.id,version:live.version,from:'d2',to:'d4'})]);assert.deepEqual(moves.map(x=>x.status).sort(),[200,409]);
});
test('checkmate finishes the server game and prevents subsequent moves',async()=>{
 const f=fixture();let room=await started(f);
 for(const [who,from,to] of [[white,'f2','f3'],[black,'e7','e5'],[white,'g2','g4'],[black,'d8','h4']]){const response=await f.call(who,'move',{id:room.id,version:room.version,from,to});assert.equal(response.status,200);room=response.room}
 assert.equal(room.status,'finished');assert.equal(room.result,'0-1');assert.match(room.end_reason,/mate/);
 assert.equal((await f.call(white,'move',{id:room.id,version:room.version,from:'a2',to:'a3'})).status,409);
});
test('draws require both players and resignation gives the other side the result',async()=>{
 const f=fixture();let room=await started(f);let offer=await f.call(white,'draw',{id:room.id,version:room.version});assert.equal(offer.room.status,'active');
 assert.equal((await f.call(white,'draw',{id:room.id,version:offer.room.version})).status,409);
 let accepted=await f.call(black,'draw',{id:room.id,version:offer.room.version});assert.equal(accepted.room.result,'1/2-1/2');
 room=await started(f);const resigned=await f.call(black,'resign',{id:room.id,version:room.version});assert.equal(resigned.room.result,'1-0');assert.equal(resigned.room.status,'finished');
});
test('expired rooms and cancelled invitations cannot be joined',async()=>{
 const f=fixture();let {room}=await f.call(white,'create');f.rows[0].expires_at='2000-01-01T00:00:00Z';assert.equal((await f.call(black,'join',{code:room.invite_code})).status,404);
 ({room}=await f.call(white,'create'));await f.call(white,'cancel',{id:room.id,version:room.version});assert.equal((await f.call(black,'join',{code:room.invite_code})).status,409);
});
