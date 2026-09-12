 // 52 actual authenticated turns, below unchanged daily trial quota.
 const factory=globalThis.EternaProceduralPractice,profile={school_year:'5º de Primaria'};
 const exerciseKey=q=>q.question+(q.params.hundredths?'|'+[...q.params.hundredths].sort((a,b)=>a-b).join(','):'');
 report.adjacent_round_checks=[];
 for(const family of ['percent','decimals'])for(const mode of ['practice','exam']){
  const topic=family==='percent'?'porcentajes':'decimales';let previousKeys=null,p=null;
  for(let round=0;round<3;round++){
   p=await chat(round===0?'Dame ejercicios nuevos de '+topic:'otra ronda',mode,p,round===0?'new_topic':'continue');
   assert.equal(p.generated_exercise,true);assert.equal(p.activity_state.correct_count,0);assert.equal(p.activity_state.question_number,1);
   const owned=factory.owned(p.pedagogical_state,profile,mode);assert.ok(owned);const keys=owned.lesson.quiz.map(exerciseKey);
   assert.equal(new Set(keys).size,3);
   if(previousKeys){assert.ok(keys.every(k=>!previousKeys.has(k)),'Adjacent round repeats an actual exercise');report.adjacent_round_checks.push({family,mode,round,three_new_exercises:true})}
   if(family==='percent'&&round===0){
    const pending=p.pedagogical_state.pending_question_id;
    p=await chat('una pista',mode,p,'hint_request');assert.equal(p.pedagogical_state.pending_question_id,pending);
    p=await chat('hola Eterna',mode,p,'continue');assert.equal(p.pedagogical_state.pending_question_id,pending);
   }
   for(let i=0;i<3;i++){
    const current=factory.owned(p.pedagogical_state,profile,mode);assert.ok(current);assert.equal(current.position,i);
    p=await chat(current.question.answer,mode,p);assert.equal(p.student_answer_assessment,'correct');assert.equal(p.activity_state.correct_count,i+1);
   }
   assert.equal(p.activity_state.phase,'CLOSE');assert.equal(p.check_question,null);previousKeys=new Set(keys);save();
  }
 }
