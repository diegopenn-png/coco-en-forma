import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const executableSource = source.replace(/\nexport default\s*\{[\s\S]*?\};\s*$/, "");
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
vm.runInContext(`${executableSource}\n;globalThis.__eternaTest = {
  clearNonAcademicIntent,
  turnRelation,
  isDontKnow: typeof isDontKnow === "function" ? isDontKnow : null,
  deterministicReviewGuard: typeof deterministicReviewGuard === "function" ? deterministicReviewGuard : null,
  validMicroCheck: typeof validMicroCheck === "function" ? validMicroCheck : null,
  initialAdaptiveQuestion: typeof initialAdaptiveQuestion === "function" ? initialAdaptiveQuestion : null,
  deterministicAdaptiveArithmeticTurn: typeof deterministicAdaptiveArithmeticTurn === "function" ? deterministicAdaptiveArithmeticTurn : null,
  deterministicAdaptiveFractionTurn: typeof deterministicAdaptiveFractionTurn === "function" ? deterministicAdaptiveFractionTurn : null,
  deterministicHomeworkFractionRetry: typeof deterministicHomeworkFractionRetry === "function" ? deterministicHomeworkFractionRetry : null,
  expectedFractionForQuestion: typeof expectedFractionForQuestion === "function" ? expectedFractionForQuestion : null,
  nextMultiplicationQuestion: typeof nextMultiplicationQuestion === "function" ? nextMultiplicationQuestion : null,
  stripTrailingStudentQuestion: typeof stripTrailingStudentQuestion === "function" ? stripTrailingStudentQuestion : null,
  isAdaptiveCloseRequest: typeof isAdaptiveCloseRequest === "function" ? isAdaptiveCloseRequest : null,
  adaptiveCloseResponse: typeof adaptiveCloseResponse === "function" ? adaptiveCloseResponse : null
};`, sandbox);

const api = sandbox.__eternaTest;

