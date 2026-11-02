import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createHandler} from '../supabase/functions/coco-naval/handler.mjs';
import {randomFleet} from '../games/naval/engine.mjs';
const users=Array.from({length:3},randomUUID);
function fixture(){
 const rows=[];let time=Date.now();
 const db={from(table){let filters=[],single=false,max=Infinity;const q={select(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},gt(k,v){filters.push(r=>r[k]>v);return q},contains(k,v){filters.push(r=>v.every(x=>r[k].includes(x)));return q},in(k,v){filters.push(r=>v.includes(r[k]));return q},order(){return q},limit(n){max=n;return q},maybeSingle(){single=true;return q},then(resolve){const matches=table==='perfiles'?[{apodo:'Capitán'}]:rows.map(r=>r.meta).filter(r=>filters.every(f=>f(r))).slice(0,max);return Promise.resolve({data:single?matches[0]||null:matches}).then(resolve)}};return q},
 async rpc(name,p){if(name==='coco_naval_load')return{data:structuredClone(rows.find(r=>p.p_id?r.meta.id===p.p_id:r.meta.invite_code===p.p_code)||null)};
 let row=rows.find(r=>r.meta.id===p.p_id);if(p.p_expected===-1){row={meta:{id:p.p_id,host_user:p.p_host,invite_code:p.p_code,version:0,expires_at:new Date(time+604800000).toISOString()},state:null};rows.push(row)}else if(!row||row.meta.version!==p.p_expected)return{data:null};else row.meta.version++;
 Object.assign(row.meta,{members:p.p_members,status:p.p_status,deadline:p.p_deadline});row.state=structuredClone(p.p_state);return{data:structuredClone(row.meta)};
 }};
 const handler=createHandler({db,auth:{getUser:async id=>({data:{user:users.includes(id)?{id}:null}})},randomUUID,rng:()=>0,now:()=>time});
 const call=async(uid,action,b={})=>{const res=await handler(new Request('https://api.test',{method:'POST',headers:{authorization:'Bearer '+uid,origin:'https://cocoenforma.com'},body:JSON.stringify({action,...b})}));return{...await res.json(),status:res.status}};
 return{call,rows,advance:()=>time+=300001};
}
test('authenticated private rooms: safe views, CAS, invalid/out-of-turn moves, no outsider access, timeout',async()=>{
 const f=fixture(),[a,b,c]=users;assert.equal((await f.call('bad','create')).status,401);
 let r=(await f.call(a,'create')).room;assert.equal((await f.call(a,'create')).room.id,r.id);
 assert.equal((await f.call(c,'get',{id:r.id})).status,404);
 r=(await f.call(b,'join',{code:r.invite_code})).room;assert.equal((await f.call(c,'join',{code:r.invite_code})).status,409);
 const fleet=randomFleet();assert.equal((await f.call(a,'ready',{id:r.id,version:r.version,fleet:[]})).status,400);
 r=(await f.call(a,'ready',{id:r.id,version:r.version,fleet})).room;
 let other=(await f.call(b,'get',{id:r.id})).room;assert.equal(other.game.opponent.fleet,null);assert.equal(other.game.opponent.ready,true);assert.equal('state' in other,false);
 r=(await f.call(b,'ready',{id:r.id,version:r.version,fleet:randomFleet()})).room;
 assert.equal((await f.call(b,'fire',{id:r.id,version:r.version,cell:1})).status,409);
 assert.equal((await f.call(a,'fire',{id:r.id,version:r.version-1,cell:1})).status,409);
 const replies=await Promise.all([f.call(a,'fire',{id:r.id,version:r.version,cell:1}),f.call(a,'fire',{id:r.id,version:r.version,cell:2})]);assert.deepEqual(replies.map(r=>r.status).sort(),[200,409]);
 r=replies.find(r=>r.status===200).room;assert.equal(r.game.opponent.fleet,null);
 assert.equal((await f.call(a,'timeout',{id:r.id,version:r.version})).status,409);f.advance();
 r=(await f.call(a,'timeout',{id:r.id,version:r.version})).room;assert.equal(r.game.winner,a);assert.equal(r.game.opponent.fleet.length,5);
 assert.equal((await f.call(c,'list')).rooms.length,0);
});
