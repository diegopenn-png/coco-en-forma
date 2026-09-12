"""Adapt only the previously proven private QA tool; no production deployment."""
from pathlib import Path
from hashlib import sha256
p=Path('.v2-previous-qa.mjs');s=p.read_text()
assert sha256(s.encode()).hexdigest()=='c5adcafd2a2b3d9ede7f615046705c9405ddcfe1891ccaf0feaa1263497db4dc'
s=s.replace("import '../../eterna-worker/src/library/content-v1.js';","import '../../eterna-worker/src/library/content-v1.js';\nimport '../../eterna-worker/src/library/runtime-v1.js';\nconst officialDocs=JSON.parse(readFileSync('library-v2-source-evidence/documents.json')),officialChunks=JSON.parse(readFileSync('library-v2-source-evidence/chunks.json'));")
s=s.replace('eterna-library-2026.09-v1','eterna-library-2026.09-v2').replace('library-canonical-evidence','library-v2-evidence')
s=s.replace('92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb','c0a46f5eb8fbcc014be1fb51e2ee5cc3e90fec2a5cb46a222bfc4d4bfacd0156').replace('26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21','faa289b941fb995a6cdecf924bc9c7ea32973fa9ad6c624ef386d11ca2c0f421')
s=s.replace('0abf2be8-16c4-4695-96ae-48d0e9ef82fe','438466cb-f081-48f1-a4cc-7986deb58f8a').replace('regressions_passed:387','regressions_passed:474')
s=s.replace('db_import_counts:{documents:58,chunks:13130,lessons:80,protocols:24}','db_import_counts:{documents:officialDocs.length,chunks:officialChunks.length,lessons:160,protocols:40}')
s=s.replace('health.owned_library.lessons,80','health.owned_library.lessons,160').replace('health.owned_library.protocols,24','health.owned_library.protocols,40')
s=s.replace("[['infantil','i-count'],['primaria','p-prime'],['eso','e-equation'],['bachillerato','b-derivative']]","[['infantil','i-count'],['primaria','p-prime'],['eso','e-equation'],['bachillerato','b-derivative'],['infantil','i-sorting'],['primaria','p-solar'],['eso','e-median'],['bachillerato','b-logarithms']]")
s=s.replace("chat('Explícame '+lesson.title,mode)","chat('Hola Eterna, me puedes explicar '+lesson.title+', por favor',mode)")
start=s.index(" for(const text of ['Hola Eterna'");end=s.index('\n await new Promise',start)
s=s[:start]+" for(const item of globalThis.EternaOwnedLibrary.protocols)await chat(item.aliases[0]);"+s[end:]
# Import public content only after the 120 real authenticated cases succeed.
needle="report.phase='canonical-private-verified';"
s=s.replace(needle,"assert.equal(report.requests.length,120);report.import_verification=await control('stage-content');assert.equal(report.import_verification.lessons,160);assert.equal(report.import_verification.protocols,40);"+needle)
needle="const helper=`const ACCESS="
replacement="const helper=`import './library/content-v1.js';\\nimport './library/runtime-v1.js';\\nconst OFFICIAL_DOCS=${JSON.stringify(officialDocs)},OFFICIAL_CHUNKS=${JSON.stringify(officialChunks)};\\nconst ACCESS="
assert needle in s;s=s.replace(needle,replacement)
s=s.replace("'bachillerato','stats','cleanup'","'bachillerato','stats','cleanup','stage-content'")
block="""  if(command==='stage-content'){
   const release=globalThis.ETERNA_LIBRARY_CONTENT.release_id;if(release!=='eterna-library-2026.09-v2')throw Error('LIBRARY_RELEASE_MISMATCH');
   const gates=await sb('/rest/v1/eterna_library_releases?release_id=eq.'+release+'&select=status');if(gates.length!==1||gates[0].status!=='draft')throw Error('RELEASE_NOT_DRAFT');
   const originals=globalThis.ETERNA_LIBRARY_CONTENT.lessons;
   const lessons=[];for(const l of originals)lessons.push({lesson_id:release+':'+l.id,release_id:release,stage:l.stage,subject:l.subject,title:l.title,school_years:l.school_years,aliases:l.aliases,review_status:'editorial_checked',payload:l,content_sha256:await digest(JSON.stringify(l))});
   const protocols=[];for(const p of globalThis.EternaOwnedLibrary.protocols){const payload={...p,implementation:'eterna-worker/src/library/runtime-v1.js',release,context_sensitive:true,sample_response:globalThis.EternaOwnedLibrary.cordial(p.id,{now:new Date('2026-09-12T10:00:00Z')}),sample_is_fixture_not_live_answer:true,human_teacher_reviewed:false};protocols.push({protocol_id:release+':'+p.id,release_id:release,payload,content_sha256:await digest(JSON.stringify(payload))})}
   const tables={eterna_library_lessons:lessons,eterna_library_protocols:protocols,eterna_library_documents:OFFICIAL_DOCS,eterna_library_chunks:OFFICIAL_CHUNKS};
   for(const[table,rows]of Object.entries(tables)){if(rows.some(r=>r.release_id!==release))throw Error('IMPORT_RELEASE_SCOPE');for(let i=0;i<rows.length;i+=40)await sb('/rest/v1/'+table,'POST',rows.slice(i,i+40))}
   const stored=await sb('/rest/v1/eterna_library_lessons?release_id=eq.'+release+'&select=lesson_id,payload,content_sha256');
   const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
   if(stored.length!==lessons.length)throw Error('LESSON_COUNT_MISMATCH');
   for(const row of stored){const expected=lessons.find(l=>l.lesson_id===row.lesson_id);if(!expected||row.content_sha256!==expected.content_sha256||JSON.stringify(canonical(row.payload))!==JSON.stringify(canonical(expected.payload)))throw Error('STORED_LESSON_MISMATCH')}
   const storedProtocols=await sb('/rest/v1/eterna_library_protocols?release_id=eq.'+release+'&select=protocol_id,payload,content_sha256');if(storedProtocols.length!==protocols.length)throw Error('PROTOCOL_COUNT_MISMATCH');
   for(const row of storedProtocols){const expected=protocols.find(p=>p.protocol_id===row.protocol_id);if(!expected||row.content_sha256!==expected.content_sha256||JSON.stringify(canonical(row.payload))!==JSON.stringify(canonical(expected.payload)))throw Error('STORED_PROTOCOL_MISMATCH')}
   return reply({ok:true,lessons:stored.length,protocols:storedProtocols.length,documents:OFFICIAL_DOCS.length,chunks:OFFICIAL_CHUNKS.length,lesson_payloads_exact:true,protocol_payloads_exact:true,official_sources_quarantined:true})
  }
"""
needle="  if(command==='stats'){";assert needle in s;s=s.replace(needle,block+needle)
Path('qa/library/remote_v2.generated.mjs').write_text(s)
print('Generated private QA tool; no production deployment; expected real cases 120')
