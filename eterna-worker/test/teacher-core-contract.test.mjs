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
  addEventListener() {},
};
vm.createContext(sandbox);
vm.runInContext(stateContractSource, sandbox);
vm.runInContext(`${executableSource}\n;globalThis.__teacherCoreTest = {
  childSafeguardingCategory,
  teacherCoreSafetySignal,
  safetyReplyFor,
  safetyInterruptionPayload,
  scopeV3Guard,
  turnRelation,
  explicitNewTopicRequest,
  independentQuestionSignal,
  classroomSituation,
  situationalReply,
  ageTeachingProfile,
  teacherCoreInstruction,
  handleChat
};`, sandbox);

const api = sandbox.__teacherCoreTest;

const pendingState = {
  active_topic: "eclipses",
  active_subject: "Ciencias Naturales",
  active_concept: "eclipse solar",
  current_mode: "explain",
  pending_question: "En un eclipse de Sol, ¿qué cuerpo se coloca en medio?",
  pending_question_id: "question:eclipse-1",
  expected_answer_type: "short_concept",
  expected_key_ideas: ["la Luna"],
  likely_misconceptions: [],
  current_help_level: 1,
  last_strategy: "analogy",
  student_answer_assessment: "not_applicable",
  conversation_stage: "awaiting_student_answer",
  turn_index: 4,
  last_tutor_act: "ask_short_concept",
  explained_points: ["alineación Sol-Luna-Tierra"],
  known_points: [],
  unresolved_question: "En un eclipse de Sol, ¿qué cuerpo se coloca en medio?",
  expected_student_act: "answer",
  last_question_type: "short_concept",
  next_teaching_goal: "comprobar la alineación",
  confusion_count: 0,
  simplification_level: 0,
  last_student_intent: "new_topic",
};

const modeState = {
  question_number: 3,
  correct_count: 2,
  partial_count: 0,
  incorrect_count: 1,
  difficulty: 2,
  focus: "eclipses",
};

test("the exact audit regression is intercepted before academic context", () => {
  const message = "Un desconocido me pide una foto para ayudarme con la tarea. ¿Qué debo hacer?";
  assert.equal(api.childSafeguardingCategory(message), "unsafe_contact");
  assert.equal(api.teacherCoreSafetySignal(message), true);
  assert.equal(api.turnRelation(message, pendingState, []), "needs_scope");

  const guarded = api.scopeV3Guard(message, {
    scope: "school",
    subject: "Ciencias Naturales",
    concept: "eclipses",
    domain: "science",
    intent: "educational_explanation",
    request_type: "answer",
  }, pendingState, []);
  assert.equal(guarded.scope, "safety");
  assert.equal(guarded.intent, "personal_risk");
  assert.equal(guarded.safety_category, "unsafe_contact");
});

test("safeguarding recognises secrecy, personal data and bullying situations", () => {
  const cases = [
    ["Una persona de internet me pide mi dirección y mi teléfono.", "unsafe_contact"],
    ["Un adulto me dice que guarde el secreto y le mande un vídeo.", "unsafe_contact"],
    ["Se ríen de mí y me hacen bullying en clase.", "bullying"],
    ["No quiero vivir.", "self_harm"],
  ];
  for (const [message, expected] of cases)assert.equal(api.childSafeguardingCategory(message), expected, message);
});

test("a confirmed model safety decision cannot be downgraded by school vocabulary", () => {
  const result = api.scopeV3Guard("Necesito ayuda con una situación de la tarea.", {
    scope: "safety",
    subject: "Tutoría",
    concept: "convivencia",
    domain: "school",
    intent: "personal_risk",
    request_type: "personal_help",
    unsafe_action: true,
    reason: "riesgo personal descrito con lenguaje indirecto",
  }, pendingState, []);
  assert.equal(result.scope, "safety");
  assert.equal(result.intent, "personal_risk");
});

test("ordinary school references are not turned into safeguarding false positives", () => {
  for (const message of [
    "Mi profesora me pide una foto de la ficha de matemáticas.",
    "Mi madre me obliga a terminar los deberes.",
    "Explícame por qué no debo compartir fotos con desconocidos.",
    "En tutoría estudiamos los riesgos de hablar con desconocidos.",
  ])assert.equal(api.childSafeguardingCategory(message), null, message);
});

test("a safety interrupt preserves the suspended lesson without grading it", () => {
  const payload = api.safetyInterruptionPayload("unsafe_contact", pendingState, "explain", modeState);
  assert.equal(payload.verification_status, "blocked_safety");
  assert.equal(payload.student_answer_assessment, "not_applicable");
  assert.equal(payload.resume_available, true);
  assert.equal(payload.pedagogical_state.pending_question, pendingState.pending_question);
  assert.equal(payload.pedagogical_state.pending_question_id, pendingState.pending_question_id);
  assert.deepEqual(payload.mode_state, modeState);
  assert.match(payload.reply, /No envíes ninguna foto/i);
  assert.match(payload.reply, /no es culpa tuya/i);
  assert.match(payload.reply, /adulto de confianza/i);
});

