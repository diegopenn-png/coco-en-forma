import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {performance} from 'node:perf_hooks';
const text=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const worker=text('../src/index.js'),content=text('../src/library/content-v1.js'),runtime=text('../src/library/runtime-v1.js'),contract=text('../../eterna-state-contract-v3.js');
const cleanWorker=worker.replace(/^import\s+[^;]+;\s*/gm,'').replace(/\nexport default\s*\{[\s\S]*?\};\s*$/,'');
const plain=x=>JSON.parse(JSON.stringify(x));
export function harness({year='5º de Primaria',legal=true,subscription=true,quota=true,profile=true,delay=0,enabled=true,factory=true}={}){
  const requests=[],inferences=[],work=[],cache=new Map();
  const sb=async(input,init={})=>{
    const url=String(input);requests.push({url,method:init.method||'GET'});
    if(!url.startsWith('https://supabase.test/'))throw Error('Unplanned external request '+url);
    if(delay)await new Promise(r=>setTimeout(r,delay));
    const u=new URL(url),p=u.pathname;if(p==='/auth/v1/user')return new Response(JSON.stringify({id:'student-test',email:'adult@example.invalid',email_confirmed_at:new Date().toISOString()}),{status:200});let rows=[];
    if(p.endsWith('/eterna_student_profiles'))rows=profile?[{school_year:year,stage:year.includes('Primaria')?'primaria':year.includes('ESO')?'eso':year.includes('Bachillerato')?'bachillerato':'infantil',autonomous_community:'Andalucía'}]:[];
    else if(p.endsWith('/perfiles'))rows=[{apodo:'Prueba',edad:10,rol:'usuario'}];
    else if(p.endsWith('/eterna_subscriptions'))rows=[{status:subscription?'active':'canceled',plan:'monthly'}];
    else if(p.endsWith('/eterna_legal_acceptances'))rows=legal?[{terms_accepted:true,privacy_accepted:true,ai_notice_accepted:true,parental_authorization:true,relationship:'parent',accepted_at:new Date().toISOString(),legal_version:'2026-08-23-v1'}]:[];
    else if(p.endsWith('/eterna_parent_settings'))rows=[{max_sessions_per_day:quota?100:1,weekly_question_limit:quota?1000:1,allow_audio_input:true,allow_image_input:false}];
    else if(p.endsWith('/eterna_usage'))rows=quota?[]:[{chat_requests:10000,image_requests:0,usage_date:new Date().toISOString().slice(0,10)}];
    return new Response(JSON.stringify(rows),{status:200,headers:{'Content-Type':'application/json'}});
  };
  const sandbox={console:{log(){},warn(){},error(){}},URL,URLSearchParams,Request,Response,Headers,TextEncoder,TextDecoder,FormData,Blob,File,crypto:webcrypto,fetch:sb,setTimeout,clearTimeout,atob,btoa,Intl,caches:{default:{async match(req){return cache.get(req.url)?.clone()||null},async put(req,res){cache.set(req.url,res.clone())}}}};
  vm.createContext(sandbox);vm.runInContext(contract,sandbox);vm.runInContext(content,sandbox);vm.runInContext(runtime,sandbox);vm.runInContext(text('../src/library/procedural-v1.js'),sandbox);
  vm.runInContext(cleanWorker+'\nglobalThis.api={handleFetch,handleChatCore,handleChat,ownedLibraryDecision,ownedLibraryPayload,parseContractV3Input,addContractEnvelope};',sandbox);
  const env={SUPABASE_URL:'https://supabase.test',SUPABASE_SECRET_KEY:'sb_secret_test',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test',AI_PROVIDER:'cloudflare',ETERNA_EXERCISE_FACTORY:factory?'v1':'off',ENABLE_ETERNA_LIBRARY:enabled?'true':'false',ETERNA_LIBRARY_RELEASE:'eterna-library-2026.09-v6-310-traceable-12c672',AI:{run:async(model,input)=>{inferences.push(model);throw Error('No model calls expected on the owned path')}}};
  const auth={user:{id:'student-test',email:'adult@example.invalid',email_confirmed_at:new Date().toISOString()}};
  return {env,sandbox,requests,inferences,library:sandbox.EternaOwnedLibrary,lessons:sandbox.ETERNA_LIBRARY_CONTENT.lessons,
    async turn(body){const r=await sandbox.api.handleChat(new Request('https://worker.test/v1/chat',{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json'}}),env,auth,{waitUntil(p){work.push(p)}});return{status:r.status,data:await r.json(),headers:Object.fromEntries(r.headers)}} ,
    async fetchTurn(body){const r=await sandbox.api.handleFetch(new Request('https://worker.test/v1/chat',{method:'POST',body:JSON.stringify(body),headers:{'Content-Type':'application/json',Authorization:'Bearer synthetic-token',Origin:'https://cocoenforma.com'}}),env,{waitUntil(p){work.push(p)}});return{status:r.status,data:await r.json(),headers:Object.fromEntries(r.headers)}},
    async drain(){await Promise.all(work)}
  };
}
