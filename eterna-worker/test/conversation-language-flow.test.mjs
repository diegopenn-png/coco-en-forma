import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness} from './sprint-harness.mjs';

const question='Como se dice cuál es tu nombre en inglés';
const translation="What's your name?";
const modes=['homework','ask','review','explain','exam','practice'];

function languageHarness() {
  const h=harness({translationBudget:true});
  const requests=[];
  h.env.AI.run=async(model,input)=>{
    if(model.includes('guard'))return {response:'safe'};
    const properties=input.response_format?.json_schema?.properties;
    if(properties?.clarify) {
      const context=JSON.parse(input.messages.at(-1).content);
      requests.push(context);
      const data=context.student==='Tradúcelo'&&!context.turns.length
        ? {reply:'¿Qué frase quieres traducir y a qué idioma?',clarify:true}
        : {reply:translation,clarify:false};
      return {choices:[{message:{content:JSON.stringify(data)}}]};
    }
    if(properties?.scope)return {response:{scope:'school',subject:'Inglés',concept:'traducción',domain:'languages',intent:'educational_explanation',request_type:'explanation',sensitive_topic:false,unsafe_action:false,needs_clarification:false,self_contained:true,reason:'consulta de idioma',ambiguity:false,ambiguity_term:null,ambiguity_options:[],resolved_meaning:null}};
    throw Error('Unexpected model call '+model);
  };
  return {h,requests};
}

for(const mode of modes)test(mode+' translates a question and resolves an insistence without advancing the exercise',async()=>{
  const {h,requests}=languageHarness();
  const state={contract_version:3,mode,session_id:'session:example',phase:'WAIT',question_id:'question:original',question_number:4,correct_count:2,incorrect_count:1,difficulty:2};
  const body={mode,client_state_contract:3,activity_state:state,student_action:'continue',pedagogical_state:{pending_question_id:state.question_id,pending_question:'¿Cuánto es 6 × 8?',active_subject:'Matemáticas',expected_answer_type:'numeric'}};
  const first=await h.fetchTurn({...body,text:question,request_id:'request:first'});
  assert.equal(first.status,200,JSON.stringify(first.data));
  assert.equal(first.data.reply,translation);
  const history=[{role:'user',text:question},{role:'assistant',text:'Me alegra que hayas preguntado.'}];
  const second=await h.fetchTurn({...body,text:'Tradúcelo',request_id:'request:second',pedagogical_state:first.data.pedagogical_state,activity_state:first.data.activity_state,history});
  assert.equal(second.data.reply,translation);
  assert.equal(requests.at(-1).turns[0].text,question);
  assert.equal(requests.at(-1).reference.source_phrase,"cuál es tu nombre");
  assert.equal(requests.at(-1).reference.target_language,"en");
  for(const {data} of [first,second]){
    assert.equal(data.language_consultation,'answered');
    assert.equal(data.check_question,null);
    assert.equal(data.student_answer_assessment,'not_applicable');
    assert.equal(data.pedagogical_state.pending_question,body.pedagogical_state.pending_question);
    for(const k of ['question_id','question_number','correct_count','incorrect_count'])assert.equal(data.activity_state[k],state[k]);
  }
  await h.drain();
});

test('a language request without a referent asks one clarification',async()=>{
  const {h}=languageHarness();
  const r=await h.fetchTurn({mode:'explain',text:'Tradúcelo'});
  assert.equal(r.data.language_consultation,'clarify');
  assert.match(r.data.reply,/frase.*idioma/);
  await h.drain();
});

test('quoted questions and glossary follow-ups are not new exercises or vocabulary items',()=>{
  const {sandbox}=harness();
  const {embeddedStudentQuestion,learningActivityContext}=vm.runInContext('({embeddedStudentQuestion,learningActivityContext})',sandbox);
  assert.equal(embeddedStudentQuestion('En inglés se dice «What’s your name?». Sigue con tu texto.'),null);
  assert.equal(embeddedStudentQuestion('Compara «¿Qué hora es?» con el original. ¿Qué cambia?'),'¿Qué cambia?');
  const opts={pedState:{learning_activity_type:'glossary',active_topic:'inglés'},history:[{role:'assistant',text:'Una definición.'}]};
  for(const text of ['más fácil','otro ejemplo','por qué','continúa'])assert.notEqual(learningActivityContext({...opts,text}).type,'glossary');
});

test('repeating after changing language keeps the latest target and the original source',()=>{
  const {sandbox}=harness();
  const resolve=vm.runInContext('translationReference',sandbox);
  const history=[{role:'user',text:question},{role:'assistant',text:translation},{role:'user',text:'¿Y en francés?'},{role:'assistant',text:'Comment tu t’appelles ?'}];
  const request=resolve('Tradúcelo','Tradúcelo',history,'es');
  assert.equal(request.target_language,'fr');
  assert.equal(request.source_phrase,'cuál es tu nombre');
});
