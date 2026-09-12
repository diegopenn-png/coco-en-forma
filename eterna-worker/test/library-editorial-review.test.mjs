import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{createHash}from'node:crypto';
import vm from'node:vm';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const context={Intl};vm.createContext(context);
vm.runInContext(read('../src/library/content-v1.js'),context);vm.runInContext(read('../src/library/runtime-v1.js'),context);
const ls=JSON.parse(JSON.stringify(context.ETERNA_LIBRARY_CONTENT.lessons)),lib=context.EternaOwnedLibrary;
const manifest=JSON.parse(read('../../qa/curriculum-review/corrections.json'));
const get=id=>{const l=ls.find(x=>x.id===id);assert.ok(l,id);return l};
const correct=(id,i=0)=>{const q=get(id).quiz[i];return q.options['ABC'.indexOf(q.answer)]};

test('review has exact finite scope, explicit limitations and 39 actual additions',()=>{
 assert.equal(ls.length,256);assert.equal(ls.reduce((n,l)=>n+l.quiz.length,0),768);assert.equal(lib.protocols.length,56);
 assert.equal(manifest.new_ids.length,39);assert.equal(new Set(manifest.new_ids).size,39);
 assert.equal(context.ETERNA_LIBRARY_CONTENT.coverage_complete,false);assert.equal(context.ETERNA_LIBRARY_CONTENT.human_teacher_reviewed,false);
 assert.deepEqual(Object.fromEntries(['infantil','primaria','eso','bachillerato'].map(s=>[s,ls.filter(l=>l.stage===s).length])),{infantil:30,primaria:87,eso:84,bachillerato:55});
});

test('every original content change is declared and reversible to the full 217-lesson baseline',()=>{
 const restored=structuredClone(ls.slice(0,217)),by=new Map(restored.map(l=>[l.id,l]));
 for(const c of [...manifest.changes].reverse()){
  assert.equal(c.human_teacher_reviewed,false);assert.ok(c.reason.length>30);const l=by.get(c.lesson_id);assert.ok(l);
  assert.notEqual(c.path[0],'id');assert.notEqual(c.path.at(-1),'answer');let target=l;
  for(const k of c.path.slice(0,-1))target=target[k];const k=c.path.at(-1);
  assert.deepEqual(target[k],c.after,c.lesson_id+' '+c.path.join('.'));target[k]=c.before;
 }
 assert.equal(createHash('sha256').update(JSON.stringify(restored)).digest('hex'),manifest.base_canonical_sha256);
});

test('all corrected questions are usable without an invisible worked example',()=>{
 for(const l of ls)for(const q of l.quiz){
  assert.doesNotMatch(q.question,/\b(?:del ejemplo|en ese ejemplo|ese ortoedro|ese cuento|nuestro cuento|del ángulo del ejemplo|segunda oración del ejemplo)\b/i,l.id);
  assert.ok(q.question.length<600,l.id+' exceeds state-boundary allowance');
 }
 for(const id of ['i-listening','i-story','p-inference']){
  for(const change of manifest.changes.filter(c=>c.lesson_id===id&&c.path[0]==='quiz'&&c.path.at(-1)==='question'))assert.match(change.after,/[«»]/);
 }
});

test('corrected question choices and original stable ids survive all modes',()=>{
 for(const c of manifest.changes.filter(c=>c.path[0]==='quiz'&&c.path.at(-1)==='question')){
  const l=get(c.lesson_id),pos=c.path[1],q=l.quiz[pos];
  for(const mode of ['explain','ask','practice','exam']){
   const ped={current_mode:mode,active_concept:l.title,pending_question:lib.question(q),next_teaching_goal:`lib:v1:${l.id}:${pos}:0:${mode}`};
   const r=lib.decision({text:q.answer,profile:{school_year:l.school_years[0]},mode,pedState:ped});assert.equal(r?.assessment,'correct',l.id);
   const stale={...ped,pending_question:c.before};assert.equal(lib.decision({text:q.answer,profile:{school_year:l.school_years[0]},mode,pedState:stale}),null,'stale question must use existing tutor, not wrong prepared grading');
  }
 }
});

