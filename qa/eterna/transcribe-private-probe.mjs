// One-off synthetic transcription probe. No user sessions or production deployment.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const dir='qa/eterna/.transcribe-private';
const script='coco-eterna-v159';
const sha = value => createHash('sha256').update(value).digest('hex');
const token=String(process.env.CLOUDFLARE_API_TOKEN||'').replace(/\s/g,'');
const account=String(process.env.CLOUDFLARE_ACCOUNT_INPUT||'').replace(/^https:\/\/dash.cloudflare.com\//,'').split('/')[0];
if(!token||!/^[a-f0-9]{32}$/i.test(account))throw new Error('Cloudflare credentials are not configured');
console.log('::add-mask::'+token);console.log('::add-mask::'+account);
async function cf(path){
 const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${script}${path}`,{headers:{Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(30000)});
 const p=await r.json();if(!r.ok||p.success===false)throw new Error('Cloudflare read failed: '+r.status+' '+JSON.stringify((p.errors||[]).map(x=>({code:x.code,message:x.message}))));return p.result;
}
async function live(){const p=await cf('/deployments');const list=Array.isArray(p)?p:p.deployments;const d=list?.[0];if(!d||d.versions?.length!==1||d.versions[0].percentage!==100)throw new Error('Expected one production version at 100 percent');return d}
if(process.argv[2]==='prepare'){
 mkdirSync(dir,{recursive:true});
 const deployment=await live(),version=await cf('/versions/'+deployment.versions[0].version_id);
 const bindings=version.resources?.bindings;if(!Array.isArray(bindings))throw new Error('Production bindings are unavailable');
 const vars=Object.fromEntries(bindings.filter(b=>b.type==='plain_text').map(b=>[b.name,b.text]));
 if(!vars.AI_PROVIDER||!vars.TRANSCRIBE_MODEL)throw new Error('Production transcription variables missing');
 const fixtures=[['wav','audio/wav'],['m4a','audio/mp4'],['fragmented.m4a','audio/mp4'],['webm','audio/webm']].map(([ext,type])=>{const path=`${dir}/speech.${ext}`;return{path,type,name:'pregunta.'+ext,sha256:sha(readFileSync(path))}});
 const source=readFileSync('eterna-worker/src/index.js','utf8');
 const start=source.indexOf('async function handleTranscribe('),end=source.indexOf('\nasync function handleSpeak(',start);
 if(start<0||end<0)throw new Error('Cannot isolate transcription handler');
 const handler=source.slice(start,end),formAt=handler.indexOf('const form=');
 if(formAt<0)throw new Error('Cannot identify post-authorization transcription body');
 const provider='async function privateTranscribe(request,env){'+handler.slice(formAt);
 const probeToken=randomBytes(32).toString('hex');console.log('::add-mask::'+probeToken);
 const expected=sha(probeToken),expires=Date.now()+20*60*1000,hashes=fixtures.map(f=>f.sha256);
 let generated=source.replace(/export default \{[\s\S]*$/,'');
 // Capture only provider errors from this fixed synthetic fixture. Never run this in production.
 const marker='console.error("ETERNA OPENAI HTTP",path,meta.status';
 if(!generated.includes(marker))throw new Error('OpenAI diagnostic marker missing');
 generated=generated.replace(marker,'env.__micProbeUpstream={status:r.status,code:meta.code,type:meta.type,message:String(payload?.error?.message||"").replace(/(?:sk-|Bearer )[A-Za-z0-9_-]+/g,"[redacted]").slice(0,350)};'+marker);
 generated+='\n'+provider+`\nexport default {async fetch(request,env){
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Robots-Tag':'noindex'};
 const reply=(p,s=200)=>new Response(JSON.stringify(p),{status:s,headers});
 if(Date.now()>${expires}||new URL(request.url).pathname!=='/__synthetic_transcribe'||request.method!=='POST')return reply({error:'NOT_FOUND'},404);
 if(await sha256((request.headers.get('Authorization')||'').replace(/^Bearer /,''))!==${JSON.stringify(expected)})return reply({error:'UNAUTHORIZED'},401);
 const testEnv={...env};
 try{
  const fd=await request.clone().formData(),audio=fd.get('audio');
  if(!audio||typeof audio.arrayBuffer!=='function'||audio.size>1024*1024)return reply({error:'FIXTURE_REQUIRED'},400);
  const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await audio.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
  if(!${JSON.stringify(hashes)}.includes(hash))return reply({error:'FIXTURE_NOT_ALLOWED'},403);
  const r=await privateTranscribe(request,testEnv),data=await r.json();
  return reply({ok:r.ok&&Boolean(data.text?.trim()),status:r.status,text:data.text||'',error:data.error||null,provider:aiProvider(env),model:env.TRANSCRIBE_MODEL});
 }catch(e){return reply({ok:false,error:{name:String(e?.name||'Error'),kind:e?.kind||null,status:e?.status||null,code:e?.code||null,type:e?.type||null,message:String(e?.message||e).slice(0,160)},upstream:testEnv.__micProbeUpstream||null,provider:aiProvider(env),model:env.TRANSCRIBE_MODEL})}
}};\n`;
 writeFileSync('eterna-worker/src/.transcribe-private-generated.js',generated);
 const runtime=version.resources.script_runtime||{};
 const config={name:script,main:'src/.transcribe-private-generated.js',compatibility_date:runtime.compatibility_date||'2026-08-20',compatibility_flags:runtime.compatibility_flags||[],vars};
 const ai=bindings.find(b=>b.type==='ai');if(ai)config.ai={binding:ai.name};
 writeFileSync('eterna-worker/.transcribe-private.json',JSON.stringify(config));
 writeFileSync(`${dir}/state.json`,JSON.stringify({deployment_id:deployment.id,version_id:version.id,fixtures,probeToken,expires,source_sha256:sha(source),provider:vars.AI_PROVIDER,model:vars.TRANSCRIBE_MODEL}));
 writeFileSync(`${dir}/report.json`,JSON.stringify({phase:'prepared',production_unchanged:true,production_version:version.id,source_sha256:sha(source),provider:vars.AI_PROVIDER,model:vars.TRANSCRIBE_MODEL},null,2));
 console.log('Prepared isolated synthetic probe; production provider='+vars.AI_PROVIDER+' model='+vars.TRANSCRIBE_MODEL);
}else if(process.argv[2]==='upload'){
 const state=JSON.parse(readFileSync(`${dir}/state.json`));console.log('::add-mask::'+state.probeToken);
 let stdout;try{stdout=execFileSync('npx',['wrangler','versions','upload','--config','.transcribe-private.json','--keep-vars','--message','Isolated synthetic transcription diagnosis; NEVER deploy this probe'],{cwd:'eterna-worker',encoding:'utf8',env:{...process.env,CLOUDFLARE_API_TOKEN:token,CLOUDFLARE_ACCOUNT_ID:account,CI:'true'},timeout:180000,maxBuffer:8*1024*1024});}catch(e){throw new Error('Private upload failed with exit code '+(e.status||'unknown')+'; credentials and binding values omitted')}
 const url=stdout.match(/Version Preview URL:\s*(https:\/\/[^\s]+)/)?.[1];
 if(!url||!/^https:\/\/[a-f0-9-]+-coco-eterna-v159\.chatinmobiliario\.workers\.dev$/.test(url))throw new Error('No isolated version preview URL');
 const current=await live();if(current.id!==state.deployment_id)throw new Error('Production changed concurrently; stop');
 writeFileSync(`${dir}/state.json`,JSON.stringify({...state,url}));console.log('Isolated probe uploaded; production deployment unchanged');
}else if(process.argv[2]==='run'){
 const state=JSON.parse(readFileSync(`${dir}/state.json`));console.log('::add-mask::'+state.probeToken);
 const reports=[];
 const noAuth=await fetch(state.url+'/__synthetic_transcribe',{method:'POST',signal:AbortSignal.timeout(30000)});
 if(noAuth.status!==401)throw new Error('Probe authentication gate failed: '+noAuth.status);
 for(const f of state.fixtures){
  const fd=new FormData();fd.append('audio',new Blob([readFileSync(f.path)],{type:f.type}),f.name);
  const started=Date.now();const r=await fetch(state.url+'/__synthetic_transcribe',{method:'POST',headers:{Authorization:'Bearer '+state.probeToken},body:fd,signal:AbortSignal.timeout(90000)});
  let data;try{data=await r.json()}catch{data={ok:false,error:'NON_JSON_RESPONSE',http_status:r.status}}
  const row={format:f.name,milliseconds:Date.now()-started,...data};reports.push(row);console.log(JSON.stringify(row));
 }
 const current=await live(),unchanged=current.id===state.deployment_id;
 const report={phase:'baseline-real-audio',production_unchanged:unchanged,production_version:state.version_id,source_sha256:state.source_sha256,provider:state.provider,model:state.model,auth_gate_passed:true,synthetic_only:true,results:reports};
 writeFileSync(`${dir}/report.json`,JSON.stringify(report,null,2));
 if(!unchanged)throw new Error('Production changed concurrently');
 console.log('Real-audio diagnosis complete; '+reports.filter(x=>x.ok).length+'/'+reports.length+' successful; no production deployment');
}else throw new Error('Expected prepare, upload or run');