test("Worker uses the ES Modules entry point required for versioned previews", () => {
  assert.match(source, /export default\s*\{/);
  assert.doesNotMatch(source, /addEventListener\s*\(\s*["']fetch["']/);
});

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

test("review accepts a short corrected result for the pending arithmetic step", () => {
  const history = [
    { role: "user", text: "He escrito: 346 + 278 = 514. ¿Está bien?" },
    { role: "user", text: "614" },
  ];
  const stillWrong = api.deterministicReviewGuard("614", history.slice(0, 1));
  assert.equal(stillWrong?.assessment, "incorrect");
  assert.match(stillWrong?.check_question || "", /resultado correcto/i);

  const recovered = api.deterministicReviewGuard("624", history);
  assert.equal(recovered?.assessment, "correct");
  assert.equal(recovered?.check_question, null);
  assert.match(recovered?.reply || "", /corregido el error/i);
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

test("fraction comparisons are graded mathematically and counters stay coherent", () => {
  const base = { question_number: 2, correct_count: 1, partial_count: 0, incorrect_count: 0, difficulty: 2, focus: "comparar fracciones" };
  const ped = { active_subject: "Matemáticas", active_concept: "comparar fracciones", pending_question: "¿Cuál es mayor: 4/7 o 4/9?", expected_answer_type: "short_concept", turn_index: 2 };
  const wrong = api.deterministicAdaptiveFractionTurn({ mode: "exam", text: "4/9", turnRel: "answer_to_pending", incomingModeState: base, incomingPedState: ped, subject: "Matemáticas", concept: "comparar fracciones" });
  assert.equal(wrong.student_answer_assessment, "incorrect");
  assert.match(wrong.reply, /^Incorrecto\./);
  assert.doesNotMatch(wrong.reply, /No del todo/i);
  assert.match(wrong.reply, /4\/7/);
  assert.equal(wrong.mode_state.correct_count, 1);
  assert.equal(wrong.mode_state.incorrect_count, 1);
  assert.equal(wrong.mode_state.question_number, 3);
  assert.match(wrong.check_question, /mayor/i);

  const right = api.deterministicAdaptiveFractionTurn({ mode: "exam", text: "La mayor es 4/7", turnRel: "answer_to_pending", incomingModeState: base, incomingPedState: ped, subject: "Matemáticas", concept: "comparar fracciones" });
  assert.equal(right.student_answer_assessment, "correct");
  assert.equal(right.mode_state.correct_count, 2);
  assert.equal(right.mode_state.incorrect_count, 0);
});

test("Exam labels objectively wrong arithmetic answers as incorrect", () => {
  const base = { question_number: 1, correct_count: 0, partial_count: 0, incorrect_count: 0, difficulty: 2, focus: "multiplicaciones" };
  const ped = { active_subject: "Matemáticas", active_concept: "multiplicaciones", pending_question: "¿Cuánto es 7 × 5?", expected_answer_type: "numeric", turn_index: 1 };
  const result = api.deterministicAdaptiveArithmeticTurn({ mode: "exam", text: "30", turnRel: "answer_to_pending", incomingModeState: base, incomingPedState: ped, subject: "Matemáticas", concept: "multiplicaciones" });
  assert.equal(result.student_answer_assessment, "incorrect");
  assert.match(result.reply, /^Incorrecto:/);
  assert.doesNotMatch(result.reply, /No del todo/i);
});

test("fraction comparison understands greater and lesser prompts", () => {
  const greater = api.expectedFractionForQuestion("¿Cuál de estas fracciones es mayor: 2/3 o 3/4?");
  assert.equal(`${greater.rawN}/${greater.rawD}`, "3/4");
  const lesser = api.expectedFractionForQuestion("¿Cuál es menor: 5/8 o 5/6?");
  assert.equal(`${lesser.rawN}/${lesser.rawD}`, "5/8");
});

test("practice keeps the requested multiplication table as difficulty changes", () => {
  for (let difficulty = 1; difficulty <= 5; difficulty++) {
    for (let questionNumber = 0; questionNumber < 6; questionNumber++) {
      const question = api.nextMultiplicationQuestion({ difficulty, questionNumber, focus: "Tabla de multiplicar del 7" });
      assert.match(question, /¿Cuánto es 7 × \d+\?/);
    }
  }
  const base = { question_number: 1, correct_count: 0, partial_count: 0, incorrect_count: 0, difficulty: 2, focus: "Tabla de multiplicar del 7" };
  const ped = { active_subject: "Matemáticas", active_concept: "Tabla de multiplicar del 7", pending_question: "¿Cuánto es 7 × 4?", expected_answer_type: "numeric", turn_index: 1 };
  const result = api.deterministicAdaptiveArithmeticTurn({ mode: "practice", text: "28", turnRel: "answer_to_pending", incomingModeState: base, incomingPedState: ped, subject: "Matemáticas", concept: "Tabla de multiplicar del 7", focus: "Tabla de multiplicar del 7" });
  assert.match(result.check_question, /¿Cuánto es 7 × \d+\?/);
});

test("homework fraction mistakes keep the scaffold and never reveal the final answer", () => {
  for (const pending of ["¿En cuántas octavas partes equivale 3/4?", "¿Cuánto vale 3/4 en octavos?", "Expresa 3/4 con denominador 8."]) {
    const result = api.deterministicHomeworkFractionRetry({ mode: "homework", text: "5/8", turnRel: "answer_to_pending", incomingModeState: {}, incomingPedState: { active_subject: "Matemáticas", active_concept: "suma de fracciones", pending_question: pending, turn_index: 1 }, subject: "Matemáticas", concept: "suma de fracciones" });
    assert.equal(result.student_answer_assessment, "incorrect");
    assert.equal(result.check_question, pending);
    assert.doesNotMatch(result.reply, /6\/8|7\/8/);
    assert.match(result.reply, /mismo número.*numerador/i);
  }
});

test("removing a duplicated check also removes dangling micro-check labels", () => {
  const question = "¿Cuál es mayor: 2/3 o 3/4?";
  assert.equal(api.stripTrailingStudentQuestion(`La comparación se hace en cruz. Microcomprobación: ${question}`, question), "La comparación se hace en cruz.");
  assert.equal(api.stripTrailingStudentQuestion(`Mira el dibujo. Microcomprobación: si tienes 2/4, ${question}`, question), "Mira el dibujo.");
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
