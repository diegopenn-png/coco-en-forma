// Promote only the immutable, verified canonical version. Never deploy a fixture.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const script='coco-eterna-v159',production='https://coco-eterna-v159.chatinmobiliario.workers.dev';
const baseVersion='438466cb-f081-48f1-a4cc-7986deb58f8a';
const out='library-context-release-evidence';mkdirSync(out,{recursive:true});
const hash=x=>createHash('sha256').update(x).digest('hex');
const proof=JSON.parse(readFileSync('.final-proof/library-context-edge-evidence/report.json'));
const ui=JSON.parse(readFileSync('.final-proof/library-integration-evidence/report.json'));
assert.equal(proof.phase,'private-context-and-fallback-verified');
assert.equal(proof.ready_for_controlled_deployment,true);
assert.equal(proof.base_version,baseVersion);
assert.equal(proof.regressions_passed,397);
assert.equal(ui.regressions_passed,397);assert.equal(ui.regressions_failed,0);
assert.equal(ui.ui_scenarios,32);assert.equal(ui.ui_models_called,0);
assert.equal(proof.edge_checks.length,2);for(const c of proof.edge_checks)assert.equal(c.ok,true);
const context=proof.edge_checks.find(x=>x.case==='context'),fallback=proof.edge_checks.find(x=>x.case==='fallback');
assert.equal(context.ai_calls+context.openai_calls,0);
assert.ok(fallback.ai_calls+fallback.openai_calls>0);
for(const[path,v] of Object.entries(proof.source_hashes))assert.equal(hash(readFileSync(path)),v.sha256,path);
assert.equal(hash(readFileSync('eterna-worker/src/index.js')),'0a142b6705aa1ee4b63562cd59cfc66c8e5702768d5413e46c94106f6e1eb52c');
assert.ok(!readFileSync('eterna-worker/src/index.js','utf8').includes('__context_fixture'));
const releaseCommit=process.env.EXPECTED_MAIN;assert.match(releaseCommit,/^[a-f0-9]{40}$/);
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,'');
const account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];
assert.ok(token&&/^[a-f0-9]{32}$/i.test(account));console.log('::add-mask::'+token);console.log('::add-mask::'+account);
const env={...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true'};
const report={phase:'pre-deployment',source_commit:releaseCommit,base_version:baseVersion,candidate_version:proof.candidate_version,revision:'library-first-v1.1',regressions_passed:397,ui_scenarios:32,production_changed:false,microphone_changed:false,frontend_changed:false,source_hashes:proof.source_hashes};
const save=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2));save();
async function cf(path){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:'Bearer '+token},signal:AbortSignal.timeout(25000)}),p=await r.json();assert.ok(r.ok&&p.success!==false,'Cloudflare control read failed '+r.status);return p.result}
async function live(){const p=await cf('/deployments'),d=(Array.isArray(p)?p:p.deployments)?.[0];assert.ok(d?.versions?.length===1&&d.versions[0].percentage===100,'Expected one production version');return d}
async function main(){const r=await fetch('https://api.github.com/repos/diegopenn-png/coco-en-forma/git/ref/heads/main',{headers:{Authorization:'Bearer '+process.env.GH_TOKEN,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(25000)}),p=await r.json();assert.ok(r.ok);assert.equal(p.object.sha,releaseCommit,'Main changed concurrently; stop')}
const canon=x=>Array.isArray(x)?x.map(canon):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
const fp=x=>hash(JSON.stringify(canon(x)));
const bindingFp=v=>fp([...v.resources.bindings].sort((a,b)=>a.name.localeCompare(b.name)));
const modelFp=h=>fp({version:h.version,provider:h.ai_provider,model_configuration:h.model_configuration,features:h.features,supabase:h.supabase_configured,stripe:h.stripe_configured,cloudflare:h.cloudflare_ai_configured,openai:h.openai_configured});
async function health(url,revision=false){const r=await fetch(url+'/health',{signal:AbortSignal.timeout(20000),headers:{'Cache-Control':'no-cache'}});assert.equal(r.status,200);const p=await r.json();assert.equal(p.ok,true);assert.equal(p.owned_library?.enabled,true);assert.equal(p.owned_library?.lessons,80);assert.equal(p.owned_library?.protocols,24);if(revision)assert.equal(p.owned_library.revision,'library-first-v1.1');return p}
async function gates(url){for(const path of ['/v1/chat','/v1/chat-job','/v1/transcribe']){const r=await fetch(url+path,{method:'POST',headers:{Origin:'https://cocoenforma.com'},signal:AbortSignal.timeout(20000)});assert.equal(r.status,401,path)}}
function deploy(id,message){try{return execFileSync('npx',['wrangler','versions','deploy',id+'@100%','--name',script,'--config','.context-release.json','--message',message,'--yes'],{cwd:'eterna-worker',env,encoding:'utf8',stdio:'pipe',timeout:180000,maxBuffer:8*1024*1024})}catch(e){throw Error('Version promotion failed: '+e.status+'; confidential output omitted')}}
await main();const baseline=await live();assert.equal(baseline.id,proof.base_deployment);assert.equal(baseline.versions[0].version_id,baseVersion);
const old=await cf('/versions/'+baseVersion),candidate=await cf('/versions/'+proof.candidate_version);
assert.equal(candidate.resources.script.etag,proof.candidate_code_etag,'Not the tested canonical code');
assert.equal(bindingFp(candidate),bindingFp(old),'Bindings changed');assert.equal(fp(candidate.resources.script_runtime),fp(old.resources.script_runtime),'Runtime changed');
const runtime=old.resources.script_runtime,vars=Object.fromEntries(old.resources.bindings.filter(x=>x.type==='plain_text').map(x=>[x.name,x.text]));
const config={name:script,main:'src/index.js',compatibility_date:runtime.compatibility_date,compatibility_flags:runtime.compatibility_flags||[],vars};
const ai=old.resources.bindings.find(x=>x.type==='ai');if(ai)config.ai={binding:ai.name};if(runtime.limits?.cpu_ms)config.limits={cpu_ms:runtime.limits.cpu_ms};if(runtime.usage_model)config.usage_model=runtime.usage_model;
writeFileSync('eterna-worker/.context-release.json',JSON.stringify(config));
const candidateUrl=`https://${proof.candidate_version.split('-')[0]}-${script}.chatinmobiliario.workers.dev`;
const originalHealth=await health(production),candidateHealth=await health(candidateUrl,true);assert.equal(modelFp(originalHealth),modelFp(candidateHealth));await gates(candidateUrl);
report.models_unchanged=true;report.bindings_unchanged=true;report.runtime_unchanged=true;report.canonical_code_etag_verified=true;save();
let attempted=false;
try{
 await main();assert.equal((await live()).id,baseline.id);
 attempted=true;deploy(proof.candidate_version,'Verified PWA library context: simplify, cordiality, exam state, AI fallback; no voice changes');
 let verified=false,last;
 for(let i=0;i<6;i++){
  last=await live();
  if(last.versions[0].version_id===proof.candidate_version){try{assert.equal(modelFp(await health(production,true)),modelFp(originalHealth));await gates(production);verified=true;break}catch{}}
  await new Promise(r=>setTimeout(r,5000));
 }
 assert.equal(verified,true,'Post-deployment health or access gate failed');
 report.phase='production-verified';report.production_changed=true;report.production_version=proof.candidate_version;report.deployment_id=last.id;report.verified_at=new Date().toISOString();report.auth_gates_passed=true;save();console.log(JSON.stringify(report));
}catch(e){
 report.phase='deployment-failed';report.error=String(e.message).slice(0,240);
 if(attempted){const now=await live();if(now.versions[0].version_id===proof.candidate_version){deploy(baseVersion,'Rollback failed library-context deployment');report.rollback_verified=(await live()).versions[0].version_id===baseVersion}else report.rollback_not_needed_or_concurrent_change=true}
 save();throw e;
}
