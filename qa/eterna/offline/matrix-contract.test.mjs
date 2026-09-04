import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const fixtures = new URL("../fixtures/", import.meta.url);
const readJson = (name) => JSON.parse(readFileSync(new URL(name, fixtures), "utf8"));
const personas = readJson("personas.v1.json").personas;
const matrix = readJson("conversations-48x9.v1.json").conversations;
const subscriptionGates = readJson("subscription-gates.v1.json");
const countBy = (items, key) => items.reduce((out, item) => {
  const value = item[key];
  out[value] = (out[value] || 0) + 1;
  return out;
}, {});

const REQUIRED_MODES = ["homework", "ask", "review", "explain", "exam", "practice"];
const REQUIRED_PERSONAS = ["child_6", "child_8", "child_10", "student_12", "teen_15", "teen_17", "parent", "master", "typo_writer", "contradictory"];
const REQUIRED_SUBJECTS = ["matematicas", "lengua", "ciencias_naturales", "ciencias_sociales", "historia", "ingles"];
const REQUIRED_VIEWPORTS = ["iphone", "android", "ipad", "desktop"];
const REQUIRED_MODALITIES = ["text", "voice", "photo"];
const REQUIRED_PRIVACY_FORBIDS = ["raw_child_text_persistence", "image_persistence", "internal_codes"];
const REQUIRED_REGRESSION_TAGS = [
  "understood_not_answer",
  "dont_know",
  "short_numeric",
  "equivalent_fractions",
  "three_fourths_to_eighths",
  "fraction_comparison",
  "division_48_by_6",
  "chronology_review",
  "alternative_method",
  "no_invented_work",
  "repeated_question",
  "summary_counters",
  "refresh_context",
  "mode_switch",
  "duplicate_request",
  "late_answer",
];

test("persona catalog contains the ten required synthetic user profiles", () => {
  assert.equal(personas.length, 10);
  assert.equal(new Set(personas.map((persona) => persona.id)).size, personas.length);
  assert.deepEqual([...personas.map((persona) => persona.id)].sort(), [...REQUIRED_PERSONAS].sort());
  for (const persona of personas) {
    assert.ok(["student", "parent", "master"].includes(persona.role));
    assert.ok(Number.isInteger(persona.age) && persona.age >= 6);
    assert.ok(typeof persona.style === "string" && persona.style.length >= 5);
  }
});

test("matrix contains exactly 48 conversations and 432 request-response steps", () => {
  assert.equal(matrix.length, 48);
  assert.equal(new Set(matrix.map((conversation) => conversation.id)).size, 48);
  for (const conversation of matrix) assert.equal(conversation.steps.length, 9, `${conversation.id} must contain exactly nine interactions`);
  assert.equal(matrix.reduce((sum, conversation) => sum + conversation.steps.length, 0), 432);
});

test("the six modes are represented by exactly eight conversations each", () => {
  assert.deepEqual(countBy(matrix, "mode"), {
    homework: 8,
    ask: 8,
    review: 8,
    explain: 8,
    exam: 8,
    practice: 8,
  });
  assert.deepEqual([...new Set(matrix.map((conversation) => conversation.mode))].sort(), [...REQUIRED_MODES].sort());
});

test("matrix covers all required personas, subjects, viewports and modalities", () => {
  assert.deepEqual([...new Set(matrix.map((conversation) => conversation.persona_id))].sort(), [...REQUIRED_PERSONAS].sort());
  assert.deepEqual([...new Set(matrix.map((conversation) => conversation.subject))].sort(), [...REQUIRED_SUBJECTS].sort());
  assert.deepEqual([...new Set(matrix.map((conversation) => conversation.viewport))].sort(), [...REQUIRED_VIEWPORTS].sort());
  assert.deepEqual([...new Set(matrix.map((conversation) => conversation.input_type))].sort(), [...REQUIRED_MODALITIES].sort());
  assert.deepEqual(countBy(matrix, "input_type"), { photo: 6, text: 36, voice: 6 });
  assert.deepEqual(countBy(matrix, "viewport"), { iphone: 12, android: 12, ipad: 8, desktop: 16 });
});

test("active, tester and live-trial access are balanced across all six modes", () => {
  assert.deepEqual(countBy(matrix, "subscription"), { active: 24, tester: 12, trialing: 12 });
  for (const mode of REQUIRED_MODES) {
    const modeRows = matrix.filter((conversation) => conversation.mode === mode);
    assert.deepEqual(countBy(modeRows, "subscription"), { active: 4, tester: 2, trialing: 2 }, mode);
  }
});

