import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import worker,{ADMIN_ID} from '../src/worker.mjs';
import {digest} from '../src/parent.mjs';
const B='11111111-1111-4111-8111-111111111111';
const tokenA='a'.repeat(30),tokenB='b'.repeat(30);
function environment(){const db=new DatabaseSync(':memory:');db.exec(readFileSync(new URL('../schema.sql',import.meta.url),'utf8'));return {db,env:{SUPABASE_URL:'https://auth.test',SUPABASE_PUBLISHABLE_KEY:'test-public',DB:{prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}},async all(){return {results:db.prepare(sql).all(...args)}}}}}}}}}}
function request(path,token,body){return new Request('https://bank.test'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined})}
test('two verified users own separate state, revisions and parental guards; spoofed body cannot select another account',async()=>{
 const {db,env}=environment(),originalFetch=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://auth.test/auth/v1/user');const token=options.headers.Authorization;return Response.json({id:token==='Bearer '+tokenA?ADMIN_ID:B,email:token==='Bearer '+tokenA?'owner@example.test':'second@example.test',email_confirmed_at:'2026-01-01'})};
 try{
  for(const [token,name]of [[tokenA,'Cuenta original'],[tokenB,'Cuenta nueva']]){const response=await worker.fetch(request('/action',token,{type:'open_account',name,userId:ADMIN_ID,requestId:crypto.randomUUID()}),env);assert.equal(response.status,200);assert.equal((await response.json()).state.account.name,name)}
  for(const [token,name]of [[tokenA,'Cuenta original'],[tokenB,'Cuenta nueva']]){const response=await worker.fetch(request('/state',token),env);assert.equal((await response.json()).state.account.name,name)}
  const ticket='c'.repeat(64);db.prepare('INSERT INTO parental_guard(user_id,pin_hash,ticket_hash,ticket_expires,auth_hash) VALUES(?,?,?,?,?)').run(ADMIN_ID,'test-pin',await digest(ticket),Date.now()+60000,await digest('Bearer '+tokenA));
  const denied=await worker.fetch(request('/action',tokenB,{type:'setup',parentToken:ticket,userId:ADMIN_ID,requestId:crypto.randomUUID()}),env);assert.equal(denied.status,400);assert.match((await denied.json()).error,/PIN parental/);
  await worker.fetch(request('/action',tokenB,{type:'parent_lock'}),env);assert.equal(db.prepare('SELECT ticket_hash FROM parental_guard WHERE user_id=?').get(ADMIN_ID).ticket_hash,await digest(ticket));
  assert.equal(db.prepare('SELECT count(*) AS n FROM game_state').get().n,2);
  const absent=await worker.fetch(new Request('https://bank.test/state'),env);assert.equal(absent.status,401);
  const foreignOrigin=await worker.fetch(new Request('https://bank.test/state',{headers:{Origin:'https://evil.test'}}),env);assert.equal(foreignOrigin.status,403);
 }finally{globalThis.fetch=originalFetch;db.close()}
});
