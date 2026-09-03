import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const sandbox = {
  console,
  URL,
  Request,
  Response,
  Headers,
  TextEncoder,
  TextDecoder,
  crypto: webcrypto,
  fetch,
  setTimeout,
  clearTimeout,
  addEventListener() {},
};
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__eternaTest = {
  clearNonAcademicIntent,
  turnRelation,
  isDontKnow: typeof isDontKnow === "function" ? isDontKnow : null,
  deterministicReviewGuard: typeof deterministicReviewGuard === "function" ? deterministicReviewGuard : null,
  validMicroCheck: typeof validMicroCheck === "function" ? validMicroCheck : null,
  initialAdaptiveQuestion: typeof initialAdaptiveQuestion === "function" ? initialAdaptiveQuestion : null,
  deterministicAdaptiveArithmeticTurn: typeof deterministicAdaptiveArithmeticTurn === "function" ? deterministicAdaptiveArithmeticTurn : null,
  isAdaptiveCloseRequest: typeof isAdaptiveCloseRequest === "function" ? isAdaptiveCloseRequest : null,
  adaptiveCloseResponse: typeof adaptiveCloseResponse === "function" ? adaptiveCloseResponse : null
};`, sandbox);

const api = sandbox.__eternaTest;

test("School Scope blocks explicit entertainment while preserving school context", () => {
  assert.equal(api.clearNonAcademicIntent("Ahora cuéntame un chiste de videojuegos."), true);
  assert.equal(api.clearNonAcademicIntent("Explícame la historia de los videojuegos para clase."), false);
});

test("a short academic answer remains a continuation when the active topic exists", () => {
  const state = {
    active_topic: "Etapas de la historia",
    active_subject: "Ciencias Sociales",
    active_concept: "Edad Media",
    pending_question: null,
    expected_answer_type: "none",
    last_tutor_act: "explain",
  };
  assert.equal(api.turnRelation("Media", state, []), "continuation_request");
});

test("no sé is detected as lack of answer, never as a correct answer", () => {
  assert.equal(typeof api.isDontKnow, "function");
  assert.equal(api.isDontKnow("No sé."), true);
  assert.equal(api.isDontKnow("el vapor de agua"), false);
});

test("review accepts equivalent valid arithmetic procedures", () => {
  assert.equal(typeof api.deterministicReviewGuard, "function");
  const history = [
    { role: "user", text: "Revisa: 18 × 4 = 72. Primer paso: 18 + 18 = 36." },
    { role: "user", text: "Luego 36 + 36 = 72." },
    { role: "user", text: "Compruebo 72 ÷ 4 = 18." },
  ];
  const result = api.deterministicReviewGuard("¿Está todo correcto? Da veredicto final.", history);
  assert.equal(result?.assessment, "correct");
  assert.match(result?.reply || "", /todo.*correcto/i);
});

test("review finds the first real error in fractions and language", () => {
  assert.equal(typeof api.deterministicReviewGuard, "function");
  const fraction = api.deterministicReviewGuard("Hice 2/3 + 1/6 = 3/9. Revisa el primer error.", []);
  assert.equal(fraction?.assessment, "incorrect");
  assert.match(fraction?.reply || "", /denominador común|no se suman los denominadores/i);

  const language = api.deterministicReviewGuard("e escrito: «Los kiwis vuelan por Nueva Zelanda». Revísalo.", []);
  assert.equal(language?.assessment, "incorrect");
  assert.match(language?.reply || "", /«e».*«he»/i);
});

test("review uses the standard Spanish school chronology for the Middle Ages", () => {
  assert.equal(typeof api.deterministicReviewGuard, "function");
  const result = api.deterministicReviewGuard(
    "Escribí: «La Edad Media empezó en 1492 y terminó en 476». Revisa solo el primer error.",
    [],
  );
  assert.equal(result?.assessment, "incorrect");
  assert.match(result?.reply || "", /empezó.*476/i);
  const recovered = api.deterministicReviewGuard(
    "Corregido: la Edad Media empezó en 476 y terminó en 1492.",
    [{ role: "user", text: "La Edad Media empezó en 1492 y terminó en 476." }],
  );
  assert.equal(recovered?.assessment, "correct");
});

test("review verifies a corrected step instead of dragging the obsolete error", () => {
  const history = [{ role: "user", text: "Hice 2/3 + 1/6 = 3/9." }];
  const recovered = api.deterministicReviewGuard("Lo corrijo: 2/3 + 1/6 = 5/6. ¿Ahora está bien?", history);
  assert.equal(recovered?.assessment, "correct");
});

test("micro-checks must be complete, distinct and answerable", () => {
  assert.equal(typeof api.validMicroCheck, "function");
  assert.equal(api.validMicroCheck("¿Cuánto es 7 × 8?", "7 × 8"), true);
  assert.equal(api.validMicroCheck("Vamos con una sola pregunta.", "6"), false);
  assert.equal(api.validMicroCheck("¿Qué parte debería repetir según mis errores?", "¿Qué parte debería repetir según mis errores?"), false);
  assert.equal(api.validMicroCheck("si ves lejía en una etiqueta,", "No sé"), false);
});

test("Exam and Practice always receive a concrete initial question", () => {
  assert.equal(typeof api.initialAdaptiveQuestion, "function");
  assert.equal(
    api.initialAdaptiveQuestion({ mode: "exam", text: "Empieza con 2 × 3", subject: "Matemáticas", concept: "multiplicaciones", difficulty: 1, questionNumber: 0 }),
    "¿Cuánto es 2 × 3?",
  );
  assert.match(
    api.initialAdaptiveQuestion({ mode: "practice", text: "Quiero practicar divisiones", subject: "Matemáticas", concept: "divisiones", difficulty: 1, questionNumber: 0 }),
    /÷.*\?/,
  );
});

test("deterministic arithmetic rounds advance once and preserve practice retries", () => {
  const base = { question_number: 1, correct_count: 0, partial_count: 0, incorrect_count: 0, difficulty: 1, focus: "multiplicaciones" };
  const ped = { active_subject: "Matemáticas", active_concept: "multiplicaciones", pending_question: "¿Cuánto es 2 × 3?", expected_answer_type: "numeric", turn_index: 1 };
  const correct = api.deterministicAdaptiveArithmeticTurn({ mode: "exam", text: "6", turnRel: "answer_to_pending", incomingModeState: base, incomingPedState: ped, subject: "Matemáticas", concept: "multiplicaciones" });
  assert.equal(correct.student_answer_assessment, "correct");
  assert.equal(correct.mode_state.correct_count, 1);
  assert.equal(correct.mode_state.question_number, 2);
  assert.notEqual(correct.check_question, ped.pending_question);

  const retry = api.deterministicAdaptiveArithmeticTurn({ mode: "practice", text: "5", turnRel: "answer_to_pending", incomingModeState: base, incomingPedState: ped, subject: "Matemáticas", concept: "multiplicaciones" });
  assert.equal(retry.student_answer_assessment, "incorrect");
  assert.equal(retry.mode_state.incorrect_count, 1);
  assert.equal(retry.mode_state.question_number, 1);
  assert.equal(retry.check_question, ped.pending_question);
});

test("Exam sustains ten consecutive deterministic rounds with coherent counters", () => {
  let modeState = { question_number: 1, correct_count: 0, partial_count: 0, incorrect_count: 0, difficulty: 1, focus: "multiplicaciones" };
  let ped = { active_subject: "Matemáticas", active_concept: "multiplicaciones", pending_question: "¿Cuánto es 2 × 3?", expected_answer_type: "numeric", turn_index: 1 };
  for (let round = 0; round < 10; round++) {
    const match = ped.pending_question.match(/(\d+)\s*×\s*(\d+)/);
    assert.ok(match, `round ${round + 1} has a concrete multiplication`);
    const answer = String(Number(match[1]) * Number(match[2]));
    const result = api.deterministicAdaptiveArithmeticTurn({ mode: "exam", text: answer, turnRel: "answer_to_pending", incomingModeState: modeState, incomingPedState: ped, subject: "Matemáticas", concept: "multiplicaciones" });
    assert.equal(result.student_answer_assessment, "correct");
    modeState = result.mode_state;
    ped = result.pedagogical_state;
  }
  assert.equal(modeState.correct_count, 10);
  assert.equal(modeState.question_number, 11);
  assert.equal(modeState.incorrect_count, 0);
  assert.equal(modeState.difficulty, 5);
});

test("Exam and Practice close without grading a non-answer or inventing a new question", () => {
  assert.equal(api.isAdaptiveCloseRequest("Dame el resumen"), true);
  const modeState = { question_number: 7, correct_count: 4, partial_count: 1, incorrect_count: 1, difficulty: 3, focus: "fracciones" };
  const ped = { active_subject: "Matemáticas", active_concept: "fracciones", pending_question: "2/3 + 1/6 = ?", turn_index: 8 };
  const result = api.adaptiveCloseResponse(ped, "exam", modeState);
  assert.equal(result.check_question, null);
  assert.equal(result.student_answer_assessment, "not_applicable");
  assert.equal(result.mode_state.correct_count, 4);
  assert.equal(result.pedagogical_state.conversation_stage, "complete");
  assert.match(result.reply, /4 correctos.*1 parcial.*1 incorrecto/i);
});
