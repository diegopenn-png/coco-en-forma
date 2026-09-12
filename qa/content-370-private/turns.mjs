 const stage=['infantil','primaria','eso','bachillerato'][QA_GROUP-1];
 const additions=globalThis.ETERNA_LIBRARY_CONTENT.lessons.slice(310).filter(l=>l.stage===stage);
 assert.equal(additions.length,[10,20,18,12][QA_GROUP-1]);
 for(const l of additions){
  await control('profile_'+stage+'_'+l.grade_min);
  const first=await chat('Explícame '+l.title,'explain');assert.equal(first.library_lesson_id,l.id);assert.ok(first.reply.includes(l.explanation));
  const answered=await chat(l.quiz[0].answer,'explain',first);assert.equal(answered.library_lesson_id,l.id);assert.equal(answered.student_answer_assessment,'correct');assert.equal(answered.activity_state.correct_count,1);
  report.new_lessons_tested.push({lesson_id:l.id,stage,school_year:l.school_years[0],explanation_from_owned_content:true,first_answer_checked:true,generation_calls:0});save();
 }
 const sample=additions[0];await control('profile_'+stage+'_'+sample.grade_min);
 for(const mode of ['homework','ask','review','explain','exam','practice']){
  const first=await chat('Explícame '+sample.title,mode);assert.equal(first.library_lesson_id,sample.id);
  if(['homework','review'].includes(mode)){assert.equal(first.check_question,null);assert.equal(first.student_answer_assessment,'not_applicable')}
  else{const r=await chat(sample.quiz[0].answer,mode,first);assert.equal(r.student_answer_assessment,'correct');assert.equal(r.activity_state.correct_count,1)}
 }
 if(QA_GROUP===2){
  await control('primaria');const factory=globalThis.EternaProceduralPractice;
  let p=await chat('Dame ejercicios nuevos de porcentajes','practice');assert.equal(p.generated_exercise,true);
  const old=factory.owned(p.pedagogical_state,{school_year:'5º de Primaria'},'practice').lesson.quiz.map(q=>q.question);
  for(let i=0;i<3;i++){const own=factory.owned(p.pedagogical_state,{school_year:'5º de Primaria'},'practice');assert.equal(own.position,i);p=await chat(own.question.answer,'practice',p);assert.equal(p.student_answer_assessment,'correct')}
  assert.equal(p.activity_state.correct_count,3);assert.equal(p.check_question,null);
  p=await chat('otra ronda','practice',p,'continue');assert.equal(p.activity_state.correct_count,0);
  const next=factory.owned(p.pedagogical_state,{school_year:'5º de Primaria'},'practice').lesson.quiz.map(q=>q.question);assert.ok(next.every(q=>!old.includes(q)));
  report.nonrepeating_round_fix_preserved=true;save();
 }
