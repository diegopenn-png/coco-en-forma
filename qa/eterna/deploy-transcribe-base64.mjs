// One-off guarded deployment: byte-exact Whisper Turbo repair only.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const script='coco-eterna-v159',production='https://coco-eterna-v159.chatinmobiliario.workers.dev';
const expectedBase='86b2652a-1b01-4afa-84d4-00554ef1c979';
const expectedSource='b62aaaedc07cbc2ada1e1410b675dc62c4d8fcd3b5b626e2e855e157e706e9c5';
const dir='qa/eterna/.transcribe-release';mkdirSync(dir,{recursive:true});
const sourcePath='eterna-worker/src/index.js',source=readFileSync(sourcePath,'utf8');
const hash=s=>createHash('sha256').update(s).digest('hex');
assert.equal(hash(source),expectedSource,'Release source differs from real-audio-tested source');
assert.ok(!source.includes('__synthetic_transcribe'),'Private diagnostic wrapper must never be deployed');
const proof=JSON.parse(readFileSync('.release-evidence/qa/eterna/.transcribe-private/report.json'));
assert.equal(proof.source_sha256,expectedSource);assert.equal(proof.all_audio_tests_passed,true);
assert.equal(proof.production_version,expectedBase);assert.equal(proof.auth_gate_passed,true);assert.equal(proof.results.length,4);
for(const r of proof.results){assert.equal(r.ok,true);assert.equal(r.status,200);const text=r.text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();assert.match(text,/numeros? primos?/);assert.match(text,/siete|7/)}
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,'');
const account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];
assert.ok(token&&/^[a-f0-9]{32}$/i.test(account),'Cloudflare credentials not configured');
console.log('::add-mask::'+token);console.log('::add-mask::'+account);
const env={...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true'};
async function cf(path){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});const p=await r.json();if(!r.ok||p.success===false)throw new Error('Cloudflare control read failed: '+r.status);return p.result}
async function live(){const p=await cf('/deployments'),d=(Array.isArray(p)?p:p.deployments)?.[0];assert.ok(d&&d.versions.length===1&&d.versions[0].percentage===100,'Expected single active production version');return d}
function canon(x){if(Array.isArray(x))return x.map(canon);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])]));return x}
function bindingFingerprint(v){return hash(JSON.stringify(canon([...v.resources.bindings].sort((a,b)=>a.name.localeCompare(b.name)))))}
function runtimeFingerprint(v){const r=v.resources.script_runtime||{};return hash(JSON.stringify(canon({date:r.compatibility_date,flags:r.compatibility_flags||[],limits:r.limits||{},usage:r.usage_model,handlers:v.resources.script.handlers,named_handlers:v.resources.script.named_handlers||[]})))}
function wrangler(args){try{return execFileSync('npx',['wrangler',...args,'--config','.transcribe-production.json'],{cwd:'eterna-worker',env,encoding:'utf8',timeout:180000,maxBuffer:8*1024*1024})}catch(e){throw new Error('Wrangler failed with exit '+(e.status||'unknown')+'; confidential output omitted')}}
async function upload(message){const out=wrangler(['versions','upload','--keep-vars','--message',message]);const id=out.match(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/)?.[1],url=out.match(/Version Preview URL:\s*(https:\/\/[^\s]+)/)?.[1];assert.ok(id&&url&&/^https:\/\/[a-f0-9-]+-coco-eterna-v159\.chatinmobiliario\.workers\.dev$/.test(url),'Canonical private version metadata missing');return{id,url,details:await cf('/versions/'+id)}}
async function health(base){const r=await fetch(base+'/health',{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);const p=await r.json();assert.equal(p.ok,true);assert.equal(p.ai_provider,'cloudflare');assert.equal(p.cloudflare_ai_configured,true);assert.equal(p.supabase_configured,true);assert.equal(p.model_configuration?.speech?.transcribe_model,'@cf/openai/whisper-large-v3-turbo');return p}
function healthFingerprint(p){return hash(JSON.stringify(canon({version:p.version,provider:p.ai_provider,models:p.model_configuration,features:p.features,supabase:p.supabase_configured,stripe:p.stripe_configured,openai:p.openai_configured,cloudflare:p.cloudflare_ai_configured})))}
async function authGate(base){const r=await fetch(base+'/v1/transcribe',{method:'POST',headers:{Origin:'https://cocoenforma.com'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,401,'Unauthenticated transcription must remain blocked');const p=await r.json();assert.equal(p.error,'UNAUTHORIZED')}
const baseline=await live();assert.equal(baseline.versions[0].version_id,expectedBase,'Production changed after real-audio tests; stop');
const old=await cf('/versions/'+expectedBase),bindings=old.resources?.bindings;assert.ok(Array.isArray(bindings));
for(const b of bindings)assert.ok(['plain_text','secret_text','ai'].includes(b.type),'Unmapped production binding; stop rather than drop it');
const vars=Object.fromEntries(bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
assert.equal(vars.AI_PROVIDER,'cloudflare');assert.equal(vars.TRANSCRIBE_MODEL,'@cf/openai/whisper-large-v3-turbo');
const runtime=old.resources.script_runtime||{},ai=bindings.find(b=>b.type==='ai');assert.ok(ai);
const config={name:script,main:'src/index.js',compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags||[],vars,ai:{binding:ai.name}};
if(runtime.limits?.cpu_ms)config.limits={cpu_ms:runtime.limits.cpu_ms};
if(runtime.usage_model)config.usage_model=runtime.usage_model;
writeFileSync('eterna-worker/.transcribe-production.json',JSON.stringify(config));
const baselineHealth=await health(production);await authGate(production);
const report={phase:'pre-deployment',base_version:expectedBase,source_sha256:expectedSource,real_audio_tests_passed:4,regression_tests_passed:223,production_changed:false};
const reportPath=dir+'/report.json',save=()=>writeFileSync(reportPath,JSON.stringify(report,null,2));save();
// Rebuild the unmodified source at its canonical filename and compare the live code hash.
const after='const bytes=new Uint8Array(await file.arrayBuffer());let audio="";for(let offset=0;offset<bytes.length;offset+=24576)audio+=btoa(String.fromCharCode(...bytes.subarray(offset,offset+24576)));const data=await env.AI.run(env.TRANSCRIBE_MODEL||"@cf/openai/whisper-large-v3-turbo",';
const before='const audio=[...new Uint8Array(await file.arrayBuffer())],data=await env.AI.run(env.TRANSCRIBE_MODEL||"@cf/openai/whisper-large-v3-turbo",';
const original=source.replace(after,before);assert.equal(hash(original),'fbf4a21b93bfc8a9dad803f1f9dfdcf2c9eab1772e55976794c4d39f40d08582');
let rebuilt;
try{writeFileSync(sourcePath,original);rebuilt=await upload('Baseline byte-for-byte comparison only; do not deploy')}finally{writeFileSync(sourcePath,source)}
report.live_code_etag=old.resources.script.etag;report.rebuilt_base_etag=rebuilt.details.resources.script.etag;save();
assert.ok(report.live_code_etag,'Production code hash missing');
assert.equal(report.rebuilt_base_etag,report.live_code_etag,'Repository baseline differs from live Worker code; stop');
report.live_baseline_code_verified=true;save();
assert.equal(hash(readFileSync(sourcePath)),expectedSource);
const candidate=await upload('Transcription-only base64 repair; four real audio formats and 223 regressions passed');
assert.equal(bindingFingerprint(candidate.details),bindingFingerprint(old),'Bindings changed; stop');
assert.equal(runtimeFingerprint(candidate.details),runtimeFingerprint(old),'Runtime changed; stop');
const candidateHealth=await health(candidate.url);assert.equal(healthFingerprint(candidateHealth),healthFingerprint(baselineHealth),'Unrelated health/model configuration changed');
await authGate(candidate.url);assert.equal((await live()).id,baseline.id,'Concurrent production deployment; stop');
report.candidate_version=candidate.id;report.bindings_unchanged=true;report.runtime_unchanged=true;report.models_unchanged=true;report.auth_gate_passed=true;save();
let attempted=false;
try{
 attempted=true;wrangler(['versions','deploy',candidate.id+'@100%','--name',script,'--message','Repair only Whisper Turbo audio encoding after real-audio verification','--yes']);
 let current,verified=false;
 for(let i=0;i<6;i++){
  current=await live();
  if(current.versions[0].version_id===candidate.id){try{assert.equal(healthFingerprint(await health(production)),healthFingerprint(baselineHealth));await authGate(production);verified=true;break}catch{}}
  await new Promise(r=>setTimeout(r,5000));
 }
 assert.ok(verified,'Production verification did not pass');
 report.phase='production-verified';report.production_changed=true;report.production_version=candidate.id;report.deployment_id=current.id;report.verified_at=new Date().toISOString();save();
 console.log(JSON.stringify(report));
}catch(error){
 report.phase='deployment-failed';report.error=String(error.message).slice(0,200);
 if(attempted){const current=await live();if(current.versions[0].version_id===candidate.id){wrangler(['versions','deploy',expectedBase+'@100%','--name',script,'--message','Rollback failed transcription-only deployment','--yes']);report.rollback_verified=(await live()).versions[0].version_id===expectedBase}else report.rollback_skipped_concurrent_change=true}
 save();throw error;
}