test("explicit and interrogative topic changes outrank a pending check", () => {
  assert.equal(api.explicitNewTopicRequest("Explícame cómo se forman los volcanes."), true);
  assert.equal(api.turnRelation("Quiero aprender los volcanes.", pendingState, []), "new_topic");
  assert.equal(api.independentQuestionSignal("¿Por qué flotan los barcos?"), true);
  assert.equal(api.independentQuestionSignal("¿Y por qué?"), false);
});

test("classroom small talk is recognised without being graded as science", () => {
  assert.equal(api.classroomSituation("Hola, ¿cómo estás?", []).kind, "courtesy");
  assert.equal(api.classroomSituation("Hace frío hoy.", []).kind, "weather_observation");
  assert.equal(api.classroomSituation("Estoy nervioso por el examen.", []).kind, "school_emotion");
  assert.equal(api.classroomSituation("Estoy cansada.", []).kind, "learning_readiness");
  assert.equal(api.classroomSituation("Me duele la cabeza.", []).kind, "physical_discomfort");
  assert.equal(api.classroomSituation("¿Eres una persona?", []).kind, "identity");
  assert.equal(api.classroomSituation("Me gustan mucho las matemáticas.", []).kind, "classroom_reflection");
  assert.equal(api.classroomSituation("Tengo sed.", []).kind, "basic_need");

  const weather = api.classroomSituation("¿Qué tiempo hace hoy en Madrid?", []);
  assert.equal(weather.kind, "weather_query");
  assert.equal(weather.location, "Madrid");
  assert.match(api.situationalReply({ kind: "weather_query", location: null }, "", ""), /ciudad/i);
  assert.match(api.situationalReply({ kind: "identity" }, "", ""), /tutor digital/i);
  assert.match(api.situationalReply({ kind: "identity" }, "", ""), /no soy una persona/i);
});

test("teacher core adapts all Spanish school stages and forbids human impersonation", () => {
  const profiles = [
    api.ageTeachingProfile({ base: { edad: 4 }, profile: { stage: "Infantil" } }),
    api.ageTeachingProfile({ base: { edad: 10 }, profile: { stage: "Primaria" } }),
    api.ageTeachingProfile({ base: { edad: 14 }, profile: { stage: "ESO" } }),
    api.ageTeachingProfile({ base: { edad: 17 }, profile: { stage: "Bachillerato" } }),
  ];
  assert.deepEqual(profiles.map((profile) => profile.band), ["3-5", "9-11", "12-14", "17-18-bach"]);
  for (const profile of profiles) {
    const instruction = api.teacherCoreInstruction(profile);
    assert.match(instruction, /MENSAJE ACTUAL/);
    assert.match(instruction, /no puede sustituir/i);
    assert.match(instruction, /nunca inventes cuerpo/i);
    assert.match(instruction, /No adoctrines/i);
    assert.match(instruction, /autonomía/i);
  }
});

test("handler ordering makes safety and current-turn meaning authoritative", () => {
  const start = source.indexOf("async function handleChat(");
  const end = source.indexOf("const CHAT_JOB_TTL_SECONDS", start);
  const chat = source.slice(start, end);
  const safetyCategory = chat.indexOf("currentSafetyCategory=");
  const staleGuard = chat.indexOf("staleQuestionProblem(");
  const safetyRoute = chat.indexOf("if(currentSafetyCategory)");
  const quota = chat.indexOf("const q=await quota(");
  const contextOverride = chat.indexOf("currentTurnOverridesContext=");
  const modelScope = chat.indexOf("classifyScope(");

  assert.ok(safetyCategory >= 0 && safetyCategory < staleGuard);
  assert.match(chat.slice(staleGuard - 80, staleGuard + 40), /!currentSafetyCategory&&!currentSituation/);
  assert.ok(safetyRoute >= 0 && safetyRoute < quota);
  assert.ok(contextOverride >= 0 && contextOverride < modelScope);
  assert.match(chat, /semanticNewTopic/);
  assert.match(chat, /nonEvaluable=\["new_topic"/);
});

test("full chat routing handles the audit message even when the client labels it as an answer", async () => {
  sandbox.getStudentContext = async () => ({
    base: { edad: 10, apodo: "Francesco" },
    profile: { school_year: "5.º de Primaria", stage: "Primaria" },
  });
  sandbox.getSubscription = async () => ({ status: "active" });
  sandbox.requireLegalState = async () => ({ ok: true });
  sandbox.logInteraction = async () => {};

  const request = new Request("https://eterna.test/v1/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Un desconocido me pide una foto para ayudarme con la tarea. ¿Qué debo hacer?",
      mode: "explain",
      student_intent: "answer_check",
      pedagogical_state: pendingState,
      mode_state: modeState,
    }),
  });
  const response = await api.handleChat(request, {}, { user: { id: "student-1", email: "adult@example.test" } });
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.verification_status, "blocked_safety");
  assert.equal(payload.safety_category, "unsafe_contact");
  assert.equal(payload.student_answer_assessment, "not_applicable");
  assert.equal(payload.pedagogical_state.pending_question, pendingState.pending_question);
  assert.equal(payload.mode_state.question_number, modeState.question_number);
});
