import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { webcrypto } from "node:crypto";

const source = readFileSync(new URL("../../eterna-state-contract-v3.js", import.meta.url), "utf8");
const sandbox = { crypto: webcrypto, console };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const contract = sandbox.EternaStateContractV3;

const sid = "session:test-000001";
const ids = {
  ask: "action:ask-000001",
  answer: "action:answer-000001",
  assess: "action:assess-000001",
  feedback: "action:feedback-000001",
  next: "action:next-000001",
  close: "action:close-000001"
};

test("classic script installs one Worker-compatible global API", () => {
  assert.equal(contract.CONTRACT_VERSION, 3);
  assert.deepEqual(Array.from(contract.MODES), ["homework", "ask", "review", "explain", "exam", "practice"]);
  assert.equal(typeof contract.transitionActivityState, "function");
});

test("new state is bounded, privacy-safe and starts at ASK", () => {
  const state = contract.createActivityState({
    session_id: sid,
    mode: "practice",
    difficulty: 99,
    practice_target: {
      curriculum_id: "es-lomloe.primary",
      subject_id: "math",
      skill_id: "fractions.equivalent",
      level_id: "primary-5",
      label: "Fracciones equivalentes <script>alert(1)</script>",
      source: "explicit",
      raw_prompt: "texto del menor que nunca debe sobrevivir"
    }
  });
  assert.equal(state.phase, "ASK");
  assert.equal(state.next_transition, "WAIT");
  assert.equal(state.difficulty, 5);
  assert.equal(state.practice_target.raw_prompt, undefined);
  assert.doesNotMatch(state.practice_target.label, /[<>]/);
});

test("sanitizer rejects invalid phase state and clamps counters", () => {
  const state = contract.sanitizeActivityState({
    contract_version: 3,
    session_id: sid,
    mode: "exam",
    phase: "WAIT",
    question_id: null,
    question_number: -2,
    correct_count: 100000,
    partial_count: -1,
    incorrect_count: "4",
    hints_used: Infinity
  });
  assert.equal(state.phase, "ASK");
  assert.equal(state.question_number, 1);
  assert.equal(state.correct_count, 10000);
  assert.equal(state.partial_count, 0);
  assert.equal(state.incorrect_count, 4);
  assert.equal(state.hints_used, 0);
});

test("strict ASK-WAIT-ASSESS-FEEDBACK-NEXT cycle evaluates once", () => {
  let state = contract.createActivityState({ session_id: sid, mode: "exam" });
  let result = contract.transitionActivityState(state, contract.EVENTS.QUESTION_ISSUED, {
    action_id: ids.ask,
    question_id: "question:fractions-001",
    question: "¿Cuál es mayor, 3/5 o 3/8?"
  });
  assert.equal(result.ok, true);
  state = result.state;
  assert.equal(state.phase, "WAIT");

  result = contract.transitionActivityState(state, contract.EVENTS.ANSWER_RECEIVED, {
    action_id: ids.answer,
    answered_question_id: state.question_id,
    expected_mode: "exam",
    expected_session_id: sid
  });
  assert.equal(result.ok, true);
  state = result.state;
  assert.equal(state.phase, "ASSESS");

  result = contract.transitionActivityState(state, contract.EVENTS.ASSESSMENT_RECORDED, {
    action_id: ids.assess,
    assessment: "incorrect"
  });
  assert.equal(result.ok, true);
  state = result.state;
  assert.equal(state.phase, "FEEDBACK");
  assert.equal(state.incorrect_count, 1);

  const duplicate = contract.transitionActivityState(state, contract.EVENTS.ASSESSMENT_RECORDED, {
    action_id: ids.assess,
    assessment: "incorrect"
  });
  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.state.incorrect_count, 1);

  state = contract.transitionActivityState(state, contract.EVENTS.FEEDBACK_DELIVERED, { action_id: ids.feedback }).state;
  assert.equal(state.phase, "NEXT");
  state = contract.transitionActivityState(state, contract.EVENTS.CONTINUE, { action_id: ids.next }).state;
  assert.equal(state.phase, "ASK");
  assert.equal(state.question_number, 2);
});

test("late answer and mode or session drift are rejected without mutation", () => {
  const waiting = contract.transitionActivityState(
    contract.createActivityState({ session_id: sid, mode: "practice" }),
    contract.EVENTS.QUESTION_ISSUED,
    { action_id: ids.ask, question_id: "question:table-7-001", question: "¿Cuánto es 7 × 4?" }
  ).state;
  const stale = contract.transitionActivityState(waiting, contract.EVENTS.ANSWER_RECEIVED, {
    action_id: ids.answer,
    answered_question_id: "question:older-0001"
  });
  assert.equal(stale.ok, false);
  assert.ok(stale.errors.some(error => error.code === "STALE_QUESTION"));
  assert.equal(stale.state.phase, "WAIT");

  const drift = contract.validateActivityRequest(waiting, {
    expected_mode: "exam",
    expected_session_id: "session:another-0001"
  });
  assert.equal(drift.ok, false);
  assert.deepEqual(Array.from(drift.errors, error => error.code), ["MODE_MISMATCH", "SESSION_MISMATCH"]);
});

test("same normalized question preserves its id while a new question rotates it", () => {
  const initial = { question_id: "question:stable-0001" };
  assert.equal(contract.resolveQuestionId(initial, {
    previous_question: " ¿Cuánto es 48 ÷ 6? ",
    question: "¿CUÁNTO es 48 ÷ 6?",
    question_id: "question:replacement-1"
  }), initial.question_id);
  assert.equal(contract.resolveQuestionId(initial, {
    previous_question: "¿Cuánto es 48 ÷ 6?",
    question: "¿Cuánto es 7 × 7?",
    question_id: "question:new-000001"
  }), "question:new-000001");
});

test("abstract persistence whitelist excludes chat, image and question text", () => {
  const state = contract.toPersistentActivityState({
    ...contract.createActivityState({ session_id: sid, mode: "homework" }),
    pending_question: "dato académico crudo",
    history: [{ role: "user", text: "información del menor" }],
    image: "data:image/jpeg;base64,private",
    text: "respuesta del menor",
    unexpected: "secret"
  });
  assert.deepEqual(Object.keys(state), Array.from(contract.PERSISTENCE_KEYS));
  assert.equal("pending_question" in state, false);
  assert.equal("history" in state, false);
  assert.equal("image" in state, false);
  assert.equal("text" in state, false);
  assert.doesNotMatch(JSON.stringify(state), /dato académico|información del menor|base64|respuesta del menor/);
});

test("hint and close transitions never count as an incorrect answer", () => {
  let state = contract.transitionActivityState(
    contract.createActivityState({ session_id: sid, mode: "homework" }),
    contract.EVENTS.QUESTION_ISSUED,
    { action_id: ids.ask, question_id: "question:homework-001", question: "¿Qué número multiplica a 4 para obtener 8?" }
  ).state;
  state = contract.transitionActivityState(state, contract.EVENTS.HINT_USED, { action_id: "action:hint-000001" }).state;
  assert.equal(state.phase, "WAIT");
  assert.equal(state.hints_used, 1);
  assert.equal(state.incorrect_count, 0);
  state = contract.transitionActivityState(state, contract.EVENTS.SESSION_CLOSED, { action_id: ids.close }).state;
  assert.equal(state.phase, "CLOSE");
  assert.equal(state.next_transition, null);
  assert.equal(state.incorrect_count, 0);
});
