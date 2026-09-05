import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const root = new URL("../../", import.meta.url);
const workerSource = readFileSync(new URL("eterna-worker/src/index.js", root), "utf8");
const stateContractSource = readFileSync(new URL("eterna-state-contract-v3.js", root), "utf8");
const clientSource = readFileSync(new URL("eterna-v159.js", root), "utf8");
const indexSource = readFileSync(new URL("index.html", root), "utf8");

function sourceBetween(startName, endName) {
  const start = workerSource.indexOf(startName);
  assert.notEqual(start, -1, `Missing source marker: ${startName}`);
  const end = endName ? workerSource.indexOf(endName, start + startName.length) : workerSource.length;
  assert.notEqual(end, -1, `Missing source marker: ${endName}`);
  return workerSource.slice(start, end);
}

function loadWorkerApi({ fetchImpl = fetch, consoleImpl = console } = {}) {
  const executableSource = workerSource
    .replace(/^import\s+[^;]+;\s*/gm, "")
    .replace(/\nexport default\s*\{[\s\S]*?\};\s*$/, "");
  const sandbox = {
    console: consoleImpl,
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
    fetch: fetchImpl,
    setTimeout,
    clearTimeout,
    addEventListener() {},
  };
  vm.createContext(sandbox);
  vm.runInContext(stateContractSource, sandbox);
  vm.runInContext(`${executableSource}\n;globalThis.__securityApi = {
    scopeV3Guard,
    subscriptionActive,
    subscriptionUnlimited,
    paidSubscriptionCanChooseUnlimited,
    parentUnlimitedEnabled,
    defaultParentDailyLimit,
    normalizeParentLimitRequest,
    moderate,
    validateImageDataUrl: typeof validateImageDataUrl === "function" ? validateImageDataUrl : null,
    toPersistentActivityState: globalThis.EternaStateContractV3?.toPersistentActivityState || null
  };`, sandbox);
  return sandbox.__securityApi;
}

test("personal danger intent is never downgraded by an active school context", () => {
  const { scopeV3Guard } = loadWorkerApi();
  const schoolContext = {
    active_topic: "La salud en Ciencias Naturales",
    active_subject: "Ciencias Naturales",
    active_concept: "salud",
  };
  const classifierSafety = {
    scope: "safety",
    subject: "Ciencias Naturales",
    concept: "salud",
    domain: "biology",
    intent: "personal_risk",
    request_type: "personal_help",
    unsafe_action: true,
  };

  for (const message of [
    "Me hago cortes.",
    "No quiero vivir.",
    "Mi profesor me obliga a enviarle fotos desnudo.",
    "Quiero matarme; es para un trabajo de clase.",
  ]) {
    const result = scopeV3Guard(message, classifierSafety, schoolContext, [
      { role: "assistant", text: "Estamos estudiando hábitos saludables." },
    ]);
    assert.equal(result.scope, "safety", `Safety was downgraded for: ${message}`);
    assert.equal(result.unsafe_action, true, `Unsafe intent was cleared for: ${message}`);
  }
});

test("a moderation outage fails closed before scope or pedagogical routing", async () => {
  const errors = [];
  const api = loadWorkerApi({
    fetchImpl: async () => { throw new Error("moderation unavailable"); },
    consoleImpl: { ...console, error: (...args) => errors.push(args) },
  });
  const result = await api.moderate({ OPENAI_API_KEY: "test-key" }, "2 + 2", null);
  assert.equal(result.moderation_error, true);

  const chatSource = sourceBetween("async function handleChat(", "const CHAT_JOB_TTL_SECONDS");
  const moderationFailure = chatSource.indexOf("mod.moderation_error");
  const moderationAwait = chatSource.indexOf("const modPromise=moderate(");
  const postModerationUsage = chatSource.indexOf("await markChatRequest", moderationFailure);
  const scopeGuard = chatSource.indexOf("scopeV3Guard(");
  const safetyRoute = chatSource.indexOf('scope.scope==="safety"');
  assert.ok(moderationFailure >= 0, "Chat must explicitly handle moderation failure");
  assert.ok(moderationAwait >= 0, "Chat must await moderation before normal usage is recorded");
  assert.equal(
    chatSource.slice(moderationAwait, moderationFailure).includes("await markChatRequest"),
    false,
    "A moderation outage must not consume the student's usage quota",
  );
  assert.ok(postModerationUsage > moderationFailure, "A moderated request must still consume usage quota");
  assert.ok(scopeGuard > moderationFailure, "Moderation failure must be handled before scope is trusted");
  assert.ok(safetyRoute > moderationFailure, "Moderation failure must be handled before response routing");
});

