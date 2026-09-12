// Reproducible content expansion over the exact published v1.1 source.
import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
import{createHash}from'node:crypto';
import assert from'node:assert/strict';
const hash=v=>createHash('sha256').update(v).digest('hex');
const base='e40e3bbbd7d6ae464a9e17659cd8ae3d36245852',release='eterna-library-2026.09-v2';
const files={'eterna-worker/src/index.js':'0a142b6705aa1ee4b63562cd59cfc66c8e5702768d5413e46c94106f6e1eb52c','eterna-worker/src/library/runtime-v1.js':'ed83c7f574db28c0e32e996579aed1ac9f03a85e91a2d59ff1cf28eb94c1b976','eterna-worker/src/library/content-v1.js':'907fff5cb8baca727b4c6cc692ce337668c1650bcb020f5ba0d86fb022d1da47','eterna-worker/test/library-first.test.mjs':'255b389be9929bf8519caab35e464d0a68606d28a4f38b65104218a6f64713b6'};
for(const[p,h]of Object.entries(files))assert.equal(hash(readFileSync(p)),h,'Unexpected base '+p);
const old=JSON.parse(readFileSync('qa/library/lessons-v1.json'));
assert.equal(old.length,80);
const parts={infantil:['infantil'],primaria:['primaria-matematicas','primaria-materias'],eso:['eso'],bachillerato:['bachillerato']},source={infantil:'BOE-A-2022-1654',primaria:'BOE-A-2022-3296',eso:'BOE-A-2022-4975',bachillerato:'BOE-A-2022-5521'};
const additions=[];
for(const[stage,names]of Object.entries(parts))for(const name of names){
 for(const line of readFileSync('qa/library-v2/'+name+'.txt','utf8').trim().split('\n')){
  const columns=line.split('|');assert.equal(columns.length,12,name+' '+line.slice(0,40));
  const[id,title,subject,grades,aliases,explanation,simpler,example,checks,hint,misconception,why]=columns;
  const[min,max]=grades.split('-').map(Number);assert.ok(min<=max&&min>=1);
  const quiz=checks.split('$').map((raw,i)=>{const c=raw.split('~');assert.equal(c.length,5,id);assert.match(c[4],/^[ABC]$/);return{id:id+':q'+i,question:c[0],options:c.slice(1,4),answer:c[4],hint,level:i+1}});
  assert.equal(quiz.length,3,id);
  const years=Array.from({length:max-min+1},(_,i)=>stage==='infantil'?`Infantil · ${min+i} años`:`${min+i}º de ${{primaria:'Primaria',eso:'ESO',bachillerato:'Bachillerato'}[stage]}`);
  let namesForLookup=[title,...aliases.split(';')];
  // This colloquial phrase can mean the semicolon, not the two separate signs.
  namesForLookup=namesForLookup.filter(a=>a!=='punto y coma en una frase');
  additions.push({id,stage,subject,title,grade_min:min,grade_max:max,school_years:years,aliases:[...new Set(namesForLookup)],explanation,simpler,example,why,misconception,hints:[hint,simpler,example],quiz,curriculum_source:'https://www.boe.es/buscar/act.php?id='+source[stage],curriculum_source_key:source[stage],source_kind:'original_teaching_material',grade_mapping:'editorial_progression_not_official_grade_mandate',review_method:'AI-assisted editorial review plus structural and deterministic tests; not human teacher certification',human_teacher_reviewed:false,language:'es',license_note:'Material original preparado para ETERNA; referencia curricular por etapa, sin aval oficial.',curriculum_alignment_status:'stage_subject_reference_not_exhaustive_criterion_mapping',introduced_in_release:release});
 }
}
assert.equal(additions.length,80);const lessons=[...old,...additions];assert.equal(new Set(lessons.map(l=>l.id)).size,160);
for(let i=0;i<80;i++)assert.deepEqual(lessons[i],old[i],'Existing lesson changed');
const payload={release_id:release,coverage_complete:false,human_teacher_reviewed:false,archive_release:'eterna-library-2026.09-v1',lessons};
writeFileSync('eterna-worker/src/library/content-v1.js','/* Original ETERNA teaching content. Not complete curricular coverage or official endorsement. */\nglobalThis.ETERNA_LIBRARY_CONTENT='+JSON.stringify(payload)+';\n');
let runtime=readFileSync('eterna-worker/src/library/runtime-v1.js','utf8');
const protocols=JSON.parse(readFileSync('qa/library-v2/protocolos.json'));assert.equal(protocols.length,16);
const anchor='  ]);\n  const protocolIndex';assert.equal(runtime.split(anchor).length,2);
runtime=runtime.replace(anchor,',\n'+protocols.map(p=>'    '+JSON.stringify({id:p.id,aliases:p.aliases})).join(',\n')+'\n'+anchor);
const cases=protocols.map(p=>`      case ${JSON.stringify(p.id)}:return young?${JSON.stringify(p.young)}:${JSON.stringify(p.standard)};`).join('\n');
assert.equal(runtime.split('      default:return null;').length,2);runtime=runtime.replace('      default:return null;',cases+'\n      default:return null;');
runtime=runtime.replace("VERSION='library-first-v1.1'","VERSION='library-first-v2.0-content'").replaceAll('eterna-library-2026.09-v1',release);
writeFileSync('eterna-worker/src/library/runtime-v1.js',runtime);
// The Worker integration changes only the content-release identifier. No new router or access path.
const index=readFileSync('eterna-worker/src/index.js','utf8');assert.ok(index.includes('eterna-library-2026.09-v1'));
writeFileSync('eterna-worker/src/index.js',index.replaceAll('eterna-library-2026.09-v1',release));
let test=readFileSync('eterna-worker/test/library-first.test.mjs','utf8').replaceAll('eterna-library-2026.09-v1',release);
for(const[from,to]of [['library has 80 actual micro-lessons, 240','library has 160 actual micro-lessons, 480'],['h.lessons.length,80','h.lessons.length,160'],['l=>l.id)).size,80','l=>l.id)).size,160'],['l=>l.quiz).length,240','l=>l.quiz).length,480'],['all 240','all 480'],['24 cordial protocols','40 cordial protocols'],['h.library.protocols.length,24','h.library.protocols.length,40'],['all 480 lesson-mode','all 960 lesson-mode']])test=test.replaceAll(from,to);
writeFileSync('eterna-worker/test/library-first.test.mjs',test);
mkdirSync('library-v2-evidence',{recursive:true});
writeFileSync('qa/library-v2/lessons-v2.json',JSON.stringify(lessons,null,2)+'\n');
const report={base_commit:base,release,lessons:lessons.length,new_lessons:additions.length,questions:lessons.flatMap(l=>l.quiz).length,protocols:40,new_protocols:16,old_lessons_unchanged:true,stages:Object.fromEntries(Object.keys(parts).map(s=>[s,lessons.filter(l=>l.stage===s).length])),curriculum_complete:false,human_teacher_reviewed:false,archive_release:'eterna-library-2026.09-v1',production_changed:false,source_hashes:Object.fromEntries(Object.keys(files).map(p=>[p,hash(readFileSync(p))]))};
writeFileSync('library-v2-evidence/build.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
