import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createHandler} from '../supabase/functions/coco-chess/handler.mjs';
import {madridDay} from '../supabase/functions/coco-chess/daily.mjs';
import {Chess} from '../games/ajedrez/vendor/chess.mjs';
const user=randomUUID(),other=randomUUID();
function fixture(){
 const rows=[],scores=[];let clock=Date.parse('2026-11-01T20:00:00Z');
 const db={from(table){assert.equal(table,'coco_chess_daily');let insert=null,filters=[];
  const q={upsert(row){insert=row;return q},select(){return q},eq(k,v){filters.push(r=>r[k]===v);return q},maybeSingle(){return q},then(ok,bad){return Promise.resolve().then(()=>{
   if(insert&&!rows.some(r=>r.user_id===insert.user_id&&r.day===insert.day))rows.push({id:randomUUID(),status:'active',pgn:'',result:'*',version:0,points:null,...insert});
   return {data:structuredClone(rows.find(r=>filters.every(f=>f(r)))||null)};
  }).then(ok,bad)}};return q;
 },async rpc(name,p){assert.equal(name,'coco_chess_daily_commit');const r=rows.find(r=>r.id===p.p_id&&r.user_id===p.p_user);if(!r||r.version!==p.p_version||r.status!=='active'||r.day!==madridDay(clock))return {data:null};
  Object.assign(r,{pgn:p.p_pgn,result:p.p_result,end_reason:p.p_reason,version:r.version+1});if(p.p_result!=='*'){r.status='finished';r.points={'1-0':100,'1/2-1/2':50,'0-1':0}[p.p_result];scores.push({user:r.user_id,day:r.day,points:r.points})}return {data:structuredClone(r)};
 }};
 const auth={getUser:async token=>({data:{user:token===user||token===other?{id:token}:token==='anonymous'?{id:user,is_anonymous:true}:null}})};
 const handler=createHandler({db,auth,now:()=>clock});
 async function call(action,body={},uid=user){const res=await handler(new Request('https://test/coco-chess',{method:'POST',headers:{Origin:'https://cocoenforma.com',Authorization:'Bearer '+uid},body:JSON.stringify({action,...body})}));return {status:res.status,...await res.json()}}
 return {rows,scores,call,setClock:value=>{clock=Date.parse(value)}};
}
test('Madrid day follows midnight and DST independently of the browser clock',()=>{
 assert.equal(madridDay(Date.parse('2026-11-01T22:59:59Z')),'2026-11-01');assert.equal(madridDay(Date.parse('2026-11-01T23:00:00Z')),'2026-11-02');assert.equal(madridDay(Date.parse('2026-07-01T22:00:00Z')),'2026-07-02');
});
test('daily requires registered auth, starts once, and never reveals another account',async()=>{
 const f=fixture();assert.equal((await f.call('daily_get',{},'anonymous')).status,401);assert.equal((await f.call('daily_get')).daily,null);
 const [a,b]=await Promise.all([f.call('daily_start'),f.call('daily_start')]);assert.equal(a.daily.id,b.daily.id);assert.equal(f.rows.length,1);assert.equal((await f.call('daily_get',{},other)).daily,null);
 assert.equal((await f.call('daily_move',{id:a.daily.id,version:0,from:'e2',to:'e4'},other)).status,410);
});
test('daily validates moves, ignores forged points and PGN, and protects concurrent moves',async()=>{
 const f=fixture();const {daily}=await f.call('daily_start');const base={id:daily.id,version:0};
 assert.equal((await f.call('daily_move',{...base,from:'e2',to:'e5'})).status,400);
 const moves=await Promise.all([f.call('daily_move',{...base,from:'e2',to:'e4',points:100,pgn:'fake',result:'1-0'}),f.call('daily_move',{...base,from:'d2',to:'d4'})]);assert.deepEqual(moves.map(r=>r.status).sort(),[200,409]);
 const active=moves.find(r=>r.status===200).daily,g=new Chess();g.loadPgn(active.pgn);assert.equal(g.history().length,2);assert.equal(g.turn(),'w');assert.equal(active.points,null);assert.equal(f.scores.length,0);
 assert.equal((await f.call('daily_get')).daily.pgn,active.pgn);
});
test('resigning scores zero once; finished matches cannot restart or be resubmitted',async()=>{
 const f=fixture();const {daily}=await f.call('daily_start');const a=await f.call('daily_resign',{id:daily.id,version:0});assert.equal(a.daily.points,0);assert.equal(f.scores.length,1);
 assert.equal((await f.call('daily_resign',{id:daily.id,version:1})).status,409);assert.equal((await f.call('daily_start')).daily.id,daily.id);assert.equal(f.scores.length,1);
});
test('server records checkmate as 100 and stalemate as 50 without a client score',async()=>{
 for(const [fen,from,to,points] of [['7k/5Q2/6K1/8/8/8/8/8 w - - 0 1','f7','g7',100],['7k/5Q2/6K1/8/8/8/8/8 w - - 0 1','f7','e6',50]]){
  const f=fixture();const {daily}=await f.call('daily_start');f.rows[0].pgn=new Chess(fen).pgn();const result=await f.call('daily_move',{id:daily.id,version:0,from,to});assert.equal(result.status,200);assert.equal(result.daily.points,points);assert.equal(f.scores.length,1);
 }
});
test('a new Madrid day creates a new match and cannot finish the expired one',async()=>{
 const f=fixture();const {daily}=await f.call('daily_start');f.setClock('2026-11-01T23:00:00Z');assert.equal((await f.call('daily_get')).daily,null);assert.equal((await f.call('daily_resign',{id:daily.id,version:0})).status,410);const next=await f.call('daily_start');assert.notEqual(next.daily.id,daily.id);assert.equal(next.day,'2026-11-02');assert.equal(f.scores.length,0);
});