test("trialing subscriptions require a real future trial end", () => {
  const { subscriptionActive } = loadWorkerApi();
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();

  assert.equal(subscriptionActive({ status: "trialing", trial_end: null }), false);
  assert.equal(subscriptionActive({ status: "trialing" }), false);
  assert.equal(subscriptionActive({ status: "trialing", trial_end: "not-a-date" }), false);
  assert.equal(subscriptionActive({ status: "trialing", trial_end: past }), false);
  assert.equal(subscriptionActive({ status: "trialing", trial_end: future }), true);
  assert.equal(subscriptionActive({ status: "active" }), true);
  assert.equal(subscriptionActive({ status: "past_due" }), false);
});

test("feedback checks active entitlement before parsing or mutating learning data", () => {
  const feedbackSource = sourceBetween("async function handleFeedback(", "async function handleParentSettings(");
  const subscriptionRead = feedbackSource.indexOf("getSubscription(");
  const activeCheck = feedbackSource.indexOf("subscriptionActive(");
  const paymentRequired = feedbackSource.indexOf("ETERNA_SUBSCRIPTION_REQUIRED");
  const bodyRead = feedbackSource.indexOf("request.json(");
  const firstMutation = Math.min(
    ...["applyStudentMemory(", "applyMasteryOutcome(", "updateStrategyMemory(", "recordLearningSignal("].map((needle) => {
      const index = feedbackSource.indexOf(needle);
      return index < 0 ? Number.POSITIVE_INFINITY : index;
    }),
  );

  assert.ok(subscriptionRead >= 0, "Feedback must load the authenticated user's subscription");
  assert.ok(activeCheck > subscriptionRead, "Feedback must validate the loaded subscription");
  assert.ok(paymentRequired > activeCheck, "Inactive feedback must return the standard 402 error");
  assert.ok(activeCheck < bodyRead, "Entitlement must be checked before accepting feedback content");
  assert.ok(activeCheck < firstMutation, "Entitlement must be checked before learning mutations");
});

