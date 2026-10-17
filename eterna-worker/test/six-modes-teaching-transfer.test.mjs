import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const read = p => readFileSync(new URL(p, import.meta.url), 'utf8');
const source = read('../src/index.js');
const sandbox = { console, URL, Request, Response, Headers, TextEncoder, TextDecoder, setTimeout, clearTimeout,
  fetch: () => { throw new Error('Network forbidden in offline teaching tests'); } };
vm.createContext(sandbox);
vm.runInContext(read('../../eterna-state-contract-v3.js'), sandbox);
vm.runInContext(source.replace(/^import\s+[^;]+;\s*/gm, '').replace(/\nexport default\s*\{[\s\S]*?\};\s*$/, '') + '\n;globalThis.api={enforceGreetingPolicy,learningActivityContext,singleStudentAct,turnRelation,tutor,verify};', sandbox);
const api = sandbox.api;
const modes = ['homework','ask','review','explain','exam','practice'];
const clock = { local_date:'2026-10-17', local_hour:15, sent_at_ms:1792242000000 };
const greeting = { local_date:'2026-10-17', period:'afternoon', greeted_at_ms:1792241900000 };
const state = mode => ({ current_mode:mode, active_subject:'Matemáticas', active_concept:'multiplicaciones', pending_question:'¿Cuánto es 6 × 7?', expected_answer_type:'numeric', turn_index:2 });
for (const mode of modes) {
  test(`${mode}: greeting plus academic question never loses the answer`, () => {
    const out = api.enforceGreetingPolicy({reply:'¡Hola! La fotosíntesis utiliza energía de la luz.',verification_status:'verified'}, {mode,text:'Hola, ¿qué es la fotosíntesis?',client_clock:clock,client_greeting_state:greeting});
    assert.equal(out.reply,'La fotosíntesis utiliza energía de la luz.');
  });
  test(`${mode}: a new activity never pretends to resume a previous lesson`, () => {
    const out = api.enforceGreetingPolicy({reply:'¡Hola! ¿En qué seguimos?'}, {mode,text:'Hola',history:[],pedagogical_state:{turn_index:0},client_clock:clock,client_greeting_state:greeting});
    assert.doesNotMatch(out.reply,/seguimos|continuamos/);
    assert.ok(out.reply.length > 15);
  });
  test(`${mode}: safety guidance survives repeated greeting`, () => {
    const out = api.enforceGreetingPolicy({reply:'¡Hola! Busca ahora a un adulto de confianza.',verification_status:'blocked_safety'}, {mode,text:'Hola',client_clock:clock,client_greeting_state:greeting});
    assert.match(out.reply,/adulto de confianza/);
  });
  test(`${mode}: a genuine answer keeps assessment context`, () => {
    const activity = api.learningActivityContext({mode,text:'42',pedState:state(mode),scope:{subject:'Matemáticas'}});
    assert.equal(activity.type,'answer_check');
  });
  test(`${mode}: an explicit new topic is not graded against the old question`, () => {
    const activity = api.learningActivityContext({mode,text:'Ahora explícame los volcanes',pedState:state(mode),scope:{subject:'Ciencias Naturales',concept:'volcanes'}});
    assert.notEqual(activity.type,'answer_check');
  });
  test(`${mode}: confusion changes teaching rather than grading the child`, () => {
    const input = {mode,text:'No entiendo, más fácil',pedState:state(mode)};
    assert.equal(api.turnRelation(input.text,input.pedState,[]),'simplification_request');
    const activity = api.learningActivityContext(input);
    assert.equal(activity.type,'concept_explanation');
    assert.equal(activity.response_depth,'short');
  });
  test(`${mode}: one next step is preserved only in ongoing task modes`, () => {
    const incoming=state(mode), activity=api.learningActivityContext({mode,text:'42',pedState:incoming});
    const out=api.singleStudentAct({mode,reply:'Correcto: 6 × 7 = 42.',tutorData:{check_question:'¿Cuánto es 7 × 8?',expected_answer_type:'numeric',tutor_act:'ask_numeric'},turnRel:'answer_to_pending',incoming,assessment:'correct',studentText:'42',activity});
    assert.equal(out.pending_question,['ask','explain'].includes(mode)?null:'¿Cuánto es 7 × 8?');
  });
  test(`${mode}: glossary lookup does not become an unsolicited test`, () => {
    const activity=api.learningActivityContext({mode,text:'¿Qué significa reliable?',scope:{subject:'Inglés'}});
    const out=api.singleStudentAct({mode,reply:'Reliable significa fiable.',tutorData:{check_question:'¿Qué significa reliable?'},turnRel:'new_topic',incoming:{},assessment:'not_applicable',studentText:'reliable',activity});
    assert.equal(out.pending_question,null);
  });
}
test('tutor and verifier actually receive the shared standard', async () => {
  const prompts=[];
  sandbox.capturePrompt = args => { prompts.push(args); return {data:{}}; };
  vm.runInContext('structured=async (_env,args)=>capturePrompt(args)',sandbox);
  const input={text:'Explica las fracciones',mode:'explain',history:[],ctx:{base:{edad:10},profile:{school_year:'5.º de Primaria'},memory:[],mastery:[]},scope:{subject:'Matemáticas',concept:'fracciones'},curriculum:[],pedState:{},modeState:{},tutorOutput:{reply:'Una fracción representa partes de un todo.'}};
  await api.tutor({},input); await api.verify({},input);
  assert.equal(prompts.length,2);
  for(const prompt of prompts){
    assert.match(JSON.stringify(prompt.input),/ESTÁNDAR DOCENTE COMPARTIDO EN LOS SEIS MODOS/);
    assert.equal(prompt.reasoning_effort,'high');
  }
});
