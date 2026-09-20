import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("../src/index.js");
const executable = source.replace(/^import\s+[^;]+;\s*/gm, "").replace(/\nexport default\s*\{[\s\S]*?\};\s*$/, "");
const sandbox = {
  console,
  URL,
  URLSearchParams,
  Request,
  Response,
  Headers,
  TextEncoder,
  TextDecoder,
  FormData,
  Blob,
  File,
  crypto: webcrypto,
  fetch,
  setTimeout,
  clearTimeout,
  Intl,
};
vm.createContext(sandbox);
vm.runInContext(read("../../eterna-state-contract-v3.js"), sandbox);
vm.runInContext(`${executable}\n;globalThis.__systemwideDirector={
  learningActivityContext,
  sanitizePedagogicalState,
  buildPedagogicalState,
  comprehensionCheckAllowed,
  singleStudentAct,
  synchronousVerificationRequired,
  synchronousVerifierRecoveryAllowed,
  turnRelation,
  latestImplicitAcademicQuestion,
  enforceLearningActivityReply,
  healthFeatures
};`, sandbox);
const api = sandbox.__systemwideDirector;

const profile = { stage: "Primaria", school_year: "5.º de Primaria" };
const modeState = { question_number: 0, correct_count: 0, partial_count: 0, incorrect_count: 0, difficulty: 2, focus: null };
const tutorData = {
  reply: "Reliable significa fiable. Por ejemplo: a reliable friend. ¿Quieres más ejemplos o practicar esta palabra?",
  subject: "Inglés",
  concept: "reliable",
  help_level: 0,
  check_question: "¿Qué significa reliable?",
  practice_suggestion: null,
  student_answer_assessment: "not_applicable",
  used_curriculum: false,
  needs_clarification: false,
  strategy_used: "direct_explanation",
  mode_state: modeState,
  expected_answer_type: "short_concept",
  expected_key_ideas: ["fiable"],
  likely_misconceptions: [],
  conversation_stage: "explaining",
  tutor_act: "explain",
  new_explained_points: ["reliable significa fiable"],
};

test("a vocabulary request becomes a compact English glossary activity, not a Spanish Language lesson", () => {
  const activity = api.learningActivityContext({
    text: "¿Qué significa pendants?",
    profile,
    mode: "ask",
    pedState: {},
    scope: { scope: "school", subject: "Lengua Castellana y Literatura", concept: "pendants", request_type: "definition" },
  });
  assert.equal(activity.type, "glossary");
  assert.equal(activity.language, "en");
  assert.equal(activity.primary_subject, "Inglés");
  assert.equal(activity.response_depth, "micro");
  assert.equal(activity.check_policy, "never");
  assert.equal(activity.library_bypass, true);
});

test("successive short terms remain one glossary activity without a hard-coded word list", () => {
  const previous = api.sanitizePedagogicalState({
    current_mode: "ask",
    active_subject: "Inglés",
    active_concept: "reliable",
    learning_activity_type: "glossary",
    learning_language: "en",
    activity_turn_count: 3,
    check_policy: "never",
    response_depth: "micro",
  }, "ask");
  for (const word of ["improve", "expel", "respones", "unpredictable"]) {
    const activity = api.learningActivityContext({ text: word, profile, mode: "ask", pedState: previous, scope: { scope: "school" } });
    assert.equal(activity.type, "glossary", word);
    assert.equal(activity.language, "en", word);
    assert.equal(activity.sequence_continuation, true, word);
    assert.equal(activity.check_policy, "never", word);
  }
});

test("an English science question is routed by content while preserving English as the secondary subject", () => {
  const activity = api.learningActivityContext({
    text: "How does our body carry out responses?",
    profile,
    mode: "ask",
    pedState: { learning_activity_type: "glossary", learning_language: "en", active_subject: "Inglés" },
    scope: { scope: "school", subject: "Lengua Castellana y Literatura", concept: "body responses", request_type: "explanation" },
  });
  assert.equal(activity.type, "concept_explanation");
  assert.equal(activity.primary_subject, "Ciencias Naturales");
  assert.equal(activity.secondary_subject, "Inglés");
  assert.equal(activity.language, "en");
});

