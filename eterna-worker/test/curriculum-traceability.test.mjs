import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import vm from'node:vm';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8'),copy=x=>JSON.parse(JSON.stringify(x));
const c={Intl};vm.createContext(c);vm.runInContext(read('../src/library/content-v1.js'),c);vm.runInContext(read('../src/library/runtime-v1.js'),c);
const ls=copy(c.ETERNA_LIBRARY_CONTENT.lessons),lib=c.EternaOwnedLibrary,m=JSON.parse(read('../../qa/curriculum-map/release-manifest.json')),links=JSON.parse(read('../../qa/curriculum-map/reviewed-partial-links.json'));
const hash=x=>createHash('sha256').update(x).digest('hex');const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
test('traceable release adds exactly six supports and preserves all prior lesson bytes',()=>{
 assert.equal(ls.length,310);assert.equal(ls.flatMap(l=>l.quiz).length,930);assert.equal(lib.protocols.length,56);
 assert.equal(hash(JSON.stringify(ls.slice(0,304))),m.baseline_canonical_sha256);assert.deepEqual(ls.slice(304).map(l=>l.id),m.added_lesson_ids);assert.equal(m.runtime_algorithms_unchanged,true);assert.equal(m.full_curriculum_complete,false);
 assert.deepEqual(Object.fromEntries(['infantil','primaria','eso','bachillerato'].map(stage=>[stage,ls.filter(l=>l.stage===stage).length])),{infantil:38,primaria:95,eso:97,bachillerato:80});
});
test('six gap supports have safe complete questions and consistent answers in all modes',()=>{
 const expected={'e-app-permissions':'BAC','b-ecosystem-matter':'ABC','b-compound-meter':'BAC','b-stage-directions':'CAB','b-affine-cost':'BAC','b-art-project':'ABC'};
 for(const l of ls.slice(304)){
  assert.equal(l.quiz.map(q=>q.answer).join(''),expected[l.id]);assert.equal(l.human_teacher_reviewed,false);
  for(const mode of ['homework','ask','review','explain','exam','practice']){
   const r=lib.decision({text:'Explícame '+l.title,profile:{school_year:l.school_years[0]},mode});assert.equal(r.lesson.id,l.id);assert.equal(r.model_calls,0);
  }
  for(let pos=0;pos<3;pos++){
   const q=l.quiz[pos],p={current_mode:'exam',active_concept:l.title,pending_question:lib.question(q),next_teaching_goal:`lib:v1:${l.id}:${pos}:0:exam`};
   assert.equal(lib.decision({text:q.answer,profile:{school_year:l.school_years[0]},mode:'exam',pedState:p}).assessment,'correct');
   assert.equal(lib.decision({text:'Depende de otro contexto y quiero dar un argumento diferente',profile:{school_year:l.school_years[0]},mode:'exam',pedState:p}),null);
  }
 }
});
test('reviewed source links bind exact lesson and exact original text, never claim criterion fulfilment',()=>{
 assert.equal(links.length,12);assert.equal(new Set(links.map(r=>r.lesson_id)).size,6);
 for(const r of links){const l=ls.find(l=>l.id===r.lesson_id);assert.ok(l);assert.equal(hash(JSON.stringify(canon(l))),r.lesson_sha256);assert.equal(hash(r.source_text),r.unit_text_sha256);assert.equal(r.official_subject,l.subject);assert.equal(r.status,'ai_reviewed_partial_support');assert.equal(r.whole_criterion_mastery_claimed,false);assert.equal(r.territorial_alignment_checked,false);assert.equal(r.human_teacher_reviewed,false);assert.ok(r.scope_rationale.length>80);assert.match(r.official_url,/^https:\/\/www\.boe\.es\//)}
});
test('cost model is arithmetically correct and explicitly bounded, not direct proportionality',()=>{
 const l=ls.find(l=>l.id==='b-affine-cost'),answer=l.quiz[1].options['ABC'.indexOf(l.quiz[1].answer)];assert.equal(answer,`${50+3*10} €`);assert.notEqual(50+3*20,2*(50+3*10));assert.match(l.example,/entre 0 y 20/);assert.match(l.misconception,/no representa proporcionalidad directa/);
});
test('new music, science and civic explanations preserve essential nuance',()=>{
 const get=id=>ls.find(l=>l.id===id);assert.match(get('b-compound-meter').explanation,/habitual/);assert.match(get('b-compound-meter').why,/dos pulsos/);assert.match(get('b-ecosystem-matter').explanation,/calor/);assert.match(get('e-app-permissions').explanation,/no garantiza privacidad absoluta/);assert.match(get('b-stage-directions').example,/Fragmento original/);assert.match(get('b-art-project').explanation,/se escuchan aportaciones/);
});
