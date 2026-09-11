"""Narrow, reproducible Worker integration; does not alter any frontend or speech code."""
import hashlib
from pathlib import Path
p=Path('eterna-worker/src/index.js');s=p.read_text();before=s
assert hashlib.sha256(s.encode()).hexdigest()=='b62aaaedc07cbc2ada1e1410b675dc62c4d8fcd3b5b626e2e855e157e706e9c5','Unexpected Worker baseline; review before integrating'
def replace(a,b):
 global s
 assert s.count(a)==1,('Integration anchor changed',a[:100],s.count(a));s=s.replace(a,b)
replace('import "../../eterna-state-contract-v3.js";', 'import "../../eterna-state-contract-v3.js";\nimport "./library/content-v1.js";\nimport "./library/engine-v1.js";')
replace('async function handleChat(request,env,auth,event){', '''function preparedLibrary(env){return String(env.ENABLE_LIBRARY_FIRST||"").toLowerCase()==="true"?globalThis.EternaLibraryFirstV1||null:null}
function safePreparedProtocolKind(env,text){try{return !teacherCoreSafetySignal(text)&&!clearSafetySignal(text)?preparedLibrary(env)?.protocolKind(text)||null:null}catch(e){return null}}
function preparedLibraryResponse(engine,kind,args){try{return kind==="protocol"?engine.protocolReply(args):engine.lessonReply(args)}catch(e){console.error("ETERNA LIBRARY FALLTHROUGH",String(e?.name||"Error"));return null}}
async function handleChat(request,env,auth,event){''')
replace('currentSituation=!image?classroomSituation(text,history):null', 'currentSituation=!image?(safePreparedProtocolKind(env,text)?{kind:"library_protocol"}:classroomSituation(text,history)):null')
anchor='  if(currentSituation&&!(currentSituation.kind==="weather_query"&&currentSituation.location))'
replace(anchor, '''  if(currentSituation?.kind==="library_protocol"&&!teacherCoreSafetySignal(text)&&!clearSafetySignal(text)){
    const result=preparedLibraryResponse(preparedLibrary(env),"protocol",{text,mode,ctx,pedState:incomingPedState,modeState:incomingModeState,sessionId:contractMeta.activityState?.session_id||"",timeZone:env.USAGE_TIMEZONE||"Europe/Madrid"});
    if(result){timings?.mark("prepared_protocol");result.mode_label=MODE_PROFILES[mode].label;deferWork(event,"library-protocol-metadata",()=>logInteraction(env,uid,{text:"",image:null,inputSource,scope:"school",verification:"verified",subject:null,concept:null,help:null,modelRoute:"library-v1/protocol/"+result.protocol_id,mode}));return json(result)}
  }
  if(currentSituation&&!(currentSituation.kind==="weather_query"&&currentSituation.location))''')
replace('  if(contractMeta.enabled&&contractMeta.studentAction==="hint_request"){','  if(contractMeta.enabled&&contractMeta.studentAction==="hint_request"&&!preparedLibrary(env)?.ownsPending(incomingPedState,mode,ctx.profile)){')
anchor='  if(mode==="exam"&&!image&&(startsNewTopic||incomingPedState.turn_index===0)){' 
replace(anchor,'''  // Only exact, bounded prepared intents or answers to our own canonical questions
  // can enter here. Unknown/mixed/unsafe messages continue through the original gates.
  if(preparedLibrary(env)&&!image&&!teacherCoreSafetySignal(text)&&!clearSafetySignal(text)){
    const result=preparedLibraryResponse(preparedLibrary(env),"lesson",{text,mode,ctx,pedState:incomingPedState,modeState:incomingModeState,sessionId:contractMeta.activityState?.session_id||"",studentAction:contractMeta.studentAction,startsNewTopic});
    if(result){
      result.mode_label=MODE_PROFILES[mode].label;timings?.mark("prepared_lesson");
      if(result.library_hint&&contractMeta.enabled){if(!contractMeta.requestId&&!contractMeta.clientTurnId)return json({error:"ETERNA_REQUEST_ID_REQUIRED",verification_status:"verification_conflict",student_answer_assessment:"not_applicable"},400);const sc=contractV3(),tr=sc?.transitionActivityState?.({...contractMeta.activityState,phase:"WAIT",question_id:incomingPedState.pending_question_id},sc.EVENTS.HINT_USED,{action_id:contractMeta.requestId||contractMeta.clientTurnId,expected_mode:mode});if(tr?.ok)result.activity_state=tr.state}
      deferWork(event,"library-lesson-metadata",async()=>{await markChatRequest(env,uid,q,false);await logInteraction(env,uid,{text:"",image:null,inputSource,scope:"school",verification:result.verification_status,subject:result.subject,concept:result.concept,help:result.help_level,modelRoute:"library-v1/lesson/"+result.lesson_id,mode,strategy:result.strategy_used});if(["correct","incorrect"].includes(result.student_answer_assessment))await applyStudentMemory(env,uid,{subject:result.subject,concept:result.concept,conceptId:null,outcome:result.student_answer_assessment,help:result.help_level})});
      return json(result)
    }
  }
  if(mode==="exam"&&!image&&(startsNewTopic||incomingPedState.turn_index===0)){''')
replace('  cloudflare_ai_primary_v1:aiProvider(env)==="cloudflare",', '  prepared_library_v1:Boolean(preparedLibrary(env)),prepared_library_release:preparedLibrary(env)?.releaseId||null,prepared_library_lessons:preparedLibrary(env)?.lessonCount||0,prepared_library_protocols:preparedLibrary(env)?.protocolCount||0,\n  cloudflare_ai_primary_v1:aiProvider(env)==="cloudflare",')
# Protect the successful speech repair byte-for-byte.
for start,end in [('async function handleTranscribe(', '\nasync function handleSpeak('),('async function handleSpeak(', '\nasync function handleFeedback(')]:
 if start in before and end in before:
  a=before[before.index(start):before.index(end,before.index(start))];b=s[s.index(start):s.index(end,s.index(start))];assert a==b,'Speech code changed'
p.write_text(s)
print('Worker integration SHA256',hashlib.sha256(s.encode()).hexdigest())