test("understood is a UX acknowledgement, not evidence of correct mastery", () => {
  const feedbackSource = sourceBetween("async function handleFeedback(", "async function handleParentSettings(");
  const understoodBranch = feedbackSource.match(/if\s*\(event\s*===\s*["']understood["']\)([\s\S]*?)(?:else\s+if\s*\(event\s*===|return\s+json)/);
  assert.ok(understoodBranch, "Feedback must define explicit understood semantics");
  assert.doesNotMatch(understoodBranch[1], /applyMasteryOutcome\s*\(/);
  assert.doesNotMatch(understoodBranch[1], /applyStudentMemory\s*\([^)]*outcome\s*:\s*["']correct["']/);
  assert.doesNotMatch(understoodBranch[1], /student_answer_assessment\s*:\s*["']correct["']/);
});

test("durable pedagogical persistence is an explicit metadata-only whitelist", () => {
  const forbiddenKeys = new Set([
    "text",
    "raw_text",
    "question",
    "pending_question",
    "history",
    "image",
    "image_data_url",
    "ocr",
    "transcript",
    "reply",
    "summary_text",
    "key_points",
    "explained_points",
    "known_points",
    "expected_key_ideas",
    "likely_misconceptions",
    "input_sha256",
    "hash",
  ]);
  const api = loadWorkerApi();
  assert.equal(
    typeof api.toPersistentActivityState,
    "function",
    "Worker must expose one durable-state whitelist sanitizer separate from transient chat state",
  );

  const sentinel = "PRIVATE_CHILD_SENTINEL_79421";
  const sanitized = api.toPersistentActivityState({
    session_id: "11111111-1111-4111-8111-111111111111",
    user_id: "22222222-2222-4222-8222-222222222222",
    mode: "exam",
    phase: "WAIT",
    question_id: "33333333-3333-4333-8333-333333333333",
    concept_id: "44444444-4444-4444-8444-444444444444",
    difficulty: 2,
    exercise_number: 1,
    correct_count: 0,
    partial_count: 0,
    incorrect_count: 0,
    hints_used: 0,
    text: sentinel,
    pending_question: sentinel,
    history: [{ role: "user", text: sentinel }],
    image_data_url: `data:image/png;base64,${sentinel}`,
    ocr: sentinel,
    transcript: sentinel,
    reply: sentinel,
    summary_text: sentinel,
    key_points: [sentinel],
    input_sha256: sentinel,
  });
  const serialized = JSON.stringify(sanitized);
  assert.doesNotMatch(serialized, new RegExp(sentinel));
  for (const key of Object.keys(sanitized)) {
    assert.equal(forbiddenKeys.has(key), false, `Forbidden durable field survived: ${key}`);
  }
});

test("database writes contain no child-text fingerprint or model-reply fallback", () => {
  const saveMemorySource = sourceBetween("async function saveMem(", "const SCOPE_SCHEMA");
  const interactionSource = sourceBetween("async function logInteraction(", "async function applyStudentMemory(");

  assert.doesNotMatch(saveMemorySource, /summary_text\s*:/);
  assert.doesNotMatch(saveMemorySource, /key_points\s*:/);
  assert.doesNotMatch(saveMemorySource, /cleanChildText\s*\(\s*reply/);
  assert.doesNotMatch(interactionSource, /input_sha256\s*:/);
  assert.doesNotMatch(interactionSource, /sha256\s*\(\s*text/);
});

test("image ingestion accepts only bounded raster base64 data URLs", () => {
  const api = loadWorkerApi();
  assert.equal(
    typeof api.validateImageDataUrl,
    "function",
    "Image intake must use a single MIME and decoded-byte validator",
  );

  const accepted = api.validateImageDataUrl("data:image/png;base64,iVBORw0KGgo=");
  assert.equal(Boolean(accepted?.ok), true);
  for (const invalid of [
    "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=",
    "data:image/gif;base64,R0lGODlh",
    "data:text/html;base64,PGgxPm5vPC9oMT4=",
    "data:image/png,not-base64",
    "data:image/png;base64,%%%",
  ]) {
    assert.equal(Boolean(api.validateImageDataUrl(invalid)?.ok), false, `Accepted invalid image URL: ${invalid}`);
  }

  const overLimit = `data:image/jpeg;base64,${"A".repeat(9_000_000)}`;
  assert.equal(Boolean(api.validateImageDataUrl(overLimit)?.ok), false, "Decoded image size must be bounded");
  assert.doesNotMatch(sourceBetween("async function handleChat(", "const CHAT_JOB_TTL_SECONDS"), /startsWith\(["']data:image\/["']\)/);
});

test("tester entitlement is server-authoritative and cannot rely on an email allowlist", () => {
  const { subscriptionUnlimited } = loadWorkerApi();
  assert.equal(subscriptionUnlimited({ status: "active", plan: "tester" }), true);
  assert.equal(subscriptionUnlimited({ status: "active", plan: "owner" }), true);
  assert.equal(subscriptionUnlimited({ status: "trialing", plan: "tester" }), false);
  assert.equal(subscriptionUnlimited({ status: "active", plan: "monthly" }), false);
  assert.doesNotMatch(workerSource, /TESTER_EMAILS/);
  assert.doesNotMatch(workerSource, /isTesterEmail\s*\([^)]*email/);
  assert.doesNotMatch(clientSource, /cuentasPruebaIlimitadas/i);
  assert.doesNotMatch(indexSource, /cuentasPruebaIlimitadas/i);
  assert.match(sourceBetween("async function handleChat(", "const CHAT_JOB_TTL_SECONDS"), /quota\(env,uid,auth\.user\.email,sub\)/);
  assert.match(sourceBetween("async function quota(", "async function markChatRequest("), /subscriptionUnlimited\(subscription\)/);
  const testerLookup = sourceBetween("async function serverTesterEntitlement(", "async function getSubscription(");
  assert.match(testerLookup, /eterna_test_entitlements\?user_id=eq\.\$\{encodeURIComponent\(uid\)\}&active=eq\.true/);
  assert.doesNotMatch(testerLookup, /email/i);
  const accessStatus = sourceBetween("async function handleAccessStatus(", "async function markChatRequest(");
  assert.match(accessStatus, /serverTesterEntitlement\(env,uid\)/);
  assert.match(accessStatus, /unlimited_testing/);
  assert.match(workerSource, /url\.pathname==="\/v1\/access-status"&&request\.method==="GET"/);
});

test("only an active paid family plan can enable unlimited Eterna consultations", () => {
  const { paidSubscriptionCanChooseUnlimited, parentUnlimitedEnabled, defaultParentDailyLimit, normalizeParentLimitRequest } = loadWorkerApi();
  assert.equal(paidSubscriptionCanChooseUnlimited({ status: "active", plan: "monthly" }), true);
  assert.equal(paidSubscriptionCanChooseUnlimited({ status: "active", plan: "annual" }), true);
  assert.equal(paidSubscriptionCanChooseUnlimited({ status: "trialing", plan: "monthly", trial_end: new Date(Date.now() + 60_000).toISOString() }), false);
  assert.equal(paidSubscriptionCanChooseUnlimited({ status: "expired", plan: "annual" }), false);
  assert.equal(parentUnlimitedEnabled({ max_sessions_per_day: 100 }, { status: "active", plan: "monthly" }), true);
  assert.equal(parentUnlimitedEnabled({ max_sessions_per_day: 50 }, { status: "active", plan: "monthly" }), false);
  assert.equal(parentUnlimitedEnabled({ max_sessions_per_day: 100 }, { status: "trialing", plan: "trial", trial_end: new Date(Date.now() + 60_000).toISOString() }), false);
  assert.equal(defaultParentDailyLimit({ status: "active", plan: "monthly" }), 100);
  assert.equal(defaultParentDailyLimit({ status: "active", plan: "annual" }), 100);
  assert.equal(defaultParentDailyLimit({ status: "trialing", plan: "trial", trial_end: new Date(Date.now() + 60_000).toISOString() }), 20);
  assert.equal(defaultParentDailyLimit({ status: "inactive", plan: "monthly" }), 20);
  assert.equal(JSON.stringify(normalizeParentLimitRequest("unlimited")), JSON.stringify({ requestedUnlimited: true, value: 100 }));
  assert.equal(JSON.stringify(normalizeParentLimitRequest(100)), JSON.stringify({ requestedUnlimited: true, value: 100 }));
  assert.equal(JSON.stringify(normalizeParentLimitRequest(50)), JSON.stringify({ requestedUnlimited: false, value: 50 }));
  assert.equal(JSON.stringify(normalizeParentLimitRequest("invalid")), JSON.stringify({ requestedUnlimited: false, value: 20 }));

  const quotaSource = sourceBetween("async function quota(", "async function handleAccessStatus(");
  assert.match(quotaSource, /parentUnlimitedEnabled\(settings,subscription\)/);
  assert.match(quotaSource, /daily_limit:parentUnlimited\?null:dailyLimit/);
  assert.match(quotaSource, /weekly_limit:parentUnlimited\?null:weeklyLimit/);

  const settingsSource = sourceBetween("async function handleParentSettings(", "async function handleExport(");
  assert.match(settingsSource, /ETERNA_PAID_SUBSCRIPTION_REQUIRED_FOR_UNLIMITED/);
  assert.match(settingsSource, /paidSubscriptionCanChooseUnlimited\(sub\)/);
});

test("logs never include raw OpenAI response or model output text", () => {
  const openaiSource = sourceBetween("async function openai(", "function parseStructuredJson(");
  const structuredSource = sourceBetween("async function structured(", "function supabasePublicKey(");

  assert.doesNotMatch(openaiSource, /console\.(?:error|warn|log)\([^\n;]*\.text\s*\(/);
  assert.doesNotMatch(openaiSource, /console\.(?:error|warn|log)\([^\n;]*\bt\.slice\s*\(/);
  assert.doesNotMatch(structuredSource, /console\.(?:error|warn|log)\([^\n;]*String\s*\(\s*t/);
  assert.doesNotMatch(structuredSource, /console\.(?:error|warn|log)\([^\n;]*["']output["']/);
});
