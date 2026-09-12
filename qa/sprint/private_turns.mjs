 // Embedded in the canonical private runner. Every answer is re-derived from the actual generated question.
 report.procedural_rounds=[];
 const factory=globalThis.EternaProceduralPractice,selection=factory.skills.slice((QA_GROUP-1)*6,QA_GROUP*6);
 assert.equal(selection.length,QA_GROUP===4?4:6);
 for(const skill of selection){
  const [stage,grade]=Object.entries(skill.min)[0],year=grade+'º de '+({primaria:'Primaria',eso:'ESO',bachillerato:'Bachillerato'})[stage];
  await control(stage+'_'+grade);
  for(const mode of ['practice','exam']){
   let p=await chat('Dame ejercicios nuevos de '+skill.aliases[0],mode);
   assert.equal(p.generated_exercise,true);assert.equal(p.generator_version,'procedural-practice-v1');assert.equal(p.content_provenance.kind,'deterministic_generated_exercise');
   assert.ok(p.library_lesson_id.startsWith('proc-'+skill.id+'-'));const first=p.pedagogical_state.pending_question_id;
   if(skill===selection[0]&&mode==='practice'){
    p=await chat('una pista',mode,p,'hint_request');assert.equal(p.pedagogical_state.pending_question_id,first);assert.equal(p.activity_state.hints_used,1);
    p=await chat('hola Eterna',mode,p,'continue');assert.equal(p.pedagogical_state.pending_question_id,first);assert.equal(p.activity_state.question_number,1);
   }
   const seen=[];
   for(let i=0;i<3;i++){
    const owned=factory.owned(p.pedagogical_state,{school_year:year},mode);assert.ok(owned,skill.id+' original question lost');
    assert.equal(owned.lesson.skill_id,skill.id);assert.equal(owned.position,i);assert.ok(!seen.includes(p.pedagogical_state.pending_question_id));seen.push(p.pedagogical_state.pending_question_id);
    p=await chat(owned.question.answer,mode,p);assert.equal(p.generated_exercise,true);assert.equal(p.student_answer_assessment,'correct');assert.equal(p.activity_state.correct_count,i+1);
   }
   assert.equal(p.activity_state.phase,'CLOSE');assert.equal(p.check_question,null);
   if(skill===selection[0]&&mode==='practice'){
    p=await chat('otra ronda',mode,p,'continue');assert.equal(p.generated_exercise,true);assert.equal(p.activity_state.correct_count,0);assert.notEqual(p.pedagogical_state.pending_question_id,first);
   }
   report.procedural_rounds.push({family:skill.id,mode,school_year:year,questions_completed:3,single_pending_question:true,correct_count_verified:true,zero_generation:true});save();
  }
 }
 if(QA_GROUP===4){
  await control('primaria');for(const mode of ['homework','ask','review','explain']){const p=await chat('Explícame números primos',mode);assert.equal(p.library_lesson_id,'p-prime');assert.equal(p.generated_exercise,false)}
 }
