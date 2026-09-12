from pathlib import Path
import json,hashlib,re
proof=json.loads(Path('combined-evidence/report.json').read_text());release=proof['release']
assert release=='eterna-library-2026.09-v3-217-6b83' and proof['lessons']==217 and proof['protocols']==56 and proof['tests_failed']==0 and proof['ui_scenarios']==42
for path,p in proof['blobs'].items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==p['sha256'],path
raw=Path('.qa-auth/qa/library/remote_canonical_verify.mjs').read_bytes();assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()=='e17881ee2b99a689f309b9be281d62d74b401956'
s=raw.decode().replace("import '../../eterna-worker/src/library/content-v1.js';","import '../../eterna-worker/src/library/content-v1.js';\nimport '../../eterna-worker/src/library/runtime-v1.js';")
s=s.replace('eterna-library-2026.09-v1',release).replace("directory='library-canonical-evidence'","directory='combined-private-evidence'")
s=s.replace('92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb',proof['blobs']['eterna-worker/src/index.js']['sha256']).replace('26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21',proof['blobs']['eterna-worker/src/library/runtime-v1.js']['sha256'])
s=s.replace('0abf2be8-16c4-4695-96ae-48d0e9ef82fe','616b2ff8-5a2c-43a8-9092-5d70a42f14e2')
s=s.replace('regressions_passed:387','regressions_passed:'+str(proof['tests_passed'])).replace('documents:58,chunks:13130,lessons:80,protocols:24','lessons:217,protocols:56,questions:651')
s=s.replace('health.owned_library.lessons,80','health.owned_library.lessons,217').replace('health.owned_library.protocols,24','health.owned_library.protocols,56')
s=s.replace("['infantil','i-count'],['primaria','p-prime'],['eso','e-equation'],['bachillerato','b-derivative']","['infantil','i-full'],['primaria','p-lcm'],['eso','e-systems'],['bachillerato','b-determinant']")
s,n=re.subn(r"for\(const text of \['Hola Eterna'.*?\]\)await chat\(text\);","for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);",s);assert n==1
s=s.replace("apodo:'Prueba Sintética'","apodo:'QA Biblioteca '+NONCE.slice(0,12)")
needle='const helper=`const ACCESS=';assert s.count(needle)==1;s=s.replace(needle,"const helper=`import './library/content-v1.js';\nimport './library/runtime-v1.js';\nconst ACCESS=")
s=s.replace("'bachillerato','stats','cleanup'","'bachillerato','stats','cleanup','stage_content'")
extra="""
 if(command==='stage_content'){
  const RELEASE='__RELEASE__';
  const rows=await sb('/rest/v1/eterna_library_releases?release_id=eq.'+RELEASE+'&select=status');
  if(rows.length!==1||rows[0].status!=='draft')return reply({error:'RELEASE_NOT_DRAFT'},409);
  if(globalThis.ETERNA_LIBRARY_CONTENT.release_id!==RELEASE||globalThis.ETERNA_LIBRARY_CONTENT.lessons.length!==217||globalThis.EternaOwnedLibrary.protocols.length!==56)throw Error('FIXED_CONTENT_MISMATCH');
  function canon(v){return Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v}
  const lessonRows=[];
  for(const l of globalThis.ETERNA_LIBRARY_CONTENT.lessons)lessonRows.push({lesson_id:RELEASE+':'+l.id,release_id:RELEASE,stage:l.stage,subject:l.subject,title:l.title,school_years:l.school_years,aliases:l.aliases,review_status:'editorial_checked',payload:l,content_sha256:await digest(JSON.stringify(canon(l)))});
  const protocolRows=[];
  for(const p of globalThis.EternaOwnedLibrary.protocols){const payload={...p,implementation:'eterna-worker/src/library/runtime-v1.js',implementation_sha256:'__RUNTIME__',context_sensitive:true,hash_serialization:'canonical-json-recursive-keys-v1',sample_response:globalThis.EternaOwnedLibrary.cordial(p.id,{now:new Date('2026-09-12T10:00:00Z')}),sample_is_fixture_not_live_answer:true};protocolRows.push({protocol_id:RELEASE+':'+p.id,release_id:RELEASE,payload,content_sha256:await digest(JSON.stringify(canon(payload)))})}
  for(const[table,data]of [['eterna_library_lessons',lessonRows],['eterna_library_protocols',protocolRows]]){
   for(let i=0;i<data.length;i+=20)await sb('/rest/v1/'+table,'POST',data.slice(i,i+20));
   const stored=await sb('/rest/v1/'+table+'?release_id=eq.'+RELEASE+'&select=payload,content_sha256');
   if(stored.length!==data.length)throw Error('STORED_COUNT_MISMATCH');
   for(const row of stored)if(await digest(JSON.stringify(canon(row.payload)))!==row.content_sha256)throw Error('STORED_HASH_MISMATCH');
  }
  return reply({ok:true,lessons:217,questions:651,protocols:56,hash_mismatches:0,source_archive_modified:false,production_modified:false,hash_serialization:'canonical-json-recursive-keys-v1'})
 }
""".replace('__RELEASE__',release).replace('__RUNTIME__',proof['blobs']['eterna-worker/src/library/runtime-v1.js']['sha256'])
needle=' async function login(){';assert s.count(needle)==1;s=s.replace(needle,extra+'\n'+needle)
needle=" const setup=await control('setup');";assert s.count(needle)==1;s=s.replace(needle," report.draft_content=await control('stage_content');save();\n"+needle)
needle='report.candidate_version=candidate.id;report.candidate_url=candidate.url;save();';assert s.count(needle)==1;s=s.replace(needle,needle+"report.source_commit="+json.dumps(proof['tested_commit'])+";report.source_hashes="+json.dumps(proof['blobs'])+";report.ui_scenarios=42;save();")
needle="assert.equal(reduced(cv.resources.bindings),reduced(bindings),'An unrelated binding changed');";assert s.count(needle)==1;s=s.replace(needle,needle+"assert.deepEqual(cv.resources.script_runtime,original.resources.script_runtime,'Runtime changed');report.candidate_code_etag=cv.resources.script.etag;report.base_code_etag=original.resources.script.etag;report.unrelated_bindings_unchanged=true;report.runtime_unchanged=true;save();")
Path('qa/library/remote_combined_verify.mjs').write_text(s)
print('Prepared expiring fixed-scope public-content importer and real canonical authentication verifier; no production deployment.')
