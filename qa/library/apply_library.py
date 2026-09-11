"""Exact baseline patch: no frontend, microphone, auth, billing or model changes."""
from pathlib import Path
import hashlib
p=Path('eterna-worker/src/index.js');s=p.read_text()
assert hashlib.sha256(s.encode()).hexdigest()=='b62aaaedc07cbc2ada1e1410b675dc62c4d8fcd3b5b626e2e855e157e706e9c5'
s=s.replace('import "../../eterna-state-contract-v3.js";','import "../../eterna-state-contract-v3.js";\nimport "./library/content-v1.js";\nimport "./library/runtime-v1.js";')
helper=r'''
function ownedLibraryRuntime(env){
  const library=globalThis.EternaOwnedLibrary,content=globalThis.ETERNA_LIBRARY_CONTENT;
  return env.ENABLE_ETERNA_LIBRARY==="true"&&env.ETERNA_LIBRARY_RELEASE==="eterna-library-2026.09-v1"&&library?.release_id===env.ETERNA_LIBRARY_RELEASE&&content?.release_id===library.release_id?library:null
}
function ownedLibraryPayload(candidate,{incomingPedState,incomingModeState,mode}){
  if(!candidate||candidate.safety_route!=="closed-domain-library-allowlist")return null;
  const l=candidate.lesson,check=candidate.check_question,quiz=l.quiz[candidate.position],assessment=candidate.assessment;
  const tutorOutput={help_level:candidate.help_level,strategy_used:candidate.strategy,expected_answer_type:check?"choice":"none",expected_key_ideas:check?[quiz.answer,quiz.options["ABC".indexOf(quiz.answer)]]:[],likely_misconceptions:[l.misconception],conversation_stage:candidate.complete?"complete":candidate.needs_clarification?"clarifying":check?"awaiting_student_answer":"explaining",new_explained_points:[...(candidate.relation==="new_topic"?[l.title]:[]),...(candidate.explained_marker?[candidate.explained_marker]:[])],needs_clarification:Boolean(candidate.needs_clarification)};
  const pedagogical_state=buildPedagogicalState({incoming:incomingPedState,mode,subject:l.subject,concept:l.title,tutorOutput,assessment,finalCheck:check,turnRel:candidate.relation});
  pedagogical_state.next_teaching_goal=candidate.next_teaching_goal;
  const matchedPending=Boolean(incomingPedState.pending_question)&&incomingPedState.pending_question===check;
  if(matchedPending)pedagogical_state.pending_question_id=incomingPedState.pending_question_id;
  // Do not promote an unattempted answer to knowledge. Answer keys in the incoming client state are never read.
  if(assessment!=="correct")pedagogical_state.known_points=candidate.relation==="new_topic"?[]:incomingPedState.known_points;
  return{reply:candidate.reply,verification_status:candidate.needs_clarification?"needs_clarification":"verified",subject:l.subject,concept:l.title,help_level:candidate.help_level,check_question:check,practice_suggestion:null,student_answer_assessment:assessment,strategy_used:candidate.strategy,mode_label:MODE_PROFILES[mode].label,mode_state:sanitizeModeState(candidate.mode_state||incomingModeState),pedagogical_state,auto_speak:false,library_route:"owned-lesson-v1",library_release:"eterna-library-2026.09-v1",library_lesson_id:l.id,generation_model_calls:0,generation_tokens:0,safety_route:candidate.safety_route,content_provenance:{kind:"original_teaching_material",curriculum_reference:l.curriculum_source,official_endorsement:false,human_teacher_reviewed:false}}
}
function ownedLibraryDecision(env,{text,image,ctx,mode,incomingPedState,incomingModeState,startsNewTopic=false}){
  const library=ownedLibraryRuntime(env);if(!library||image||teacherCoreSafetySignal(text)||hardUnsafeIntent(text)||clearNonAcademicIntent(text))return null;
  const requested=requestedModeFromText(text);if(requested&&requested!==mode)return null;
  return library.decision({text,profile:ctx.profile,pedState:incomingPedState,modeState:incomingModeState,mode,image,newTopic:startsNewTopic})
}
'''
s=s.replace('async function handleChat(request,env,auth,event){',helper+'\nasync function handleChat(request,env,auth,event){')
s=s.replace('currentSituation=!image?classroomSituation(text,history):null','currentSituation=!image?(ownedLibraryRuntime(env)?.protocol(text)||classroomSituation(text,history)):null')
a='if(currentSituation&&!(currentSituation.kind==="weather_query"&&currentSituation.location)){return json({reply:situationalReply(currentSituation,text,ctx?.base?.apodo||ctx?.profile?.apodo||"")'
b='if(currentSituation&&!(currentSituation.kind==="weather_query"&&currentSituation.location)){const libraryProtocol=currentSituation.kind==="library_protocol";if(libraryProtocol)deferWork(event,"library-cordiality",()=>logInteraction(env,uid,{text,image:null,inputSource,scope:"school",verification:"verified",subject:null,concept:null,help:null,modelRoute:"owned-protocol-v1",mode}));return json({...(libraryProtocol?{library_route:"owned-protocol-v1",library_release:"eterna-library-2026.09-v1",generation_model_calls:0,generation_tokens:0}:{}),reply:libraryProtocol?ownedLibraryRuntime(env).cordial(currentSituation.protocol,{text,profile:ctx.profile,base:ctx.base,pedState:incomingPedState}):situationalReply(currentSituation,text,ctx?.base?.apodo||ctx?.profile?.apodo||"")'
assert a in s;s=s.replace(a,b)
a='const guarded=hintRequestResponse(incomingPedState,mode,incomingModeState);'
b='const libraryHint=ownedLibraryDecision(env,{text:"una pista",image:null,ctx,mode,incomingPedState,incomingModeState}),guarded=ownedLibraryPayload(libraryHint,{incomingPedState,incomingModeState,mode})||hintRequestResponse(incomingPedState,mode,incomingModeState);'
assert a in s;s=s.replace(a,b)
marker='  if(mode==="exam"&&!image&&(startsNewTopic||incomingPedState.turn_index===0)){'
fast=r'''  // All identity, parental, subscription, profile, quota, image and safeguarding checks above remain in force.
  // Only whole utterances from a finite educational grammar use this deterministic safety policy.
  // Any extra clause, unsupported answer or image falls through to the original moderation/scope/tutor path.
  const ownedDecision=ownedLibraryDecision(env,{text,image,ctx,mode,incomingPedState,incomingModeState,startsNewTopic});
  if(ownedDecision){
    const payload=ownedLibraryPayload(ownedDecision,{incomingPedState,incomingModeState,mode});timings?.mark("owned_library");
    deferWork(event,"library-usage-and-progress",async()=>{
      await Promise.all([markChatRequest(env,uid,q,false),logInteraction(env,uid,{text,image:null,inputSource,scope:"school",verification:payload.verification_status,subject:payload.subject,concept:payload.concept,help:payload.help_level,modelRoute:"owned-lesson-v1",mode,strategy:payload.strategy_used})]);
      if(["correct","incorrect","partial"].includes(payload.student_answer_assessment))try{await applyStudentMemory(env,uid,{subject:payload.subject,concept:payload.concept,conceptId:null,outcome:payload.student_answer_assessment,help:payload.help_level})}catch(e){}
    });
    return json(payload)
  }
'''
assert marker in s;s=s.replace(marker,fast+marker)
# Add available prepared material to model grounding without calling the database or claiming official textbook authority.
a='const curriculum=await retrieveCurriculum(env,ctx.profile,effectiveSubject,effectiveConcept);let externalEvidence=null;timings?.mark("curriculum");'
b=a+'\n  if(ownedLibraryRuntime(env)){const l=ownedLibraryRuntime(env).exactLesson(effectiveConcept||"",ctx.profile);if(l)curriculum.unshift({id:null,title:l.title,summary:ownedLibraryRuntime(env).contextText(l),pedagogy_notes:"Contenido original ETERNA, no disposición oficial. Conserva contexto; ofrece una explicación nueva si el alumno ya vio estas versiones.",common_misconceptions:[l.misconception],example_templates:[l.example],eterna_curriculum_sources:{title:"Referencia curricular por etapa; no aval oficial",official_url:l.curriculum_source}})}'
assert a in s;s=s.replace(a,b)
a='model_configuration:modelConfiguration(env),features:healthFeatures(env)'
b='model_configuration:modelConfiguration(env),features:healthFeatures(env),owned_library:{enabled:Boolean(ownedLibraryRuntime(env)),release:ownedLibraryRuntime(env)?.release_id||null,lessons:ownedLibraryRuntime(env)?globalThis.ETERNA_LIBRARY_CONTENT.lessons.length:0,protocols:ownedLibraryRuntime(env)?.protocols.length||0,curriculum_complete:false}'
assert a in s;s=s.replace(a,b)
p.write_text(s)
print('Patched worker SHA256',hashlib.sha256(s.encode()).hexdigest())
# Canonical v3 counts are one-based in API responses. The legacy tutor internally
# subtracts one; restore the canonical value only for owned-library decisions.
s=s.replace('  if(currentSituation&&!(currentSituation.kind===', '  const libraryModeState=contractMeta.enabled?{...incomingModeState,question_number:contractMeta.activityState.question_number}:incomingModeState;\n  if(currentSituation&&!(currentSituation.kind===',1)
start=s.index('  if(currentSituation&&!(currentSituation.kind===');end=s.index('  if(contractMeta.enabled&&contractMeta.studentAction===',start)
block=s[start:end].replace('mode_state:incomingModeState,','mode_state:libraryProtocol?libraryModeState:incomingModeState,');s=s[:start]+block+s[end:]
s=s.replace('text:"una pista",image:null,ctx,mode,incomingPedState,incomingModeState}),','text:"una pista",image:null,ctx,mode,incomingPedState,incomingModeState:libraryModeState}),')
s=s.replace('ownedLibraryDecision(env,{text,image,ctx,mode,incomingPedState,incomingModeState,startsNewTopic});','ownedLibraryDecision(env,{text,image,ctx,mode,incomingPedState,incomingModeState:libraryModeState,startsNewTopic});')
p.write_text(s)
print('Canonical-count fix included:',hashlib.sha256(s.encode()).hexdigest())
