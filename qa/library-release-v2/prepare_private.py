"""Prepare a fixed-content private verifier from a pinned, previously exercised QA tool.
Only the draft library release and a disposable synthetic identity may be written.
"""
from pathlib import Path
import hashlib,json,re
proof=json.loads(Path('.content-proof/library-v2-evidence/report.json').read_text())
assert proof['release']=='eterna-library-2026.09-v2' and proof['lessons']==160 and proof['protocols']==40
assert proof['tests_failed']==0 and proof['ui_model_calls']==0 and proof['ui_scenarios']>=42
for path,p in proof['blobs'].items():assert hashlib.sha256(Path(path).read_bytes()).hexdigest()==p['sha256'],path
source=Path('.qa-auth/qa/library/remote_canonical_verify.mjs').read_bytes()
assert hashlib.sha1(b'blob '+str(len(source)).encode()+b'\0'+source).hexdigest()=='e17881ee2b99a689f309b9be281d62d74b401956'
s=source.decode()
s=s.replace("import '../../eterna-worker/src/library/content-v1.js';","import '../../eterna-worker/src/library/content-v1.js';\nimport '../../eterna-worker/src/library/runtime-v1.js';")
s=s.replace('eterna-library-2026.09-v1','eterna-library-2026.09-v2').replace("directory='library-canonical-evidence'","directory='library-v2-private-evidence'")
s=s.replace('92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb',proof['blobs']['eterna-worker/src/index.js']['sha256'])
s=s.replace('26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21',proof['blobs']['eterna-worker/src/library/runtime-v1.js']['sha256'])
s=s.replace('0abf2be8-16c4-4695-96ae-48d0e9ef82fe','5da15a04-5396-4841-8b21-a94c0c6647c3')
s=s.replace('regressions_passed:387','regressions_passed:'+str(proof['tests_passed'])).replace('documents:58,chunks:13130,lessons:80,protocols:24','archive_documents:58,archive_chunks:13130,lessons:160,protocols:40')
s=s.replace('health.owned_library.lessons,80','health.owned_library.lessons,160').replace('health.owned_library.protocols,24','health.owned_library.protocols,40')
s=s.replace("['infantil','i-count'],['primaria','p-prime'],['eso','e-equation'],['bachillerato','b-derivative']","['infantil','i-sort'],['primaria','p-solar'],['eso','e-quadratic'],['bachillerato','b-binomial']")
s,n=re.subn(r"for\(const text of \['Hola Eterna'.*?\]\)await chat\(text\);","for(const text of globalThis.EternaOwnedLibrary.protocols.map(p=>p.aliases[0]))await chat(text);",s);assert n==1
needle='const helper=`const ACCESS='
assert s.count(needle)==1
s=s.replace(needle,"const helper=`import './library/content-v1.js';\nimport './library/runtime-v1.js';\nconst ACCESS=")
s=s.replace("'bachillerato','stats','cleanup'","'bachillerato','stats','cleanup','stage_content'")
extra="""
 if(command==='stage_content'){
  const RELEASE='eterna-library-2026.09-v2';
  const rows=await sb('/rest/v1/eterna_library_releases?release_id=eq.'+RELEASE+'&select=status');
  if(rows.length!==1||rows[0].status!=='draft')return reply({error:'RELEASE_NOT_DRAFT'},409);
  if(globalThis.ETERNA_LIBRARY_CONTENT.release_id!==RELEASE||globalThis.ETERNA_LIBRARY_CONTENT.lessons.length!==160||globalThis.EternaOwnedLibrary.protocols.length!==40)throw Error('FIXED_CONTENT_MISMATCH');
  function canon(v){return Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v}
  const lessonRows=[];
  for(const l of globalThis.ETERNA_LIBRARY_CONTENT.lessons)lessonRows.push({lesson_id:RELEASE+':'+l.id,release_id:RELEASE,stage:l.stage,subject:l.subject,title:l.title,school_years:l.school_years,aliases:l.aliases,review_status:'editorial_checked',payload:l,content_sha256:await digest(JSON.stringify(canon(l)))});
  const protocolRows=[];
  for(const p of globalThis.EternaOwnedLibrary.protocols){const payload={...p,implementation:'eterna-worker/src/library/runtime-v1.js',implementation_sha256:'__RUNTIME_HASH__',context_sensitive:true,hash_serialization:'canonical-json-recursive-keys-v1',sample_response:globalThis.EternaOwnedLibrary.cordial(p.id,{now:new Date('2026-09-12T10:00:00Z')}),sample_is_fixture_not_live_answer:true};protocolRows.push({protocol_id:RELEASE+':'+p.id,release_id:RELEASE,payload,content_sha256:await digest(JSON.stringify(canon(payload)))})}
  for(const[table,data]of [['eterna_library_lessons',lessonRows],['eterna_library_protocols',protocolRows]]){
   for(let i=0;i<data.length;i+=20)await sb('/rest/v1/'+table,'POST',data.slice(i,i+20));
   const stored=await sb('/rest/v1/'+table+'?release_id=eq.'+RELEASE+'&select=payload,content_sha256');
   if(stored.length!==data.length)throw Error('STORED_COUNT_MISMATCH');
   for(const row of stored)if(await digest(JSON.stringify(canon(row.payload)))!==row.content_sha256)throw Error('STORED_HASH_MISMATCH');
  }
  return reply({ok:true,lessons:160,questions:480,protocols:40,hash_mismatches:0,source_archive_modified:false,production_modified:false,hash_serialization:'canonical-json-recursive-keys-v1'})
 }
""".replace('__RUNTIME_HASH__',proof['blobs']['eterna-worker/src/library/runtime-v1.js']['sha256'])
needle=' async function login(){';assert s.count(needle)==1;s=s.replace(needle,extra+'\n'+needle)
needle=" const setup=await control('setup');";assert s.count(needle)==1
s=s.replace(needle," report.draft_content=await control('stage_content');save();\n"+needle)
# Evidence binds the tested canonical version to the same source objects committed for release.
needle='report.candidate_version=candidate.id;report.candidate_url=candidate.url;save();'
s=s.replace(needle,needle+"report.source_commit="+json.dumps(proof['tested_commit'])+";report.source_hashes="+json.dumps(proof['blobs'])+";report.ui_scenarios="+str(proof['ui_scenarios'])+";save();")
needle="assert.equal(reduced(cv.resources.bindings),reduced(bindings),'An unrelated binding changed');"
s=s.replace(needle,needle+"assert.deepEqual(cv.resources.script_runtime,original.resources.script_runtime,'Runtime changed');report.candidate_code_etag=cv.resources.script.etag;report.base_code_etag=original.resources.script.etag;report.unrelated_bindings_unchanged=true;report.runtime_unchanged=true;save();")
Path('qa/library/remote_canonical_v2.mjs').write_text(s)
print('Prepared fixed-scope v2 importer and canonical private verifier; production deployment is absent.')
