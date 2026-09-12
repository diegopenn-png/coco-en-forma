import{readFileSync,writeFileSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';import vm from'node:vm';import assert from'node:assert/strict';
const release='eterna-library-2026.09-v3-217-6b83',oldRelease='eterna-library-2026.09-v2-160-3069e276';
const base=JSON.parse(readFileSync('qa/library/lessons-v1.json')),extra=JSON.parse(readFileSync('.additional/qa/library-v2/lessons-v2.json')),protocols=JSON.parse(readFileSync('.additional/qa/library-v2/protocolos.json'));
assert.equal(base.length,160);assert.equal(extra.length,160);
const h=x=>createHash('sha256').update(x).digest('hex'),originalSource=readFileSync('eterna-worker/src/index.js','utf8'),originalRuntime=readFileSync('eterna-worker/src/library/runtime-v1.js','utf8');
assert.equal(h(originalSource),'fea7fcf5085200f8472eb83a340b774f8e0ba017160a6bf9d0f57e3ad0698ae4');assert.equal(h(originalRuntime),'b2b4152e3dc66fee81a71b1abf04e7c34022532ca06b8ca5c6eef9707def93bc');
const ctx={};vm.createContext(ctx);vm.runInContext(originalRuntime,ctx);const beforeProtocols=ctx.EternaOwnedLibrary.protocols;
const norm=v=>String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-ES').replace(/[¿?¡!.,;:]/g,' ').replace(/\s+/g,' ').trim().replace(/^(?:el|la|los|las|un|una) /,'');
const overlap=(a,b)=>a.stage===b.stage&&a.grade_min<=b.grade_max&&b.grade_min<=a.grade_max;
const aliases=l=>[l.title,...l.aliases].map(norm),added=[],alternatives=[];
for(const l of extra){const same=base.find(x=>x.id===l.id);if(same){if(JSON.stringify(same)!==JSON.stringify(l))alternatives.push({reason:'existing_id_preserved',lesson:l});continue}
 const known=new Set([...base,...added].filter(x=>overlap(x,l)).flatMap(aliases));
 if(known.has(norm(l.title))){alternatives.push({reason:'overlapping_title_preserved',lesson:l});continue}
 const copy=JSON.parse(JSON.stringify(l));copy.aliases=copy.aliases.filter(a=>!known.has(norm(a)));added.push(copy)
}
assert.equal(added.length,57);const lessons=[...base,...added];assert.equal(lessons.length,217);
const knownP=new Set(beforeProtocols.map(p=>p.id)),knownA=new Set(beforeProtocols.flatMap(p=>p.aliases)),newProtocols=protocols.filter(p=>!knownP.has(p.id)).map(p=>({...p,aliases:p.aliases.filter(a=>!knownA.has(a))})).filter(p=>p.aliases.length);assert.equal(newProtocols.length,16);
let runtime=originalRuntime;const marker='\n  ]);\n  const protocolIndex';assert.equal(runtime.split(marker).length,2);
runtime=runtime.replace(marker,',\n'+newProtocols.map(p=>'    '+JSON.stringify({id:p.id,aliases:p.aliases})).join(',\n')+marker);
assert.equal(runtime.split('      default:return null;').length,2);runtime=runtime.replace('      default:return null;',newProtocols.map(p=>`      case ${JSON.stringify(p.id)}:return young?${JSON.stringify(p.young)}:${JSON.stringify(p.standard)};`).join('\n')+'\n      default:return null;');
runtime=runtime.replace("VERSION='library-first-v2'","VERSION='library-first-v3-combined'").replaceAll(oldRelease,release);
const payload={release_id:release,coverage_complete:false,human_teacher_reviewed:false,archive_release:'eterna-library-2026.09-v1',lessons};
writeFileSync('eterna-worker/src/library/content-v1.js','/* Original ETERNA teaching library, not complete curriculum or official endorsement. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+JSON.stringify(payload)+';\n');
writeFileSync('eterna-worker/src/library/runtime-v1.js',runtime);writeFileSync('eterna-worker/src/index.js',originalSource.replaceAll(oldRelease,release));
writeFileSync('qa/library/lessons-v1.json',JSON.stringify(lessons,null,2)+'\n');
let test=readFileSync('eterna-worker/test/library-first.test.mjs','utf8').replaceAll(oldRelease,release);
for(const[a,b]of [['160 actual micro-lessons, 480','217 actual micro-lessons, 651'],['h.lessons.length,160','h.lessons.length,217'],['l=>l.id)).size,160','l=>l.id)).size,217'],['l=>l.quiz).length,480','l=>l.quiz).length,651'],['all 480 known','all 651 known'],['40 cordial protocols','56 cordial protocols'],['h.library.protocols.length,40','h.library.protocols.length,56'],['assert.equal(n,800)','assert.equal(n,1085)'],['all 480 lesson-mode','all 1302 lesson-mode']])test=test.replaceAll(a,b);
const hashBase=h(JSON.stringify(base));
test+=`\ntest('combined library preserves exact latest 160 teaching objects',async()=>{const h=harness();assert.equal(h.sandbox.ETERNA_LIBRARY_CONTENT.release_id,${JSON.stringify(release)});const{createHash}=await import('node:crypto');assert.equal(createHash('sha256').update(JSON.stringify(plain(h.lessons.slice(0,160)))).digest('hex'),${JSON.stringify(hashBase)});});\n`;
const addedIds=added.map(l=>l.id);test+=`\ntest('combined content adds 57 noncolliding lesson identities',()=>{const h=harness();assert.deepEqual(h.lessons.slice(160).map(l=>l.id).join(','),${JSON.stringify(addedIds.join(','))});});\n`;
const numericalSource=readFileSync('.additional/eterna-worker/test/library-v2-content.test.mjs','utf8'),begin=numericalSource.indexOf('const gcd='),end=numericalSource.indexOf('for(const[id,pos,expected]of checks)');
assert.ok(begin>0&&end>begin);const numbers=numericalSource.slice(begin,end);
test+=`\nconst combinedGet=id=>{const h=harness(),l=h.lessons.find(l=>l.id===id);assert.ok(l);return l};\nconst get=combinedGet;\n`+numbers+`\nfor(const[id,pos,expected]of checks.filter(([id])=>${JSON.stringify(addedIds)}.includes(id)))test('combined independent numerical oracle '+id+' '+pos,()=>{const q=get(id).quiz[pos];assert.equal(q.options['ABC'.indexOf(q.answer)],expected())});\n`;
writeFileSync('eterna-worker/test/library-first.test.mjs',test);
mkdirSync('combined-evidence',{recursive:true});mkdirSync('qa/library-combined',{recursive:true});
writeFileSync('qa/library-combined/alternatives-not-activated.json',JSON.stringify(alternatives,null,2));writeFileSync('qa/library-combined/protocols-added.json',JSON.stringify(newProtocols,null,2));
const report={release,base_commit:'6b83b043e85d0eb15e629affb0f42d2957a6cc83',base_release:oldRelease,lessons:217,added_over_current:57,questions:651,protocols:56,new_protocols:16,base_160_preserved:true,alternatives_not_activated:alternatives.length,source_archive_modified:false,full_curriculum_complete:false,human_teacher_reviewed:false,base_source_sha256:h(originalSource),base_runtime_sha256:h(originalRuntime),source_sha256:h(readFileSync('eterna-worker/src/index.js')),runtime_sha256:h(runtime),content_sha256:h(readFileSync('eterna-worker/src/library/content-v1.js')),production_changed:false};
writeFileSync('combined-evidence/build.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
