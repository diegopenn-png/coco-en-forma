from pathlib import Path
import hashlib,json,re
proof=json.loads(Path('next-round-build/report.json').read_text());assert proof['tests_passed']==779 and proof['tests_failed']==0
raw=Path('.qa-auth/qa/library/remote_canonical_verify.mjs').read_bytes();assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()=='e17881ee2b99a689f309b9be281d62d74b401956'
s=raw.decode()
def one(a,b):
 global s
 assert s.count(a)==1,(a[:60],s.count(a));s=s.replace(a,b)
one("import '../../eterna-worker/src/library/content-v1.js';","import '../../eterna-worker/src/library/content-v1.js';\nimport '../../eterna-worker/src/library/procedural-v1.js';")
s=s.replace('eterna-library-2026.09-v1','eterna-library-2026.09-v6-310-traceable-12c672').replace("directory='library-canonical-evidence'","directory='next-round-private'")
s=s.replace('92a5712135b2530506669bc6b6baabba59e14cf9744087abbd22393ea1972adb',proof['blobs']['eterna-worker/src/index.js']['sha256']).replace('26aad7f15e50050a58edeeeca4012df5b58cde8f87d4928dddebc767a3241c21',proof['blobs']['eterna-worker/src/library/runtime-v1.js']['sha256'])
s=s.replace('0abf2be8-16c4-4695-96ae-48d0e9ef82fe','9480a578-cca5-4412-bbfd-fbfbf27c11c1').replace('regressions_passed:387','regressions_passed:779').replace('documents:58,chunks:13130,lessons:80,protocols:24','lessons:310,protocols:56,questions:930').replace('health.owned_library.lessons,80','health.owned_library.lessons,310').replace('health.owned_library.protocols,24','health.owned_library.protocols,56')
one("x.filter(b=>!['ENABLE_ETERNA_LIBRARY','ETERNA_LIBRARY_RELEASE'].includes(b.name))","[...x]")
one("assert.equal(reduced(cv.resources.bindings),reduced(bindings),'An unrelated binding changed');","assert.equal(reduced(cv.resources.bindings),reduced(bindings),'Any binding changed');assert.deepEqual(cv.resources.script_runtime,original.resources.script_runtime);report.candidate_code_etag=cv.resources.script.etag;report.base_code_etag=original.resources.script.etag;report.source_hashes="+json.dumps(proof['blobs'])+";report.tested_commit="+json.dumps(proof['tested_commit'])+";report.bindings_unchanged=true;report.runtime_unchanged=true;save();")
one("async function chat(text,mode='ask',previous=null){","async function chat(text,mode='ask',previous=null,action=null){")
one("student_action:previous?'answer':'new_topic'","student_action:action||(previous?'answer':'new_topic')")
start=s.index(' for(const [stage,lid]of [[');end=s.index(' await new Promise(r=>setTimeout(r,2000));',start)
s=s[:start]+Path('qa/next-round/private_turns.mjs').read_text()+'\n'+s[end:]
one("report.phase='canonical-private-verified';","assert.equal(report.requests.length,52);assert.equal(report.adjacent_round_checks.length,8);report.phase='canonical-private-verified';")
s=s.replace("apodo:'Prueba Sintética'","apodo:'QA Ronda '+NONCE.slice(0,12)")
Path('qa/next-round/remote.generated.mjs').write_text(s)
print('Prepared exact next-round regression test with one disposable identity and no production/content/configuration writes.')
