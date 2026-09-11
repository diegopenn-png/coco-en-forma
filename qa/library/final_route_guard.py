"""Final additive guards against ambiguous numeric answers and language mismatch."""
from pathlib import Path
import hashlib
p=Path('eterna-worker/src/library/runtime-v1.js');s=p.read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='3eb25369a980593d4ca81a54cf31e2f7a3ee7c5cdd22c62237bb0e80dddcde13'
a="function appropriate(lesson,profile){const p=school(profile);return !!p&&p.stage===lesson.stage&&p.grade>=lesson.grade_min&&p.grade<=lesson.grade_max}"
b="function appropriate(lesson,profile){if(profile?.preferred_language&&!/^es(?:-es)?$/i.test(profile.preferred_language))return false;const p=school(profile);return !!p&&p.stage===lesson.stage&&p.grade>=lesson.grade_min&&p.grade<=lesson.grade_max}"
assert a in s;s=s.replace(a,b)
a="    const s=whole(text),letter=s.match(/^(?:(?:creo que es|creo que|la respuesta es|la opcion|opcion|la) )?([abc])$/);\n    if(letter)return letter[1].toUpperCase();\n    const matches=q.options.map((o,i)=>[norm(o),'ABC'[i]]).filter(([o])=>o===s||'es '+o===s);"
b="""    const s=whole(text),letter=s.match(/^(?:(?:creo que es|creo que|la respuesta es|la opcion|opcion|la) )?(a|b|c|be|ce)$/);
    if(letter)return {a:'A',b:'B',be:'B',c:'C',ce:'C'}[letter[1]];
    // Keep signs, decimal separators, powers, units and negation significant.
    const exact=v=>String(v??'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLocaleLowerCase('es-ES').replace(/−/g,'-').replace(/\\s+/g,' ').trim();
    const value=exact(text),matches=q.options.map((o,i)=>[exact(o),'ABC'[i]]).filter(([o])=>o===value||'es '+o===value);"""
assert a in s;s=s.replace(a,b);p.write_text(s)
print('Guarded runtime SHA256',hashlib.sha256(s.encode()).hexdigest())
p=Path('eterna-worker/test/library-first.test.mjs');s=p.read_text();assert 'full canonical matrix over every prepared lesson' not in s
s+='''
for(const l of harness().lessons)test('full canonical matrix over every prepared lesson '+l.id,async()=>{
 const h=harness({year:l.school_years[0]});let serial=0;
 for(const mode of ['homework','ask','review','explain','exam','practice']){
  const session='session:matrix:'+l.id+':'+mode;
  const body=(text,prev=null)=>{const id='request:matrix:'+l.id+':'+(++serial);return{text,mode,client_state_contract:3,student_action:prev?'answer':'new_topic',request_id:id,client_turn_id:id,answered_question_id:prev?.pedagogical_state?.pending_question_id||null,session_id:session,activity_state:prev?.activity_state||{contract_version:3,session_id:session,mode,phase:'ASK',question_id:null,question_number:1,difficulty:1},pedagogical_state:prev?.pedagogical_state,mode_state:prev?.mode_state}};
  const r=await h.fetchTurn(body('Explícame '+l.title));assert.equal(r.status,200,l.id+' '+mode);assert.equal(r.data.library_route,'owned-lesson-v1');assert.equal(r.data.library_lesson_id,l.id);assert.equal(r.data.generation_model_calls,0);assert.equal(r.data.generation_tokens,0);
  if(!['homework','review'].includes(mode)){
   const answer=await h.fetchTurn(body(l.quiz[0].options['ABC'.indexOf(l.quiz[0].answer)],r.data));assert.equal(answer.status,200);assert.equal(answer.data.student_answer_assessment,'correct',l.id+' '+mode);assert.equal(answer.data.library_route,'owned-lesson-v1');
  }else{assert.equal(r.data.student_answer_assessment,'not_applicable');assert.equal(r.data.check_question,null)}
 }
 await h.drain();assert.equal(h.inferences.length,0);
});
test('mathematical answer normalization never drops a decimal point, sign, exponent or unit',()=>{
 const h=harness(),l=h.lessons.find(l=>l.id==='p-mean');
 for(let pos=0;pos<3;pos++){
  const q=l.quiz[pos],ped={current_mode:'practice',active_concept:l.title,pending_question:h.library.question(q),pending_question_id:'q-numeric',next_teaching_goal:`lib:v1:${l.id}:${pos}:0:practice`};
  for(const original of q.options.filter(x=>/^\\d+$/.test(x)))for(const value of ['.'+original,'-'+original,original+'²',original+' m','No '+original])assert.equal(h.library.decision({text:value,profile:profile(l),mode:'practice',pedState:ped}),null,value);
 }
});
test('explicit non-Spanish profile does not receive fixed Spanish lessons',()=>{const h=harness();assert.equal(h.library.exactLesson('fracciones',{school_year:'5º de Primaria',preferred_language:'en'}),null)});
'''
p.write_text(s)
