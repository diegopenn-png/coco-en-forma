import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createHandler} from '../supabase/functions/coco-city/handler.mjs';

const white='11111111-1111-4111-8111-111111111111',black='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333';
function fixture(){
 const rows=[];let seq=0;
 const db={from(table){
  let op='select',payload,filters=[],single=false,head=false,count=false,max=Infinity;
  const q={select(fields,opts={}){head=opts.head;count=opts.count;return q},insert(value){op='insert';payload=value;return q},update(value){op='update';payload=value;return q},eq(k,v){filters.push(r=>r[k]===v);return q},is(k,v){return q.eq(k,v)},gt(k,v){filters.push(r=>r[k]>v);return q},in(k,v){filters.push(r=>v.includes(r[k]));return q},contains(k,v){filters.push(r=>v.every(x=>r[k].includes(x)));return q},or(filter){const parts=filter.split(',').map(x=>x.split('.'));filters.push(r=>parts.some(([k,,v])=>r[k]===v));return q},order(){return q},limit(n){max=n;return q},maybeSingle(){single=true;return q},single(){single=true;return q},then(resolve,reject){return Promise.resolve().then(()=>{
   if(table==='perfiles')return {data:{apodo:'Jugador '+(++seq)},error:null};
   if(op==='insert'){rows.push({id:randomUUID(),black_user:null,black_name:null,status:'waiting',pgn:'',result:'*',end_reason:'',version:0,draw_offer:null,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),expires_at:new Date(Date.now()+30*86400000).toISOString(),...payload});return {data:structuredClone(rows.at(-1)),error:null}}
   const found=rows.filter(r=>filters.every(f=>f(r))).slice(0,max);if(op==='update')found.forEach(r=>Object.assign(r,payload));return {data:head?null:structuredClone(single?found[0]||null:found),count:count?found.length:null,error:null};
  }).then(resolve,reject)}};return q;
 }};
 const users=Array.from({length:7},(_,i)=>(i+1).toString().repeat(8)+'-'+(i+1).toString().repeat(4)+'-4'+(i+1).toString().repeat(3)+'-8'+(i+1).toString().repeat(3)+'-'+(i+1).toString().repeat(12));
 const auth={getUser:async token=>({data:{user:users.includes(token)?{id:token}:token==='anonymous'?{id:other,is_anonymous:true}:null}})};
 const handler=createHandler({db,auth,rng:()=>0});
 async function call(user,action,body={},origin='https://cocoenforma.com'){
  const response=await handler(new Request('https://test/functions/v1/coco-city',{method:'POST',headers:{Origin:origin,...(user?{Authorization:'Bearer '+user}:{}),'Content-Type':'application/json'},body:JSON.stringify({action,...body})}));return {status:response.status,...await response.json()};
 }
 return {rows,call,users};
}

test('registered membership, six-player capacity and participant-only API reads',async()=>{const f=fixture(),u=f.users;assert.equal((await f.call(null,'list')).status,401);assert.equal((await f.call('anonymous','create')).status,401);assert.equal((await f.call(u[0],'create',{},'https://evil.example')).status,403);let {room}=await f.call(u[0],'create');assert.equal((await f.call(u[6],'get',{id:room.id})).status,404);assert.deepEqual((await f.call(u[6],'list')).rooms,[]);for(let i=1;i<6;i++){const r=await f.call(u[i],'join',{code:room.invite_code});assert.equal(r.status,200);room=r.room;}assert.equal(room.members.length,6);assert.equal((await f.call(u[6],'join',{code:room.invite_code})).status,409);assert.equal((await f.call(u[1],'start',{id:room.id,version:room.version})).status,409);});
test('concurrent joins and rolls accept only one version; client cannot choose dice or funds',async()=>{const f=fixture(),u=f.users;let {room}=await f.call(u[0],'create');const joined=await Promise.all([f.call(u[1],'join',{code:room.invite_code}),f.call(u[2],'join',{code:room.invite_code})]);assert.deepEqual(joined.map(x=>x.status).sort(),[200,409]);room=joined.find(x=>x.status===200).room;room=(await f.call(u[0],'start',{id:room.id,version:room.version})).room;const rolls=await Promise.all([f.call(u[0],'roll',{id:room.id,version:room.version,value:6,money:999999}),f.call(u[0],'roll',{id:room.id,version:room.version})]);assert.deepEqual(rolls.map(x=>x.status).sort(),[200,409]);room=rolls.find(x=>x.status===200).room;assert.equal(room.state.lastRoll.value,1);assert.equal(room.state.players[0].money,1500);assert.equal((await f.call(u[0],'roll',{id:room.id,version:room.version})).status,409);assert.equal((await f.call(u[0],'timeout',{id:room.id,version:room.version})).status,409);f.rows[0].deadline='2000-01-01T00:00:00Z';assert.equal((await f.call(u[0],'timeout',{id:room.id,version:room.version})).status,200);});