test('new numerical answers match independent arithmetic rather than model assertions',()=>{
 assert.equal(correct('p-polygons'),'Cinco');assert.equal(correct('p-triangle-area'),`${10*4/2} cm²`);
 assert.equal(correct('e-budget'),`${40-28} €`);assert.equal(correct('e-reflection'),'25°');assert.equal(correct('e-reflection',2),'60° con la superficie');
 assert.equal(correct('b-sequences'),String(3+(5-1)*4));assert.equal(correct('b-sequences',1),String(2*3**(3-1)));
 assert.equal(correct('b-stoichiometry'),`${4/2} mol de O₂`);assert.equal(30<=2*20,true);assert.equal(correct('b-climograph'),'Sí');
 assert.equal(correct('b-greek-alphabet'),'24');
});

test('chain-rule answers pass independent finite-difference probes',()=>{
 assert.equal(correct('b-chain'),'6(3x+1)');assert.equal(correct('b-chain',1),'2 cos(2x)');
 for(const x of [-3,-.4,0,.7,3]){
  const h=1e-5;const d1=(((3*(x+h)+1)**2)-((3*(x-h)+1)**2))/(2*h);
  assert.ok(Math.abs(d1-6*(3*x+1))<1e-5);
  const d2=(Math.sin(2*(x+h))-Math.sin(2*(x-h)))/(2*h);assert.ok(Math.abs(d2-2*Math.cos(2*x))<1e-6);
 }
});

test('new content is curriculum support with optional/modality limits, never fabricated universal mandate',()=>{
 for(const id of manifest.new_ids){const l=get(id);assert.equal(l.human_teacher_reviewed,false);assert.equal(l.curriculum_alignment_status,'stage_subject_reference_not_exhaustive_criterion_mapping');assert.match(l.subject_availability,/territorial curriculum, modality/);assert.ok(l.why.length>=50);assert.equal(l.quiz.length,3)}
 assert.equal(get('e-latin-cases').grade_min,4);assert.equal(get('b-greek-alphabet').grade_max,1);assert.equal(get('b-art-analysis').grade_min,2);
});

test('every new alias remains unambiguous throughout its full course range',()=>{
 for(const id of manifest.new_ids){const l=get(id);for(const year of l.school_years)for(const alias of [l.title,...l.aliases])assert.equal(lib.exactLesson('Me puedes explicar '+alias,{school_year:year})?.id,id,year+' '+alias)}
});

test('added physical-education and civic material protects agency and avoids clinical prescription',()=>{
 for(const id of ['e-endurance','e-coordination','e-fair-play','b-physical-plan']){
  const l=get(id);assert.match(l.explanation+' '+l.example,/adapt|supervis|segur|cuid|atención/i);assert.doesNotMatch(l.example,/\b(?:mg|pastilla|dieta|kilocalorías)\b/i);
 }
 assert.match(get('p-child-rights').explanation,/No hay que ganarse esos derechos/);
 assert.match(get('p-equality').explanation,/escuchar/i);
});

test('reading embarrassment is acknowledged without shaming or changing protocol identity',()=>{
 const p=lib.protocol('me da vergüenza leer');assert.equal(p?.protocol,'reading_embarrassment');
 const r=lib.cordial(p.protocol,{profile:{school_year:'2º de Primaria'},base:{apodo:'Prueba'}});
 assert.match(r,/Es comprensible/);assert.match(r,/a tu ritmo/);assert.doesNotMatch(r,/no es un motivo de vergüenza/);
});

test('science corrections distinguish physical definitions and model limits',()=>{
 assert.doesNotMatch(get('p-water').explanation,/condensarse formando gotitas o cristales/);assert.match(get('p-water').explanation,/agua líquida/);
 assert.match(get('p-perimeter').explanation,/En un polígono/);assert.match(get('b-work').example,/mismo sentido/);
 assert.match(get('e-mendel').explanation,/fenotipo/);assert.match(get('e-cell').explanation,/especializadas/);
 assert.deepEqual(get('p-noun').quiz[0].options,['La','Mochila','Pesa']);assert.equal(get('p-noun').quiz[0].answer,'B');
});
