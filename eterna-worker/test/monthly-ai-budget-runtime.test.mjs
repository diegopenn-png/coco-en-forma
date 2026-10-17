import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
function setup({denied=false,broken=false}={}) {
  const calls=[];
  const sandbox={console,URL,Request,Response,Headers,TextEncoder,TextDecoder,setTimeout,clearTimeout,fetch:async(url,init)=>{
    const body=JSON.parse(init.body||'{}');
    if(url.includes('/rpc/eterna_ai_budget_reserve')){calls.push('reserve'); assert.ok(body.p_reserve_eur>0);assert.equal(body.p_cap_eur,2);if(broken)return new Response('unavailable',{status:503});return Response.json([{ok:!denied,reservation_id:'test-reservation',cap_eur:2,remaining_eur:denied?0:2}]);}
    if(url.includes('/rpc/eterna_ai_budget_settle')){calls.push('settle');return Response.json([]);}
    if(url==='https://api.openai.com/v1/responses'){calls.push('openai');return Response.json({usage:{input_tokens:10,output_tokens:10},output_text:'test'});}
    throw new Error('Unexpected network request '+url);
  }};
  vm.createContext(sandbox);
  vm.runInContext(source.replace(/^import\s+[^;]+;\s*/gm,'').replace(/\nexport default\s*\{[\s\S]*?\};\s*$/,'')+'\n;globalThis.api={aiBudgetPayloadStats,aiBudgetReserveEstimateEur,runBudgetedCloudflareAi,openai,withDependencyProbeBudget};',sandbox);
  return {api:sandbox.api,calls,env:{OPENAI_API_KEY:'test-only',SUPABASE_URL:'https://db.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only',__ETERNA_AI_BUDGET_UID:'test-user',AI_MONTHLY_BUDGET_EUR:'10'}};
}
test('budget estimator handles UTF-8, schema, image and cyclic objects',()=>{
 const {api}=setup();const payload={messages:[{content:'¿Cómo multiplicar? 🧠'}],response_format:{type:'json_schema'}};
 const stats=api.aiBudgetPayloadStats(payload);assert.ok(stats.input_tokens>=new TextEncoder().encode('¿Cómo multiplicar? 🧠').length);
 payload.self=payload;assert.equal(api.aiBudgetPayloadStats(payload).input_tokens,stats.input_tokens+4);
 assert.ok(api.aiBudgetPayloadStats({image:'data:image/png;base64,AAAA'}).input_tokens>=131072);
 for(const model of ['@cf/meta/llama-3.1-8b-instruct','gpt-5.6-luna'])assert.ok(api.aiBudgetReserveEstimateEur({},model,payload).reserve_eur>0);
});
for(const mode of ['homework','ask','review','explain','exam','practice']) {
 test(`${mode}: Cloudflare call reserves and settles before completing`,async()=>{
  const {api,env,calls}=setup();await api.runBudgetedCloudflareAi(env,'test-user',{run:async()=>{calls.push('cloudflare');return {usage:{input_tokens:10,output_tokens:10}};}},'@cf/meta/llama-3.1-8b-instruct',{messages:[{content:mode}],max_tokens:100});
  assert.deepEqual(calls,['reserve','cloudflare','settle']);
 });
}
for(const provider of ['cloudflare','openai'])for(const failure of ['denied','broken',null]) {
 test(`${provider}: budget ${failure||'success'} executes safely`,async()=>{
  const {api,env,calls}=setup({denied:failure==='denied',broken:failure==='broken'});
  const invoke=()=>provider==='openai'?api.openai(env,'/responses',{method:'POST',body:JSON.stringify({model:'gpt-5.6-luna',input:'test',max_output_tokens:100})}):api.runBudgetedCloudflareAi(env,'test-user',{run:async()=>{calls.push('cloudflare');return {usage:{input_tokens:10,output_tokens:10}};}},'@cf/meta/llama-3.1-8b-instruct',{messages:[{content:'test'}],max_tokens:100});
  if(failure){await assert.rejects(invoke(),failure==='denied'?/MONTHLY_AI_BUDGET_REACHED/:/AI_BUDGET_NOT_CONFIGURED/);assert.deepEqual(calls,['reserve']);}else{await invoke();assert.deepEqual(calls,['reserve',provider,'settle']);}
 });
}

test('release probe shares a strict reserve across both providers',async()=>{
 const {api,env,calls}=setup();delete env.__ETERNA_AI_BUDGET_UID;
 env.AI={run:async()=>{calls.push('cloudflare');return {response:'OK'}}};
 const limited=api.withDependencyProbeBudget(env);
 for(let i=0;i<4;i++)await limited.AI.run('gpt-5.6-sol',{messages:[{content:'probe'}],max_tokens:64000});
 await assert.rejects(api.openai(limited,'/responses',{method:'POST',body:JSON.stringify({model:'gpt-5.6-sol',input:'probe',max_output_tokens:64000})}),/PROBE_BUDGET_REACHED/);
 assert.deepEqual(calls,['cloudflare','cloudflare','cloudflare','cloudflare']);
});
