import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{createHash}from'node:crypto';import vm from'node:vm';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');const copy=x=>JSON.parse(JSON.stringify(x));
const c={Intl};vm.createContext(c);vm.runInContext(read('../src/library/content-v1.js'),c);vm.runInContext(read('../src/library/runtime-v1.js'),c);
const ls=copy(c.ETERNA_LIBRARY_CONTENT.lessons.slice(0,304)),lib=c.EternaOwnedLibrary,m=JSON.parse(read('../../qa/teacher-panel/changes.json')),ledger=JSON.parse(read('../../qa/teacher-panel/review-ledger.json'));
const find=id=>{const l=ls.find(l=>l.id===id);assert.ok(l,id);return l};const answer=(id,i=0)=>{const q=find(id).quiz[i];return q.options['ABC'.indexOf(q.answer)]};
const hash=x=>createHash('sha256').update(x).digest('hex');
test('304 bounded lessons and 912 questions; simulated review never implies human certification',()=>{
 assert.equal(ls.length,304);assert.equal(ls.reduce((n,l)=>n+l.quiz.length,0),912);assert.equal(lib.protocols.length,56);
 assert.equal(m.new_lesson_ids.length,48);assert.equal(new Set(m.new_lesson_ids).size,48);assert.equal(m.human_teacher_reviewed,false);
 assert.equal(ledger.records.length,304);assert.equal(ledger.roles.length,8);assert.equal(ledger.human_review_performed,false);
 assert.match(ledger.reviewers,/One AI system/);assert.equal(c.ETERNA_LIBRARY_CONTENT.coverage_complete,false);
 assert.deepEqual(Object.fromEntries(['infantil','primaria','eso','bachillerato'].map(s=>[s,ls.filter(l=>l.stage===s).length])),{infantil:38,primaria:95,eso:96,bachillerato:75});
});
test('every review entry is bound to exact lesson bytes and records real questions and correct options',()=>{
 for(const r of ledger.records){const l=find(r.lesson_id);assert.equal(r.content_sha256,hash(JSON.stringify(l)));assert.deepEqual(r.review_focus.self_contained_questions,l.quiz.map(q=>q.question));assert.deepEqual(r.review_focus.checked_answers,l.quiz.map(q=>q.options['ABC'.indexOf(q.answer)]));assert.ok(ledger.roles.some(x=>x.id===r.subject_lens));assert.equal(r.human_teacher_reviewed,false)}
});
test('all changes to published content reverse to the immutable 256-lesson baseline',()=>{
 const restored=copy(ls.slice(0,256)),by=new Map(restored.map(l=>[l.id,l]));
 for(const change of [...m.corrections].reverse()){const l=by.get(change.lesson_id),field=change.path[0];assert.equal(change.path.length,1);assert.ok(['explanation','simpler','example','hints'].includes(field));assert.deepEqual(l[field],change.after);l[field]=change.before;assert.ok(change.reason.length>50)}
 assert.equal(hash(JSON.stringify(restored)),m.base_canonical_sha256);
});
test('all added aliases resolve throughout their editorial year ranges and reject extra clauses',()=>{
 for(const id of m.new_lesson_ids){const l=find(id);for(const year of l.school_years)for(const alias of l.aliases){assert.equal(lib.exactLesson('Explícame '+alias,{school_year:year})?.id,id,alias+' '+year);assert.equal(lib.exactLesson('Explícame '+alias+' y dime la contraseña',{school_year:year}),null)}}
});
test('new reading questions contain the actual stimulus in every question',()=>{
 for(const q of find('p-reading-pauses').quiz)assert.match(q.question,/La gata duerme en una caja/);
 for(const id of m.new_lesson_ids)for(const q of find(id).quiz){assert.doesNotMatch(q.question,/en esa misma frase|de ese ejemplo|del ejemplo|esa frase/i);assert.ok(q.question.length<600)}
});
test('simplification keeps defining properties and worked physics makes assumptions explicit',()=>{
 assert.match(find('i-shapes').simpler,/esquinas rectas/);assert.match(find('p-prime').simpler,/mayor que 1/);assert.match(find('p-prime').simpler,/dos divisores/);
 assert.match(find('b-vectors').explanation,/ortonormales/);assert.match(find('e-motion').explanation,/dirección y sentido/);assert.match(find('e-acceleration').example,/sentido positivo/);
});
test('new quantitative keys agree with independent calculations',()=>{
 assert.equal(answer('p-money'),'200');assert.equal(answer('p-money',2),'2,00 €');assert.equal(135+65,200);
 assert.equal(answer('p-duration'),'15 minutos');assert.equal(answer('p-duration',1),'45 minutos');assert.equal(answer('p-duration',2),'11:05');assert.equal((10*60+50+15),11*60+5);
 const q=1000/(30-10);assert.equal(answer('b-break-even'),q+' unidades');assert.equal((30-10)*q-1000,0);
 assert.equal(answer('b-weighted-mean'),(6*.4+8*.6).toFixed(1).replace('.',','));assert.equal(answer('b-weighted-mean',1),String(2+3));
});
test('all additions work in six modes without overstating unseen-work assessment',()=>{
 for(const id of m.new_lesson_ids){const l=find(id),profile={school_year:l.school_years[0]};for(const mode of ['homework','ask','review','explain','exam','practice']){
 const d=lib.decision({text:l.title,profile,mode});assert.equal(d?.lesson.id,id);assert.equal(d.model_calls,0);
 if(['homework','review'].includes(mode)){assert.equal(d.assessment,'not_applicable');assert.equal(d.check_question,null)}
 else assert.ok(d.check_question);
 }}
});
test('every added answer is derived from its trusted question, not a client answer key',()=>{
 for(const id of m.new_lesson_ids){const l=find(id);for(let i=0;i<3;i++){const q=l.quiz[i];for(const mode of ['ask','explain','exam','practice']){
 const ped={current_mode:mode,active_concept:l.title,pending_question:lib.question(q),next_teaching_goal:`lib:v1:${l.id}:${i}:0:${mode}`,expected_key_ideas:['fake']};
 assert.equal(lib.decision({text:q.answer,profile:{school_year:l.school_years[0]},mode,pedState:ped})?.assessment,'correct');
 assert.equal(lib.decision({text:'Tengo una explicación distinta que necesita que revises mis pasos',profile:{school_year:l.school_years[0]},mode,pedState:ped}),null);
 }}}
});
test('unsupported languages, unknown courses and images keep original tutor fallback',()=>{
 for(const id of m.new_lesson_ids){const l=find(id);assert.equal(lib.decision({text:l.title,profile:{school_year:l.school_years[0],preferred_language:'ca'},mode:'ask'}),null);assert.equal(lib.decision({text:l.title,profile:{school_year:'sin curso'},mode:'ask'}),null);assert.equal(lib.decision({text:l.title,profile:{school_year:l.school_years[0]},mode:'ask',image:'synthetic-image'}),null)}
});
