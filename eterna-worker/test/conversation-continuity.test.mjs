import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {harness} from './sprint-harness.mjs';

const question = '¿Qué recurso se utiliza en «sus ojos son estrellas»?';
const nextQuestion = '¿Qué dos elementos se relacionan en esa metáfora?';
const plain = value => JSON.parse(JSON.stringify(value));
const modeState = {question_number:0, correct_count:0, partial_count:0, incorrect_count:0, difficulty:2, focus:null};
const lesson = {
  reply:'Una metáfora identifica una cosa con otra para expresar una semejanza. En «sus ojos son estrellas», las estrellas expresan el brillo de los ojos.',
  subject:'Lengua Castellana y Literatura', concept:'metáfora', help_level:1,
  check_question:question, practice_suggestion:null, student_answer_assessment:'not_applicable',
  used_curriculum:false, needs_clarification:false, strategy_used:'direct_explanation', mode_state:modeState,
  expected_answer_type:'short_concept', expected_key_ideas:['metáfora'], likely_misconceptions:[],
  conversation_stage:'awaiting_student_answer', tutor_act:'ask_short_concept',
  new_explained_points:['La metáfora identifica dos elementos por una semejanza'],
};

function fixtureChat(responses = [lesson]) {
  const h = harness({enabled:false, factory:false});
  h.sandbox.fixtureResponses = plain(responses);
  h.sandbox.tutorTurns = [];
  // Replace only model boundaries. HTTP routing, request replay, state handling,
  // deterministic assessment and response construction remain the real Worker.
  vm.runInContext(`
    moderate = async () => ({flagged:false});
    classifyScope = async () => ({scope:'school',subject:'Lengua Castellana y Literatura',concept:'metáfora',intent:'educational_explanation',request_type:'explanation',needs_clarification:false,self_contained:true,sensitive_topic:false,unsafe_action:false});
    tutor = async (_env, args) => {
      tutorTurns.push({text:args.text, relation:args.turnRel, pending:args.pedState.pending_question});
      const data = fixtureResponses.shift();
      if (!data) throw new Error('Unexpected fixture tutor turn');
      return {data, usage:{}};
    };
    verify = async () => ({data:{verdict:'verified',verified:true,requires_clarification:false,blocking:false,issues:[],corrected_reply:null},usage:{}});
    globalThis.continuityApi = {latestCheckQuestion,latestPendingQuestion,turnRelation,sanitizePedagogicalState,buildPedagogicalState,singleStudentAct};
  `, h.sandbox);
  let previous = null, serial = 0;
  const history = [];
  return {
    ...h, api:h.sandbox.continuityApi, history,
    async send(text, action='continue') {
      const id = `request:continuity:${++serial}`;
      const body = {
        text, mode:'explain', client_state_contract:3, request_id:id, client_turn_id:id,
        session_id:'session:continuity:synthetic', student_action:action,
        answered_question_id:action==='answer' ? previous?.pedagogical_state?.pending_question_id : null,
        history:plain(history), mode_state:previous?.mode_state,
        pedagogical_state:previous?.pedagogical_state, activity_state:previous?.activity_state,
      };
      const response = await h.fetchTurn(body);
      assert.equal(response.status, 200, JSON.stringify(response.data));
      previous = response.data;
      history.push({role:'user',text}, {role:'assistant',text:previous.reply,check_question:previous.check_question||null});
      return {...response, body};
    },
    async finish() {
      await h.drain();
      assert.deepEqual(h.inferences, []);
      assert.ok(h.requests.every(request => request.url.startsWith('https://supabase.test/')));
    },
  };
}

