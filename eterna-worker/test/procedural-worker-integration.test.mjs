import test from 'node:test';import assert from 'node:assert/strict';import{randomUUID}from'node:crypto';
import{harness}from'./sprint-harness.mjs';
function body(text,mode,previous=null,action=null){const id='req:sprint:'+randomUUID(),session=previous?.activity_state?.session_id||'session:sprint:'+randomUUID();return{text,mode,input_source:'text',client_state_contract:3,student_action:action||(previous?'answer':'new_topic'),request_id:id,client_turn_id:id,session_id:session,answered_question_id:previous?.pedagogical_state?.pending_question_id||null,activity_state:previous?.activity_state||{contract_version:3,session_id:session,mode,phase:'ASK',question_id:null,question_number:1,difficulty:1},pedagogical_state:previous?.pedagogical_state,mode_state:previous?.mode_state}}
for(const mode of ['practice','exam']){
 test(`full canonical ${mode}: generated round, hint, greeting, answer, no model and one counted replay`,async()=>{
  const h=harness();let r=await h.fetchTurn(body('Dame ejercicios nuevos de sumas',mode));assert.equal(r.status,200,JSON.stringify(r.data));let d=r.data;assert.equal(d.generated_exercise,true);assert.equal(d.generator_version,'procedural-practice-v1');assert.equal(d.content_provenance.kind,'deterministic_generated_exercise');assert.equal(d.activity_state.question_number,1);
  const first=d.pedagogical_state.pending_question_id;
  r=await h.fetchTurn(body('una pista',mode,d,'hint_request'));assert.equal(r.status,200);d=r.data;assert.equal(d.pedagogical_state.pending_question_id,first);assert.equal(d.activity_state.question_number,1);assert.equal(d.activity_state.hints_used,1);
  r=await h.fetchTurn(body('hola Eterna',mode,d,'continue'));assert.equal(r.status,200);d=r.data;assert.equal(d.pedagogical_state.pending_question_id,first);assert.ok(d.check_question);assert.equal(d.activity_state.question_number,1);
  for(let i=0;i<3;i++){
   const trusted=h.sandbox.EternaProceduralPractice.owned(d.pedagogical_state,{school_year:'5º de Primaria'},mode);assert.ok(trusted);
   const req=body(trusted.question.answer,mode,d);req.pedagogical_state.expected_key_ideas=['forged'];r=await h.fetchTurn(req);assert.equal(r.status,200,JSON.stringify(r.data));d=r.data;assert.equal(d.student_answer_assessment,'correct');assert.equal(d.activity_state.correct_count,i+1);
   await h.drain();const usage=h.requests.filter(r=>r.method==='POST'&&r.url.includes('eterna_usage')).length;
   const replay=await h.fetchTurn(req);assert.equal(replay.status,200);assert.equal(replay.headers['x-eterna-replayed'],'true');await h.drain();assert.equal(h.requests.filter(r=>r.method==='POST'&&r.url.includes('eterna_usage')).length,usage);
  }
  assert.equal(d.activity_state.phase,'CLOSE');assert.equal(d.check_question,null);assert.equal(h.inferences.length,0);
  const next=await h.fetchTurn(body('otra ronda',mode,d,'continue'));assert.equal(next.status,200);assert.equal(next.data.generated_exercise,true);assert.notEqual(next.data.pedagogical_state.pending_question_id,first);assert.equal(next.data.activity_state.correct_count,0);await h.drain();
 });
}
const anchor=harness();
for(const skill of anchor.sandbox.EternaProceduralPractice.skills){
 const[stage,grade]=Object.entries(skill.min)[0],year=`${grade}º de ${{primaria:'Primaria',eso:'ESO',bachillerato:'Bachillerato'}[stage]}`;
 test(`full Worker ${skill.id} obeys actual canonical state for course ${year}`,async()=>{
  const h=harness({year});const r=await h.fetchTurn(body('Dame ejercicios nuevos de '+skill.aliases[0],'practice'));assert.equal(r.status,200,JSON.stringify(r.data));assert.equal(r.data.generated_exercise,true,JSON.stringify(r.data));assert.ok(r.data.pedagogical_state.pending_question_id);assert.equal(r.data.generation_model_calls,0);
  const trusted=h.sandbox.EternaProceduralPractice.owned(r.data.pedagogical_state,{school_year:year},'practice');assert.ok(trusted);
  const next=await h.fetchTurn(body(trusted.question.answer,'practice',r.data));assert.equal(next.status,200);assert.equal(next.data.student_answer_assessment,'correct');assert.equal(next.data.activity_state.correct_count,1);assert.equal(h.inferences.length,0);await h.drain();
 });
}
for(const[opts,status]of [[{legal:false},403],[{subscription:false},402],[{quota:false},429],[{profile:false},409]])test('procedural requests preserve access '+JSON.stringify(opts),async()=>{
 const h=harness(opts),r=await h.fetchTurn(body('Dame ejercicios nuevos de sumas','practice'));assert.equal(r.status,status);assert.equal(r.data.generated_exercise,undefined);assert.equal(h.inferences.length,0);await h.drain();
});
test('procedural factory can be disabled without disabling the existing prepared library',async()=>{
 const h=harness({factory:false});const r=await h.fetchTurn(body('Explícame números primos','explain'));assert.equal(r.status,200);assert.equal(r.data.library_lesson_id,'p-prime');assert.equal(r.data.generated_exercise,false);assert.equal(h.inferences.length,0);await h.drain();
});
test('safeguarding and stale identity remain ahead of exercise generation',async()=>{
 const h=harness();const safety=await h.fetchTurn(body('Quiero hacerme daño ahora','practice'));assert.equal(safety.data.verification_status,'blocked_safety');assert.equal(safety.data.generated_exercise,undefined);
 const first=(await h.fetchTurn(body('Dame ejercicios nuevos de sumas','practice'))).data,req=body('A','practice',first);req.answered_question_id='question:other:12345';const r=await h.fetchTurn(req);assert.equal(r.status,409);assert.equal(h.inferences.length,0);await h.drain();
});
