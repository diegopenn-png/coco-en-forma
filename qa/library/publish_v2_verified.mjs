// Deploy only the immutable canonical version that passed real authenticated tests.
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';import{execFileSync}from'node:child_process';import assert from'node:assert/strict';
const proof=JSON.parse(readFileSync('.canonical-proof/report.json')),script='coco-eterna-v159',url='https://coco-eterna-v159.chatinmobiliario.workers.dev';
assert.equal(proof.phase,'canonical-private-verified');assert.equal(proof.regressions_passed,485);assert.ok(proof.synthetic_cleanup?.deleted);assert.equal(proof.requests.length,120);assert.ok(proof.requests.every(r=>r.generation_model_calls===0&&r.generation_tokens===0));
assert.equal(proof.release,'eterna-library-2026.09-v2-160-3069e276');assert.equal(proof.baseline_source_commit,'e40e3bbbd7d6ae464a9e17659cd8ae3d36245852');assert.ok(proof.context_fix_preserved&&proof.shared_v2_draft_untouched);assert.equal(proof.synthetic_fixture_count,2);assert.ok(proof.completed_synthetic_batches.every(b=>b.cleanup_verified&&b.zero_generation_tokens));assert.ok(proof.import_verification?.lesson_payloads_exact&&proof.import_verification?.protocol_payloads_exact);
const h=v=>createHash('sha256').update(v).digest('hex');for(const[path,x]of Object.entries(proof.blobs))assert.equal(h(readFileSync(path)),x.sha256,path);
const baseVersion=proof.base_version,candidateId=proof.candidate_version;assert.match(candidateId,/^[a-f0-9-]{36}$/);
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,''),account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];assert.ok(token&&/^[a-f0-9]{32}$/i.test(account));console.log('::add-mask::'+token);console.log('::add-mask::'+account);
const env={...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true'};
async function cf(path){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(30000)});const p=await r.json();assert.ok(r.ok&&p.success!==false,'Cloudflare read '+r.status);return p.result}
async function live(){const p=await cf('/deployments'),d=(Array.isArray(p)?p:p.deployments)?.[0];assert.ok(d?.versions?.length===1&&d.versions[0].percentage===100);return d}
function canon(x){return Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x}
const stable=x=>JSON.stringify(canon(x));
function bindingState(v){return stable(v.resources.bindings.filter(b=>!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE'].includes(b.name)).sort((a,b)=>a.name.localeCompare(b.name)))}
function runtimeState(v){return stable(v.resources.script_runtime)}
async function health(base){const r=await fetch(base+'/health',{signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);const p=await r.json();assert.equal(p.ok,true);return p}
async function closed(base){assert.equal((await fetch(base+'/v1/chat',{method:'POST',headers:{Origin:'https://cocoenforma.com'},signal:AbortSignal.timeout(20000)})).status,401)}
function cli(args){try{return execFileSync('npx',['wrangler',...args,'--config','.library-release.json'],{cwd:'eterna-worker',encoding:'utf8',env,timeout:180000,maxBuffer:8*1024*1024})}catch(e){throw Error('Wrangler command failed '+e.status+'; confidential output withheld')}}
const original=await cf('/versions/'+baseVersion),candidate=await cf('/versions/'+candidateId),baseline=await live();assert.equal(baseline.versions[0].version_id,baseVersion,'Concurrent server deployment; stop');
assert.equal(bindingState(candidate),bindingState(original),'Unrelated bindings changed');assert.equal(runtimeState(candidate),runtimeState(original),'Runtime changed');
const vars=Object.fromEntries(original.resources.bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text])),runtime=original.resources.script_runtime,ai=original.resources.bindings.find(b=>b.type==='ai');
for(const b of original.resources.bindings)assert.ok(['plain_text','secret_text','ai'].includes(b.type),'Unmapped binding; do not drop it');
const cfg={name:script,main:'src/index.js',compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags||[],vars};if(ai)cfg.ai={binding:ai.name};if(runtime.limits?.cpu_ms)cfg.limits={cpu_ms:runtime.limits.cpu_ms};if(runtime.usage_model)cfg.usage_model=runtime.usage_model;writeFileSync('eterna-worker/.library-release.json',JSON.stringify(cfg));
const oldHealth=await health(url),candidateHealth=await health(proof.candidate_url);assert.equal(candidateHealth.owned_library.release,proof.release);assert.equal(candidateHealth.owned_library.revision,'library-first-v2');assert.equal(candidateHealth.owned_library?.enabled,true);assert.equal(candidateHealth.owned_library.lessons,160);assert.equal(candidateHealth.owned_library.protocols,40);assert.equal(stable(candidateHealth.model_configuration),stable(oldHealth.model_configuration));assert.equal(stable(candidateHealth.features),stable(oldHealth.features));await closed(proof.candidate_url);
// Confirm original repository baseline exactly matches compiled live Worker before switching.
const baselineFiles={
 'eterna-worker/src/index.js':'0a142b6705aa1ee4b63562cd59cfc66c8e5702768d5413e46c94106f6e1eb52c',
 'eterna-worker/src/library/runtime-v1.js':'ed83c7f574db28c0e32e996579aed1ac9f03a85e91a2d59ff1cf28eb94c1b976',
 'eterna-worker/src/library/content-v1.js':'907fff5cb8baca727b4c6cc692ce337668c1650bcb020f5ba0d86fb022d1da47'
};
const saved=new Map();let output;
try{
 for(const[path,expected]of Object.entries(baselineFiles)){
  const old=execFileSync('git',['show',proof.baseline_source_commit+':'+path]);assert.equal(h(old),expected,'Untrusted baseline source '+path);saved.set(path,readFileSync(path));writeFileSync(path,old);
 }
 output=cli(['versions','upload','--keep-vars','--message','Exact published-context v1.1 baseline comparison; NEVER deploy this version']);
}finally{for(const[path,buffer]of saved)writeFileSync(path,buffer)}
for(const[path,x]of Object.entries(proof.blobs))assert.equal(h(readFileSync(path)),x.sha256,'Release source changed after baseline comparison');
const comparisonId=output.match(/(?:Worker )?Version ID:\s*([a-f0-9-]{36})/)?.[1];assert.ok(comparisonId);const comparison=await cf('/versions/'+comparisonId);assert.equal(comparison.resources.script.etag,original.resources.script.etag,'Live source differs from baseline');assert.equal((await live()).id,baseline.id,'Concurrent deployment; stop');
mkdirSync('library-publication-evidence',{recursive:true});const report={phase:'ready-for-deploy',release:proof.release,source_commit:process.env.EXPECTED_MAIN,base_version:baseVersion,candidate_version:candidateId,baseline_code_verified:true,models_unchanged:true,runtime_unchanged:true,only_library_release_flag_changed:true,context_fix_preserved:true,old_80_lessons_preserved:true,microphone_changed:false,real_authenticated_cases:120,regressions_passed:485,private_latency:proof.latency};const save=()=>writeFileSync('library-publication-evidence/report.json',JSON.stringify(report,null,2));save();
async function mainUnchanged(){const r=await fetch('https://api.github.com/repos/diegopenn-png/coco-en-forma/git/ref/heads/main',{headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,200);assert.equal((await r.json()).object.sha,process.env.EXPECTED_MAIN,'Main changed concurrently')}
await mainUnchanged();
try{
 cli(['versions','deploy',candidateId+'@100%','--name',script,'--message','Activate verified v2 160-lesson library; preserve context, models and voice','--yes']);
 let verified=false,active;
 for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,3000));active=await live();if(active.versions[0].version_id!==candidateId)continue;const p=await health(url);if(p.owned_library?.enabled&&p.owned_library.release===proof.release&&p.owned_library.revision==='library-first-v2'&&p.owned_library.lessons===160&&p.owned_library.protocols===40){assert.equal(stable(p.model_configuration),stable(oldHealth.model_configuration));assert.equal(stable(p.features),stable(oldHealth.features));await closed(url);assert.equal((await fetch(url+'/v1/transcribe',{method:'POST',headers:{Origin:'https://cocoenforma.com'},signal:AbortSignal.timeout(20000)})).status,401);verified=true;break}}
 assert.ok(verified,'Production health verification failed');report.phase='production-verified';report.library={release:proof.release,revision:'library-first-v2',lessons:160,questions:480,protocols:40,curriculum_complete:false};report.deployment_id=active.id;report.verified_at=new Date().toISOString();save();console.log(JSON.stringify(report));
}catch(e){report.phase='failed';report.error=String(e.message).slice(0,300);const active=await live();if(active.versions[0].version_id===candidateId){cli(['versions','deploy',baseVersion+'@100%','--name',script,'--message','Rollback failed prepared library release','--yes']);report.rollback_verified=(await live()).versions[0].version_id===baseVersion}else report.rollback_skipped_concurrent_change=true;save();throw e}
