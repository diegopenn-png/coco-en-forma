import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const stateContractSource = readFileSync(new URL("../../eterna-state-contract-v3.js", import.meta.url), "utf8");
const executableSource = source.replace(/^import\s+[^;]+;\s*/gm, "").replace(/\nexport default\s*\{[\s\S]*?\};\s*$/, "");
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
vm.runInContext(stateContractSource, sandbox);
vm.runInContext(`${executableSource}\n;globalThis.__eternaTest = {
  clearNonAcademicIntent,
  turnRelation,
  isDontKnow: typeof isDontKnow === "function" ? isDontKnow : null,
  deterministicReviewGuard: typeof deterministicReviewGuard === "function" ? deterministicReviewGuard : null,
  validMicroCheck: typeof validMicroCheck === "function" ? validMicroCheck : null,
  initialAdaptiveQuestion: typeof initialAdaptiveQuestion === "function" ? initialAdaptiveQuestion : null,
  deterministicAdaptiveArithmeticTurn: typeof deterministicAdaptiveArithmeticTurn === "function" ? deterministicAdaptiveArithmeticTurn : null,
  deterministicAdaptiveFractionTurn: typeof deterministicAdaptiveFractionTurn === "function" ? deterministicAdaptiveFractionTurn : null,
  deterministicHomeworkFractionFactorTurn: typeof deterministicHomeworkFractionFactorTurn === "function" ? deterministicHomeworkFractionFactorTurn : null,
  deterministicHomeworkFractionRetry: typeof deterministicHomeworkFractionRetry === "function" ? deterministicHomeworkFractionRetry : null,
  deterministicConceptCheckTurn: typeof deterministicConceptCheckTurn === "function" ? deterministicConceptCheckTurn : null,
  expectedFractionForQuestion: typeof expectedFractionForQuestion === "function" ? expectedFractionForQuestion : null,
  singleStudentAct: typeof singleStudentAct === "function" ? singleStudentAct : null,
  enforceIncorrectOpening: typeof enforceIncorrectOpening === "function" ? enforceIncorrectOpening : null,
  repairIncompleteReply: typeof repairIncompleteReply === "function" ? repairIncompleteReply : null,
  nextMultiplicationQuestion: typeof nextMultiplicationQuestion === "function" ? nextMultiplicationQuestion : null,
  stripTrailingStudentQuestion: typeof stripTrailingStudentQuestion === "function" ? stripTrailingStudentQuestion : null,
  isAdaptiveCloseRequest: typeof isAdaptiveCloseRequest === "function" ? isAdaptiveCloseRequest : null,
  adaptiveCloseResponse: typeof adaptiveCloseResponse === "function" ? adaptiveCloseResponse : null,
  sanitizePedagogicalState: typeof sanitizePedagogicalState === "function" ? sanitizePedagogicalState : null,
  buildPedagogicalState: typeof buildPedagogicalState === "function" ? buildPedagogicalState : null,
  parseContractV3Input: typeof parseContractV3Input === "function" ? parseContractV3Input : null,
  staleQuestionProblem: typeof staleQuestionProblem === "function" ? staleQuestionProblem : null,
  hintRequestResponse: typeof hintRequestResponse === "function" ? hintRequestResponse : null,
  normalizeSubscriptionRecord: typeof normalizeSubscriptionRecord === "function" ? normalizeSubscriptionRecord : null,
  subscriptionActive: typeof subscriptionActive === "function" ? subscriptionActive : null,
  addContractEnvelope: typeof addContractEnvelope === "function" ? addContractEnvelope : null
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

test("exam keeps every requested multiplication table instead of drifting topics", () => {
  for (let difficulty = 1; difficulty <= 5; difficulty++) {
    for (let questionNumber = 0; questionNumber < 10; questionNumber++) {
      const question = api.nextMultiplicationQuestion({ difficulty, questionNumber, focus: "tablas del 6 y del 7" });
      assert.match(question, /¿Cuánto es [67] × \d+\?/);
    }
  }
  const base = { question_number: 2, correct_count: 1, partial_count: 0, incorrect_count: 1, difficulty: 2, focus: "tablas del 6 y del 7" };
  const ped = { active_subject: "Matemáticas", active_concept: "tablas del 6 y del 7", pending_question: "¿Cuánto es 7 × 6?", expected_answer_type: "numeric", turn_index: 2 };
  const result = api.deterministicAdaptiveArithmeticTurn({ mode: "exam", text: "42", turnRel: "answer_to_pending", incomingModeState: base, incomingPedState: ped, subject: "Matemáticas", concept: "tablas del 6 y del 7", focus: "tablas del 6 y del 7" });
  assert.match(result.check_question, /¿Cuánto es [67] × \d+\?/);
});

test("incomplete model fragments are removed before reaching a child", () => {
  const raw = "Correcto: el hielo es menos denso. Por eso flota. Si algo es menos denso que el agua,";
  assert.equal(api.repairIncompleteReply(raw), "Correcto: el hielo es menos denso. Por eso flota.");
  assert.equal(api.repairIncompleteReply("Una explicación completa."), "Una explicación completa.");
});

test("homework fraction mistakes keep the scaffold and never reveal the final answer", () => {
  for (const pending of ["¿En cuántas octavas partes equivale 3/4?", "¿Cuánto vale 3/4 en octavos?", "¿Cuántos octavos son 3/4?", "Expresa 3/4 con denominador 8."]) {
    const result = api.deterministicHomeworkFractionRetry({ mode: "homework", text: "5/8", turnRel: "answer_to_pending", incomingModeState: {}, incomingPedState: { active_subject: "Matemáticas", active_concept: "suma de fracciones", pending_question: pending, turn_index: 1 }, subject: "Matemáticas", concept: "suma de fracciones" });
    assert.equal(result.student_answer_assessment, "incorrect");
    assert.equal(result.check_question, pending);
    assert.doesNotMatch(result.reply, /6\/8|7\/8/);
    assert.match(result.reply, /mismo número.*numerador/i);
    assert.match(result.reply, /^Incorrecto\./);
  }
});

test("homework advances after a correct denominator factor instead of repeating the question", () => {
  const pending = "¿Qué número multiplica a 4 para obtener 8?";
  const common = { mode: "homework", turnRel: "answer_to_pending", incomingModeState: {}, incomingPedState: { active_subject: "Matemáticas", active_concept: "suma de fracciones", pending_question: pending, turn_index: 1 }, subject: "Matemáticas", concept: "suma de fracciones", history: [{ role: "user", text: "Tengo que resolver 3/4 + 1/8. No sé cómo empezar." }] };
  const right = api.deterministicHomeworkFractionFactorTurn({ ...common, text: "2" });
  assert.equal(right.student_answer_assessment, "correct");
  assert.equal(right.check_question, "¿Cuánto vale 3/4 en octavos?");
  assert.notEqual(right.check_question, pending);
  assert.match(right.reply, /Correcto: 4 × 2 = 8/);
  assert.doesNotMatch(right.reply, /6\/8|7\/8/);

  const wrong = api.deterministicHomeworkFractionFactorTurn({ ...common, text: "3" });
  assert.equal(wrong.student_answer_assessment, "incorrect");
  assert.equal(wrong.check_question, pending);
  assert.doesNotMatch(wrong.reply, /6\/8|7\/8/);
});

test("homework returns to the original operation after a correct equivalent fraction", () => {
  const history = [{ role: "user", text: "Tengo que resolver 3/4 + 1/8. No sé cómo empezar." }];
  const equivalent = api.deterministicHomeworkFractionRetry({ mode: "homework", text: "6/8", turnRel: "answer_to_pending", incomingModeState: {}, incomingPedState: { active_subject: "Matemáticas", active_concept: "suma de fracciones", pending_question: "¿Cuánto vale 3/4 en octavos?", turn_index: 2 }, subject: "Matemáticas", concept: "suma de fracciones", history });
  assert.equal(equivalent.student_answer_assessment, "correct");
  assert.equal(equivalent.check_question, "¿Cuánto es 6/8 + 1/8?");
  assert.doesNotMatch(equivalent.reply, /simplific/i);

  const completed = api.deterministicHomeworkFractionRetry({ mode: "homework", text: "7/8", turnRel: "answer_to_pending", incomingModeState: {}, incomingPedState: { ...equivalent.pedagogical_state, pending_question: equivalent.check_question }, subject: "Matemáticas", concept: "suma de fracciones", history: [...history, { role: "assistant", text: equivalent.reply }, { role: "user", text: "6/8" }] });
  assert.equal(completed.student_answer_assessment, "correct");
  assert.equal(completed.check_question, null);
  assert.match(completed.reply, /Has resuelto el ejercicio/);
});

test("Ask and Explain promote embedded checks into explicit pending questions", () => {
  const initial = api.singleStudentAct({ mode: "ask", reply: "Los hemisferios reciben luz distinta. Microcomprobación: ¿qué hemisferio recibe más luz?", tutorData: { check_question: null }, turnRel: "continuation_request", incoming: { turn_index: 2 }, assessment: "not_applicable", studentText: "¿Por qué?" });
  assert.equal(initial.display_check, "¿qué hemisferio recibe más luz?");
  assert.equal(initial.pending_question, initial.display_check);
  assert.doesNotMatch(initial.reply, /Microcomprobación|¿qué hemisferio/i);

  const yesNo = api.singleStudentAct({ mode: "explain", reply: "1/2 y 2/4 son equivalentes. Ahora dime solo esto: ¿sí o no?", tutorData: { check_question: null }, turnRel: "confusion_request", incoming: { turn_index: 2 }, assessment: "not_applicable", studentText: "No lo entendí" });
  assert.equal(yesNo.display_check, "¿1/2 y 2/4 representan la misma cantidad?");
  assert.equal(yesNo.pending_question, yesNo.display_check);
});

test("Ask and Explain close after a correct comprehension check", () => {
  const result = api.singleStudentAct({ mode: "ask", reply: "Correcto. Esa es la idea clave. ¿Y qué ocurre después?", tutorData: { check_question: "¿Y qué ocurre después?" }, turnRel: "answer_to_pending", incoming: { turn_index: 3, pending_question: "¿Cuál es la idea clave?" }, assessment: "correct", studentText: "La respuesta correcta" });
  assert.equal(result.display_check, null);
  assert.equal(result.pending_question, null);
  assert.doesNotMatch(result.reply, /¿Y qué ocurre después\?/);
});

test("known conceptual checks reject contradictions instead of validating them", () => {
  const seasons = api.deterministicConceptCheckTurn({ mode: "ask", text: "También es verano.", turnRel: "answer_to_pending", incomingModeState: {}, incomingPedState: { active_subject: "Ciencias Naturales", active_concept: "estaciones del año", pending_question: "¿Y qué ocurre en el hemisferio contrario?", turn_index: 3 }, subject: "Ciencias Naturales", concept: "estaciones del año", history: [{ role: "assistant", text: "Si en España es verano, en Argentina es invierno." }] });
  assert.equal(seasons.student_answer_assessment, "incorrect");
  assert.match(seasons.reply, /^Incorrecto\./);
  assert.doesNotMatch(seasons.reply, /^Sí\b/);
  assert.match(seasons.check_question, /verano o invierno/i);

  const equivalence = api.deterministicConceptCheckTurn({ mode: "explain", text: "No", turnRel: "answer_to_pending", incomingModeState: {}, incomingPedState: { active_subject: "Matemáticas", active_concept: "fracciones equivalentes", pending_question: "¿1/2 y 2/4 representan la misma cantidad?", turn_index: 2 }, subject: "Matemáticas", concept: "fracciones equivalentes", history: [] });
  assert.equal(equivalence.student_answer_assessment, "incorrect");
  assert.match(equivalence.reply, /^Incorrecto\./);
  assert.equal(equivalence.check_question, "¿1/2 y 2/4 representan la misma cantidad?");
});

test("Review evaluates each numeric retry and gives a new concrete hint", () => {
  const history = [{ role: "user", text: "He hecho 48 ÷ 6 = 7. Revísalo." }, { role: "assistant", text: "El primer error está en 48 ÷ 6 = 7." }];
  const wrong = api.deterministicReviewGuard("9", history);
  assert.equal(wrong.assessment, "incorrect");
  assert.match(wrong.reply, /^Incorrecto\./);
  assert.match(wrong.reply, /6 × 9 = 54/);
  assert.match(wrong.check_question, /resultado correcto/i);
  const right = api.deterministicReviewGuard("8", history);
  assert.equal(right.assessment, "correct");
  assert.equal(right.check_question, null);
});

test("Practice labels wrong arithmetic explicitly and provides a usable strategy", () => {
  const result = api.deterministicAdaptiveArithmeticTurn({ mode: "practice", text: "30", turnRel: "answer_to_pending", incomingModeState: { question_number: 1, correct_count: 0, incorrect_count: 0, difficulty: 2, focus: "tabla del 7" }, incomingPedState: { active_subject: "Matemáticas", active_concept: "tabla del 7", pending_question: "¿Cuánto es 7 × 4?", turn_index: 1 }, subject: "Matemáticas", concept: "tabla del 7", focus: "tabla del 7" });
  assert.equal(result.student_answer_assessment, "incorrect");
  assert.match(result.reply, /^Incorrecto\./);
  assert.match(result.reply, /7 \+ 7 \+ 7 \+ 7/);
  assert.equal(result.check_question, "¿Cuánto es 7 × 4?");
});

test("incorrect feedback can never begin with a positive or partial validation", () => {
  for (const value of ["Sí. En realidad es invierno.", "Casi: revisa el cálculo.", "No del todo. Revisa el cálculo.", "La respuesta necesita revisión."]) {
    assert.match(api.enforceIncorrectOpening(value), /^Incorrecto\./);
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

test("Worker v3 forces request mode and rejects a stale answered_question_id", () => {
  const qid = "question:11111111-1111-4111-8111-111111111111";
  const ped = api.sanitizePedagogicalState({
    current_mode: "exam",
    pending_question: "¿Cuánto es 7 × 4?",
    pending_question_id: qid,
    conversation_stage: "awaiting_student_answer",
  }, "practice");
  assert.equal(ped.current_mode, "practice");
  const body = {
    client_state_contract: 3,
    request_id: "turn:11111111-1111-4111-8111-111111111111",
    client_turn_id: "turn:11111111-1111-4111-8111-111111111111",
    answered_question_id: "question:22222222-2222-4222-8222-222222222222",
    student_action: "answer",
    activity_state: {
      contract_version: 3,
      session_id: "session:11111111-1111-4111-8111-111111111111",
      mode: "exam",
      phase: "WAIT",
      question_id: qid,
      question_number: 1,
      difficulty: 2,
    },
  };
  const meta = api.parseContractV3Input(body, { mode: "practice", modeState: {}, pedState: ped });
  assert.equal(meta.activityState.mode, "practice");
  assert.equal(api.staleQuestionProblem(meta, ped)?.error, "ETERNA_STALE_QUESTION");
  meta.answeredQuestionId = qid;
  assert.equal(api.staleQuestionProblem(meta, ped), null);
});

test("Worker v3 preserves the question id for the same retry and rotates it for a new question", () => {
  const qid = "question:33333333-3333-4333-8333-333333333333";
  const incoming = api.sanitizePedagogicalState({
    pending_question: "¿Cuánto es 3/4 en octavos?",
    pending_question_id: qid,
    conversation_stage: "awaiting_student_answer",
  }, "practice");
  const tutorOutput = { help_level: 2, expected_answer_type: "short_concept", expected_key_ideas: [], likely_misconceptions: [], conversation_stage: "awaiting_student_answer", strategy_used: "socratic_question", tutor_act: "practice_question", new_explained_points: [], needs_clarification: false };
  const retry = api.buildPedagogicalState({ incoming, mode: "practice", subject: "Matemáticas", concept: "fracciones", tutorOutput, assessment: "incorrect", finalCheck: incoming.pending_question, turnRel: "answer_to_pending" });
  assert.equal(retry.pending_question_id, qid);
  const next = api.buildPedagogicalState({ incoming, mode: "practice", subject: "Matemáticas", concept: "fracciones", tutorOutput, assessment: "correct", finalCheck: "¿Cuánto es 1/2 en octavos?", turnRel: "answer_to_pending" });
  assert.notEqual(next.pending_question_id, qid);
});

test("canonical hint_request is non-evaluable and preserves counters and question id", () => {
  const qid = "question:44444444-4444-4444-8444-444444444444";
  const ped = api.sanitizePedagogicalState({ active_subject: "Matemáticas", active_concept: "fracciones", pending_question: "¿Cuánto es 3/4 en octavos?", pending_question_id: qid, expected_answer_type: "short_concept", conversation_stage: "awaiting_student_answer", current_help_level: 1 }, "practice");
  const modeState = { question_number: 1, correct_count: 2, partial_count: 1, incorrect_count: 3, difficulty: 2, focus: "fracciones" };
  const hint = api.hintRequestResponse(ped, "practice", modeState);
  assert.equal(hint.student_answer_assessment, "not_applicable");
  assert.equal(hint.pedagogical_state.pending_question_id, qid);
  assert.deepEqual(JSON.parse(JSON.stringify(hint.mode_state)), modeState);
  const comparison = api.hintRequestResponse(api.sanitizePedagogicalState({ active_subject: "Matemáticas", active_concept: "comparar fracciones", pending_question: "¿Cuál es mayor, 1/4 o 1/3?", pending_question_id: qid, expected_answer_type: "short_concept", conversation_stage: "awaiting_student_answer", current_help_level: 1 }, "practice"), "practice", modeState);
  assert.match(comparison.reply, /productos cruzados/i);
  assert.match(comparison.reply, /1 × 3.*1 × 4/);
  assert.doesNotMatch(comparison.reply, /busca primero la idea/i);
});

test("expired or malformed trials fail closed in the Worker", () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  assert.equal(api.normalizeSubscriptionRecord({ status: "trialing", trial_end: null }).status, "expired");
  assert.equal(api.normalizeSubscriptionRecord({ status: "trialing", trial_end: "bad" }).status, "expired");
  assert.equal(api.subscriptionActive({ status: "trialing", trial_end: past }), false);
  assert.equal(api.subscriptionActive({ status: "active" }), true);
});

test("v3 JSON responses echo canonical request identity and activity state", async () => {
  const requestId = "turn:55555555-5555-4555-8555-555555555555";
  const meta = api.parseContractV3Input({ client_state_contract: 3, request_id: requestId, client_turn_id: requestId, student_action: "new_topic", activity_state: { contract_version: 3, session_id: "session:55555555-5555-4555-8555-555555555555", mode: "exam", phase: "ASK", question_number: 1, difficulty: 2 } }, { mode: "exam", modeState: {}, pedState: {} });
  const response = await api.addContractEnvelope(new Response(JSON.stringify({ mode_state: { question_number: 1, difficulty: 2 }, pedagogical_state: { current_mode: "exam", pending_question: "¿Cuánto es 2 × 3?", pending_question_id: "question:55555555-5555-4555-8555-555555555555", conversation_stage: "awaiting_student_answer" }, student_answer_assessment: "not_applicable" }), { headers: { "Content-Type": "application/json" } }), meta, "exam");
  const data = await response.json();
  assert.equal(data.request_id, requestId);
  assert.equal(data.activity_state.mode, "exam");
  assert.equal(data.activity_state.phase, "WAIT");
  assert.equal(data.activity_state.question_id, "question:55555555-5555-4555-8555-555555555555");
});