test('a completed check stays closed across greeting, continuation and replayed requests', async () => {
  const continuation = {...lesson, reply:'En otra metáfora, «el tiempo es oro», el oro representa el valor del tiempo. La relación cambia, aunque se utiliza el mismo recurso.', check_question:null, expected_answer_type:'none', expected_key_ideas:[], conversation_stage:'explaining', tutor_act:'explain', new_explained_points:['La metáfora también puede expresar el valor de algo']};
  const h = fixtureChat([lesson, continuation]);
  const first = (await h.send('Explícame la metáfora', 'new_topic')).data;
  assert.equal(first.pedagogical_state.pending_question, question);
  const answer = await h.send('Una metáfora', 'answer');
  assert.equal(answer.data.student_answer_assessment, 'correct');
  assert.equal(answer.data.pedagogical_state.pending_question, null);
  assert.equal(answer.data.pedagogical_state.conversation_stage, 'complete');

  const replay = await h.fetchTurn(answer.body);
  assert.equal(replay.headers['x-eterna-replayed'], 'true');
  assert.deepEqual(replay.data, answer.data);

  const greeting = (await h.send('Hola Eterna')).data;
  assert.equal(greeting.pedagogical_state.pending_question, null, 'a greeting must not reopen a check already answered correctly');
  assert.equal(greeting.resume_available, false);
  const next = (await h.send('Otro ejemplo')).data;
  assert.equal(next.pedagogical_state.pending_question, null);
  assert.equal(next.check_question, null);
  assert.match(next.reply, /el tiempo es oro/);
  assert.equal(h.sandbox.tutorTurns.at(-1).pending, null, 'the tutor must not receive the completed question as pending');
  await h.finish();
});

test('latest question recovery never reaches past a more recent assistant response', () => {
  const h = fixtureChat();
  const history = [{role:'assistant',text:'Piensa en el recurso.',check_question:question}, {role:'user',text:'Una metáfora'}, {role:'assistant',text:'Correcto. Ya has identificado el recurso.',check_question:null}];
  assert.equal(h.api.latestCheckQuestion(history), null);
  assert.equal(h.api.latestPendingQuestion(history), null);
});

test('a new implicit question takes priority over an older explicit check', () => {
  const h = fixtureChat();
  const history = [{role:'assistant',text:'Piensa en el recurso.',check_question:question}, {role:'user',text:'Una metáfora'}, {role:'assistant',text:`Correcto. ${nextQuestion}`}];
  assert.equal(h.api.latestPendingQuestion(history), nextQuestion);
  const state = h.api.sanitizePedagogicalState({active_subject:lesson.subject,active_concept:lesson.concept}, 'explain');
  assert.equal(h.api.turnRelation('Los ojos y las estrellas', state, history), 'answer_to_pending');
});

test('completed state wins over stale or truncated question history', () => {
  const h = fixtureChat();
  const state = h.api.sanitizePedagogicalState({active_subject:lesson.subject,active_concept:lesson.concept,pending_question:null,conversation_stage:'complete',student_answer_assessment:'correct'}, 'explain');
  const history = [{role:'assistant',text:'Piensa en el recurso.',check_question:question}];
  assert.equal(h.api.turnRelation('Sí', state, history), 'acknowledgement');
});

test('question recovery only trusts assistant turns', () => {
  const h = fixtureChat();
  assert.equal(h.api.latestPendingQuestion([{role:'user',text:'Una metáfora',check_question:question}]), null);
});

test('a live question survives a greeting and an answer advances its own state', async () => {
  const h = fixtureChat();
  const first = (await h.send('Explícame la metáfora', 'new_topic')).data;
  const greeting = (await h.send('Hola Eterna')).data;
  assert.equal(greeting.pedagogical_state.pending_question, question);
  assert.equal(greeting.pedagogical_state.pending_question_id, first.pedagogical_state.pending_question_id);
  const answer = (await h.send('Una metáfora', 'answer')).data;
  assert.equal(answer.student_answer_assessment, 'correct');
  assert.equal(answer.pedagogical_state.pending_question, null);
  assert.equal(answer.pedagogical_state.pending_question_id, null);
  await h.finish();
});

test('a correct answer records the answered ideas, never the next question answer', () => {
  const h = fixtureChat();
  const incoming = h.api.sanitizePedagogicalState({active_subject:lesson.subject,active_concept:lesson.concept,pending_question:question,pending_question_id:'question:continuity:first',expected_answer_type:'short_concept',expected_key_ideas:['metáfora'],known_points:[],conversation_stage:'awaiting_student_answer'}, 'homework');
  const tutorOutput = {...lesson,expected_answer_type:'open',expected_key_ideas:['ojos y estrellas']};
  const next = h.api.buildPedagogicalState({incoming,mode:'homework',subject:lesson.subject,concept:lesson.concept,tutorOutput,assessment:'correct',finalCheck:nextQuestion,turnRel:'answer_to_pending'});
  assert.deepEqual(plain(next.known_points), ['metáfora']);
  assert.deepEqual(plain(next.expected_key_ideas), ['ojos y estrellas']);
  assert.notEqual(next.pending_question_id, incoming.pending_question_id);
});
