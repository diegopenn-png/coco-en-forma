import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const helperSource=source.slice(source.indexOf('const languages = Object.freeze'),source.indexOf('async function handleChat('));
const api=vm.runInNewContext(helperSource+';({tutorLanguages,audioLocale,translateTutorText,translateTutorResponse})',{Response,Headers,isAiMonthlyBudgetError:()=>false});
for(const tag of api.tutorLanguages.filter(code=>code!=='es')){
  test('localizes '+tag+' input, response and follow-up while keeping canonical question state',async()=>{
    const calls=[];
    const env={AI:{async run(model,data){calls.push(data);return {translated_text:data.target_lang==='spanish'?'Hola':tag+' '+data.text}}}};
    const text=await api.translateTutorText(env,'Hello',tag,'es');
    assert.equal(text,'Hola');
    const state={pending_question:'¿Cuánto es 2 + 2?',pending_question_id:'lesson-a'};
    const response=await api.translateTutorResponse(env,Response.json({reply:'Vamos a sumar',check_question:state.pending_question,pedagogical_state:state,subject:'Matemáticas',help_level:1}),tag,text);
    const data=await response.json();
    assert.deepEqual(data.pedagogical_state,state);
    assert.equal(data.check_question,tag+' '+state.pending_question);
    assert.equal(data.canonical_turn.reply,'Vamos a sumar');
    assert.equal(data.canonical_turn.text,'Hola');assert.equal(response.headers.get('content-language'),tag);
    assert.equal(calls[0].source_lang,calls[1].target_lang);
  });
}
test('numbers survive unchanged and translation failures leave a usable safety response',async()=>{
  const env={AI:{async run(){return {translated_text:'bad 9'}}}};
  assert.equal(await api.translateTutorText(env,'2 + 2','ar','es'),'2 + 2');
  await assert.rejects(api.translateTutorText(env,'son 3','es','fi'),/TRANSLATION_UNAVAILABLE/);
  const response=await api.translateTutorResponse({AI:{run:async()=>{throw Error('offline')}}},Response.json({reply:'Habla con un adulto',verification_status:'blocked_safety'}),'en','hello');
  assert.match((await response.json()).reply,/trusted adult/);
});