test("glossary policy suppresses routine checks and repeated continuation offers", () => {
  const activity = { type: "glossary", language: "en", check_policy: "never", response_depth: "micro" };
  assert.equal(api.comprehensionCheckAllowed({ mode: "ask", tutorData, turnRel: "new_topic", incoming: {}, assessment: "not_applicable", reply: tutorData.reply, activity }), false);
  const turn = api.singleStudentAct({ mode: "ask", reply: tutorData.reply, tutorData, turnRel: "new_topic", incoming: {}, assessment: "not_applicable", studentText: "reliable", activity });
  assert.equal(turn.pending_question, null);
  assert.equal(turn.display_check, null);
  assert.doesNotMatch(turn.reply, /quieres más ejemplos|practicar/i);
  assert.match(turn.reply, /significa fiable/i);
});

test("a short answer is recovered from the last academic question even when metadata is missing", () => {
  const history = [{ role: "assistant", text: "Lee el párrafo con calma. ¿Cuál es la idea principal del texto?" }];
  const state = api.sanitizePedagogicalState({ current_mode: "ask", active_subject: "Lengua Castellana y Literatura", active_concept: "comprensión lectora" }, "ask");
  assert.match(api.latestImplicitAcademicQuestion(history), /idea principal/i);
  assert.equal(api.turnRelation("La idea principal", state, history), "answer_to_pending");
  const greeting = [{ role: "assistant", text: "Soy Eterna. ¿Qué te gustaría entender o resolver hoy?" }];
  assert.equal(api.latestImplicitAcademicQuestion(greeting), null);
});

test("the activity context persists and increments independently of the concrete term", () => {
  const incoming = api.sanitizePedagogicalState({ current_mode: "ask", learning_activity_type: "glossary", learning_language: "en", activity_turn_count: 2, active_subject: "Inglés", active_concept: "improve" }, "ask");
  const activity = { type: "glossary", language: "en", primary_subject: "Inglés", secondary_subject: null, response_depth: "micro", check_policy: "never" };
  const next = api.buildPedagogicalState({ incoming, mode: "ask", subject: "Inglés", concept: "reliable", tutorOutput: tutorData, assessment: "not_applicable", finalCheck: null, turnRel: "new_topic", activity });
  assert.equal(next.learning_activity_type, "glossary");
  assert.equal(next.learning_language, "en");
  assert.equal(next.activity_turn_count, 3);
  assert.equal(next.response_depth, "micro");
  assert.equal(next.check_policy, "never");
});

test("a transient verifier outage can only recover on low-risk grounded teaching turns", () => {
  const safe = { image: null, mode: "ask", stableSchool: true, scope: { sensitive_topic: false, unsafe_action: false, needs_clarification: false }, activity: { type: "glossary" } };
  assert.equal(api.synchronousVerificationRequired({ ...safe, turnRel: "new_topic", externalEvidence: null, mathCheck: null, answerAnchor: null, tutorData, text: "reliable" }), true);
  assert.equal(api.synchronousVerifierRecoveryAllowed(safe), true);
  assert.equal(api.synchronousVerifierRecoveryAllowed({ ...safe, image: "photo" }), false);
  assert.equal(api.synchronousVerifierRecoveryAllowed({ ...safe, mode: "exam" }), false);
  assert.equal(api.synchronousVerifierRecoveryAllowed({ ...safe, scope: { sensitive_topic: true } }), false);
  assert.equal(api.synchronousVerifierRecoveryAllowed({ ...safe, stableSchool: false }), false);
});

test("health and tutor contracts expose the system-wide behaviour", () => {
  const features = api.healthFeatures({});
  for (const key of ["learning_activity_context_v1", "glossary_sequence_v1", "bilingual_subject_routing_v1", "proportional_response_depth_v1", "implicit_pending_question_recovery_v1", "routine_closing_suppression_v1", "gentle_typo_correction_v1", "verified_glossary_meanings_v1", "low_risk_verifier_recovery_v1"]) assert.equal(features[key], true, key);
  assert.match(source, /ACTIVIDAD TRANSVERSAL/);
  assert.match(source, /corrígela una sola vez con tacto/);
  assert.match(source, /160\.99\.26-systemwide-pedagogical-director-candidate/);
});