test("all 432 audit request ids are explicit, unique and attached to real inputs", () => {
  const requestIds = [];
  for (const conversation of matrix) {
    for (let index = 0; index < conversation.steps.length; index += 1) {
      const step = conversation.steps[index];
      assert.equal(step.request_id, `${conversation.id}-${String(index + 1).padStart(2, "0")}`);
      assert.ok(typeof step.input === "string" && step.input.trim().length > 0, step.request_id);
      requestIds.push(step.request_id);
    }
  }
  assert.equal(requestIds.length, 432);
  assert.equal(new Set(requestIds).size, 432);
});

test("replay and late-answer scenarios retain an auditable reference without duplicating audit ids", () => {
  const replays = matrix.flatMap((conversation) => conversation.steps.map((step) => ({ conversation, step }))).filter(({ step }) => step.action === "replay");
  const lateAnswers = matrix.flatMap((conversation) => conversation.steps.map((step) => ({ conversation, step }))).filter(({ step }) => step.action === "late_answer");
  assert.equal(replays.length, 2);
  assert.equal(lateAnswers.length, 2);
  for (const { conversation, step } of replays) {
    assert.ok(conversation.steps.some((candidate) => candidate.request_id === step.replay_of));
    assert.notEqual(step.request_id, step.replay_of);
  }
  for (const { conversation, step } of lateAnswers) {
    assert.ok(typeof step.answer_to === "string" && step.answer_to.length > 0, conversation.id);
    assert.ok(conversation.steps.some((candidate) => candidate.capture_question_id_as === step.answer_to), conversation.id);
  }
});

test("photo and voice fixtures are declared at the first multimodal turn", () => {
  const photoRows = matrix.filter((conversation) => conversation.input_type === "photo");
  const voiceRows = matrix.filter((conversation) => conversation.input_type === "voice");
  assert.equal(photoRows.length, 6);
  assert.equal(voiceRows.length, 6);
  for (const conversation of photoRows) assert.match(conversation.steps[0].asset || "", /\.png$/);
  for (const conversation of voiceRows) assert.match(conversation.steps[0].audio_fixture || "", /\.wav$/);
});

test("every conversation forbids child raw text, image persistence and internal codes", () => {
  for (const conversation of matrix) {
    assert.deepEqual([...conversation.privacy_forbid].sort(), [...REQUIRED_PRIVACY_FORBIDS].sort(), conversation.id);
  }
});

test("all known high-risk regressions are represented by stable tags", () => {
  const presentTags = new Set(matrix.flatMap((conversation) => conversation.tags));
  for (const tag of REQUIRED_REGRESSION_TAGS) assert.ok(presentTags.has(tag), `missing regression tag: ${tag}`);
});

test("refreshes, mode switches and explicit feedback buttons occur in executable steps", () => {
  const steps = matrix.flatMap((conversation) => conversation.steps);
  assert.ok(steps.some((step) => step.before?.includes("reload")));
  assert.ok(steps.some((step) => step.before?.some((action) => action.startsWith("switch_mode:"))));
  assert.ok(steps.some((step) => step.action === "feedback_understood"));
  assert.ok(steps.some((step) => step.action === "need_hint"));
});

test("subscription fixture is the complete 4 × 2 × 4 access cartesian product", () => {
  const paths = subscriptionGates.paths;
  assert.equal(paths.length, 32);
  assert.equal(new Set(paths.map((path) => path.id)).size, 32);
  const states = ["active", "trialing", "expired", "inactive"];
  const entries = ["chat", "family"];
  for (const state of states) {
    for (const entry of entries) {
      for (const viewport of REQUIRED_VIEWPORTS) {
        const rows = paths.filter((path) => path.state === state && path.entry === entry && path.viewport === viewport);
        assert.equal(rows.length, 1, `${state}/${entry}/${viewport}`);
        assert.equal(rows[0].expect, subscriptionGates.states[state].expected_surface);
      }
    }
  }
});

test("expired access contract requires the conversion headline, both prices and no-charge/free-product assurances", () => {
  const expired = subscriptionGates.states.expired;
  assert.equal(expired.expected_surface, "expired_conversion");
  assert.deepEqual(expired.required_copy, [
    "TUS 7 DÍAS DE PRUEBA DE ETERNA HAN TERMINADO",
    "No se ha realizado ningún cobro automático",
    "7,99 €/mes",
    "79,99 €/año",
    "Coco en Forma sigue siendo gratis y sin publicidad",
  ]);
  assert.equal(subscriptionGates.paths.filter((path) => path.state === "expired" && path.expect === "expired_conversion").length, 8);
});

test("the offline contract is a scaffold and makes no live-replay claim", () => {
  assert.equal(readJson("conversations-48x9.v1.json").interaction_definition, "one fixture step equals one outbound request and its observed response");
});
