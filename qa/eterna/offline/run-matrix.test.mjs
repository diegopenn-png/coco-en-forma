import test from "node:test";
import assert from "node:assert/strict";
import {
  createLiveAdapter,
  loadMatrixFixtures,
  parseArgs,
  runMatrix,
} from "../run-matrix.mjs";

test("CLI requires an explicit and exclusive execution scope", () => {
  assert.throws(() => parseArgs([]), /exactly one/);
  assert.throws(() => parseArgs(["--offline", "--live"]), /exactly one/);
  assert.equal(parseArgs(["--offline", "--no-write"]).scope, "offline");
  assert.equal(parseArgs(["--live", "--no-write"]).scope, "live");
});

test("offline runner executes all 48 × 9 contract steps without model claims", async () => {
  const report = await runMatrix({ scope: "offline" });
  assert.equal(report.evidence_scope, "offline_contract");
  assert.equal(report.model_behavior_evaluated, false);
  assert.equal(report.totals.conversations, 48);
  assert.equal(report.totals.steps, 432);
  assert.match(report.disclaimer, /does not replay or score model answers/i);
  assert.equal(report.conversations.length, 48);
  assert.equal(report.conversations.every((conversation) => conversation.steps === 9), true);
});

test("offline mode reports eight conversations and 72 steps per pedagogical mode", async () => {
  const report = await runMatrix({ scope: "offline" });
  for (const mode of ["homework", "ask", "review", "explain", "exam", "practice"]) {
    assert.equal(report.per_mode[mode].conversations, 8, mode);
    assert.equal(report.per_mode[mode].steps, 72, mode);
  }
});

test("offline invariants cover counters, replay idempotency, stale answers, refresh, mode isolation and privacy", async () => {
  const report = await runMatrix({ scope: "offline" });
  assert.deepEqual(report.checks.counter_integrity, { checked: 432, passed: 432 });
  assert.deepEqual(report.checks.idempotency, { checked: 2, passed: 2 });
  assert.deepEqual(report.checks.stale_answers, { checked: 2, passed: 2 });
  assert.deepEqual(report.checks.refresh, { checked: 7, passed: 7 });
  assert.deepEqual(report.checks.mode_switch_isolation, { checked: 10, passed: 10 });
  assert.deepEqual(report.checks.privacy, { checked: 432, passed: 432 });
  assert.deepEqual(report.privacy, {
    raw_inputs_written: false,
    assistant_response_text_written: false,
    image_or_audio_payloads_written: false,
    secrets_written: false,
  });
  assert.doesNotMatch(JSON.stringify(report), /Tengo que resolver 3\/4 \+ 1\/8/);
});

test("live adapter refuses to run without both authorized environment values", () => {
  const conversation = loadMatrixFixtures().conversations[0];
  assert.throws(() => createLiveAdapter(conversation, {}, fetch), /ETERNA_TEST_ENDPOINT and ETERNA_TEST_TOKEN/);
  assert.throws(() => createLiveAdapter(conversation, { ETERNA_TEST_ENDPOINT: "https://preview.example.test/v1/chat" }, fetch), /ETERNA_TEST_ENDPOINT and ETERNA_TEST_TOKEN/);
});

test("live adapter sends the token only in the authorization header and retains no response text", async () => {
  const conversation = loadMatrixFixtures().conversations.find((item) => item.input_type === "text");
  const fakeToken = "authorized-test-token";
  let observed;
  const fakeFetch = async (endpoint, options) => {
    observed = { endpoint, options };
    return new Response(JSON.stringify({
      reply: "This model response must not be retained in the report.",
      verification_status: "verified",
      student_answer_assessment: "not_applicable",
      pedagogical_state: { pending_question_id: "q-live-1" },
      mode_state: { correct_count: 0 },
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const adapter = createLiveAdapter(conversation, {
    ETERNA_TEST_ENDPOINT: "https://preview.example.test/v1/chat",
    ETERNA_TEST_TOKEN: fakeToken,
  }, fakeFetch);
  const result = await adapter.execute(conversation.steps[0], 0);
  assert.equal(observed.options.headers.Authorization, `Bearer ${fakeToken}`);
  assert.doesNotMatch(observed.options.body, new RegExp(fakeToken));
  assert.equal(result.response_text_retained, false);
  assert.doesNotMatch(JSON.stringify(result), /This model response/);
  assert.doesNotMatch(JSON.stringify(result), new RegExp(fakeToken));
});
