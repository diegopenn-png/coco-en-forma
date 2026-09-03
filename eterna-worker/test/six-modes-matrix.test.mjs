import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const sandbox = { console, URL, Request, Response, Headers, TextEncoder, TextDecoder, crypto: webcrypto, fetch, setTimeout, clearTimeout, addEventListener() {} };
vm.createContext(sandbox);
vm.runInContext(`${source}\n;globalThis.__matrix={deterministicMath,safeMathHint,turnRelation,deterministicReviewGuard,deterministicAdaptiveArithmeticTurn};`, sandbox);
const api = sandbox.__matrix;

const homeworkExpressions = ["2 + 3", "9 - 4", "7 × 8", "12 ÷ 3", "18 + 27", "100 - 36", "6 × 9", "144 ÷ 12"];
for (const expression of homeworkExpressions) test(`homework scaffolds without revealing ${expression}`, () => {
  const math = api.deterministicMath(expression);
  const guarded = api.safeMathHint(math, "homework");
  assert.ok(guarded?.reply);
  assert.doesNotMatch(guarded.reply, new RegExp(`(?:resultado|da|es)\\s*[:=]?\\s*${String(math.result).replace("/", "\\/")}\\b`, "i"));
});

const contextualAnswers = ["Media", "Combustible", "otra vez", "más fácil", "por qué", "cómo", "otro ejemplo", "vale"];
for (const answer of contextualAnswers) test(`ask preserves contextual answer: ${answer}`, () => {
  const relation = api.turnRelation(answer, { active_subject: "Ciencias Naturales", active_concept: "energía", pending_question: null, expected_answer_type: "none", last_tutor_act: "explain" }, []);
  assert.notEqual(relation, "new_topic");assert.notEqual(relation, "needs_scope");
});

const explainAnswers = ["Hacer funcionar un coche", "Combustible", "no entiendo", "otra vez", "más fácil", "otro ejemplo", "por qué", "cómo"];
for (const answer of explainAnswers) test(`explain keeps the energy circuit: ${answer}`, () => {
  const relation = api.turnRelation(answer, { active_subject: "Ciencias Naturales", active_concept: "energía", pending_question: null, expected_answer_type: "none", last_tutor_act: "explain" }, []);
  assert.notEqual(relation, "new_topic");assert.notEqual(relation, "needs_scope");
});

const reviewCases = [
  ["Revisa: 2 + 2 = 5.", "incorrect", []],
  ["Revisa: 2 + 2 = 4.", "correct", []],
  ["Hice 1/2 + 1/4 = 2/6. Revisa.", "incorrect", []],
  ["e escrito esta frase. Revísala.", "incorrect", []],
  ["La Edad Media empezó en 1492 y terminó en 476.", "incorrect", []],
  ["La Edad Media empezó en 476 y terminó en 1492.", "correct", []],
  ["Comprueba: 7 × 8 = 56.", "correct", []],
  ["Lo corrijo: 2/3 + 1/6 = 5/6.", "correct", [{ role: "user", text: "2/3 + 1/6 = 3/9." }]],
];
for (const [message, expected, history] of reviewCases) test(`review deterministic verdict: ${message}`, () => assert.equal(api.deterministicReviewGuard(message, history)?.assessment, expected));

const examCases = [[2,3],[4,5],[6,7],[8,9],[11,4],[12,6],[14,8],[17,9]];
for (const [a,b] of examCases) test(`exam grades and advances ${a} × ${b}`, () => {
  const question=`¿Cuánto es ${a} × ${b}?`,base={question_number:1,correct_count:0,partial_count:0,incorrect_count:0,difficulty:2,focus:"multiplicaciones"},ped={active_subject:"Matemáticas",active_concept:"multiplicaciones",pending_question:question,expected_answer_type:"numeric",turn_index:1};
  const result=api.deterministicAdaptiveArithmeticTurn({mode:"exam",text:String(a*b),turnRel:"answer_to_pending",incomingModeState:base,incomingPedState:ped,subject:"Matemáticas",concept:"multiplicaciones"});
  assert.equal(result.student_answer_assessment,"correct");assert.equal(result.mode_state.correct_count,1);assert.equal(result.mode_state.question_number,2);assert.notEqual(result.check_question,question);
});

const practiceCases = [[2,4],[3,5],[4,6],[5,7],[6,8],[7,9],[8,11],[9,12]];
for (const [a,b] of practiceCases) test(`practice explains and retries ${a} × ${b}`, () => {
  const question=`¿Cuánto es ${a} × ${b}?`,base={question_number:1,correct_count:0,partial_count:0,incorrect_count:0,difficulty:2,focus:"multiplicaciones"},ped={active_subject:"Matemáticas",active_concept:"multiplicaciones",pending_question:question,expected_answer_type:"numeric",turn_index:1};
  const result=api.deterministicAdaptiveArithmeticTurn({mode:"practice",text:String(a*b-1),turnRel:"answer_to_pending",incomingModeState:base,incomingPedState:ped,subject:"Matemáticas",concept:"multiplicaciones"});
  assert.equal(result.student_answer_assessment,"incorrect");assert.equal(result.mode_state.incorrect_count,1);assert.equal(result.mode_state.question_number,1);assert.equal(result.check_question,question);assert.match(result.reply,/revisa|intenta/i);
});
