import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { readFileSync } from "node:fs";
import { webcrypto } from "node:crypto";

const source = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const stateContractSource = readFileSync(new URL("../../eterna-state-contract-v3.js", import.meta.url), "utf8");

function sourceBetween(startName, endName) {
  const start = source.indexOf(startName);
  assert.notEqual(start, -1, `Missing source marker: ${startName}`);
  const end = source.indexOf(endName, start + startName.length);
  assert.notEqual(end, -1, `Missing source marker: ${endName}`);
  return source.slice(start, end);
}

function loadApi(fetchImpl = fetch) {
  const executableSource = source
    .replace(/^import\s+[^;]+;\s*/gm, "")
    .replace(/\nexport default\s*\{[\s\S]*?\};\s*$/, "");
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
    fetch: fetchImpl,
    setTimeout,
    clearTimeout,
    atob,
  };
  vm.createContext(sandbox);
  vm.runInContext(stateContractSource, sandbox);
  vm.runInContext(`${executableSource}\n;globalThis.__latencyApi = {
    getChatPreflight,
    clearAcademicFastPath,
    createChatTimings,
    modelConfiguration,
    structured,
    moderate,
    dependencyProbe,
    normalizeTokenUsage,
    openaiServiceTier,
    stableFactTutorRecovery,
    simpleArithmeticInText,
    pendingNumericEquation,
    deterministicArithmeticGuidanceTurn,
    deterministicPendingNumericTurn,
    synchronousVerificationRequired
  };`, sandbox);
  return sandbox.__latencyApi;
}

test("chat preflight fans out access, profile, legal and quota reads together", async () => {
  let active = 0;
  let maxActive = 0;
  const paths = [];
  const fakeFetch = async (input) => {
    const url = String(input);
    paths.push(url);
    active += 1;
    maxActive = Math.max(maxActive, active);
    await new Promise((resolve) => setTimeout(resolve, 12));
    active -= 1;
    let rows = [];
    if (url.includes("eterna_student_profiles")) rows = [{ school_year: "5º de Primaria", stage: "Primaria" }];
    else if (url.includes("/perfiles?")) rows = [{ apodo: "Coco", edad: 10, rol: "propietario" }];
    else if (url.includes("eterna_subscriptions")) rows = [{ status: "active", plan: "monthly" }];
    else if (url.includes("eterna_legal_acceptances")) rows = [{ terms_accepted: true, privacy_accepted: true, ai_notice_accepted: true, parental_authorization: true, relationship: "parent", accepted_at: new Date().toISOString() }];
    else if (url.includes("eterna_parent_settings")) rows = [{ max_sessions_per_day: 20, allow_image_input: true }];
    else if (url.includes("eterna_usage")) rows = [];
    return new Response(JSON.stringify(rows), { status: 200, headers: { "Content-Type": "application/json" } });
  };
  const api = loadApi(fakeFetch);
  const result = await api.getChatPreflight(
    { SUPABASE_URL: "https://supabase.test", SUPABASE_SECRET_KEY: "sb_secret_test" },
    { user: { id: "student-1", email: "adult@example.test", email_confirmed_at: new Date().toISOString() } },
  );

  assert.ok(maxActive >= 10, `Expected parallel fan-out, saw ${maxActive} simultaneous reads`);
  assert.equal(paths.filter((path) => path.includes("/perfiles?")).length, 1, "role/profile must not be fetched twice");
  assert.equal(result.subscription.plan, "owner");
  assert.equal(result.legal.accepted, true);
  assert.equal(result.quota.owner, true);
});

test("obvious school prompts skip only the scope model while unsafe operations do not", () => {
  const api = loadApi();
  const profile = { school_year: "3º de ESO", stage: "ESO" };
  assert.equal(api.clearAcademicFastPath("Explícame por qué empezó la Edad Media", profile, "explain")?.scope, "school");
  assert.equal(api.clearAcademicFastPath("¿Cómo funciona la fotosíntesis?", profile, "ask")?.subject, "Biología");
  assert.equal(api.clearAcademicFastPath("Cuéntame sobre los dinosaurios", profile, "explain")?.subject, "Biología");
  assert.equal(api.clearAcademicFastPath("Explícame cómo fabricar una bomba", profile, "ask"), null);
  assert.equal(api.clearAcademicFastPath("Recomiéndame una película para esta noche", profile, "ask"), null);
});

test("routine arithmetic help and its numeric reply avoid both model round trips", () => {
  const api = loadApi();
  const math = api.simpleArithmeticInText("Tengo que resolver 48 ÷ 6. ¿Me ayudas paso a paso sin darme el resultado directamente?");
  assert.equal(math?.type, "arithmetic");
  assert.equal(math?.result, 8);

  const first = api.deterministicArithmeticGuidanceTurn({
    mode: "homework",
    text: "Tengo que resolver 48 ÷ 6. ¿Me ayudas paso a paso sin darme el resultado directamente?",
    turnRel: "new_topic",
    incomingModeState: {},
    incomingPedState: {},
    subject: "Matemáticas",
    concept: "división",
    mathCheck: math,
  });
  assert.equal(first?.deterministic_arithmetic_guidance, true);
  assert.equal(first?.student_answer_assessment, "not_applicable");
  assert.equal(first?.check_question, "¿Qué número completa 6 × □ = 48?");
  assert.doesNotMatch(first?.reply || "", /(?:^|\D)8(?:\D|$)/);
  assert.deepEqual(JSON.parse(JSON.stringify(first?.pedagogical_state?.expected_key_ideas)), ["8"]);

  const correct = api.deterministicPendingNumericTurn({
    mode: "homework",
    text: "8",
    turnRel: "answer_to_pending",
    incomingModeState: {},
    incomingPedState: first.pedagogical_state,
    subject: "Matemáticas",
    concept: "división",
  });
  assert.equal(correct?.deterministic_pending_numeric, true);
  assert.equal(correct?.student_answer_assessment, "correct");
  assert.equal(correct?.check_question, null);
  assert.match(correct?.reply || "", /6 × 8 = 48/);

  const wrong = api.deterministicPendingNumericTurn({
    mode: "homework",
    text: "7",
    turnRel: "answer_to_pending",
    incomingModeState: {},
    incomingPedState: first.pedagogical_state,
    subject: "Matemáticas",
    concept: "división",
  });
  assert.equal(wrong?.student_answer_assessment, "incorrect");
  assert.equal(wrong?.check_question, first.check_question);
  assert.match(wrong?.reply || "", /^Incorrecto\./);
  assert.doesNotMatch(wrong?.reply || "", /(?:^|\D)8(?:\D|$)/);
});

test("verification blocks only risky turns while routine school replies are audited after delivery", () => {
  const api = loadApi();
  const routine = { mode: "ask", turnRel: "new_topic", scope: { scope: "school" }, stableSchool: true, text: "¿Por qué flotan los barcos?", tutorData: { student_answer_assessment: "not_applicable" } };
  assert.equal(api.synchronousVerificationRequired(routine), false);
  assert.equal(api.synchronousVerificationRequired({ ...routine, image: "data:image/png;base64,AA==" }), true);
  assert.equal(api.synchronousVerificationRequired({ ...routine, mode: "review" }), true);
  assert.equal(api.synchronousVerificationRequired({ ...routine, scope: { scope: "school", sensitive_topic: true } }), true);
  assert.equal(api.synchronousVerificationRequired({ ...routine, turnRel: "answer_to_pending" }), true);
  assert.equal(api.synchronousVerificationRequired({ ...routine, turnRel: "answer_to_pending", answerAnchor: { assessment: "correct" } }), false);
});

test("full-quality model route is unchanged and paid priority is opt-in", () => {
  const api = loadApi();
  const defaults = JSON.parse(JSON.stringify(api.modelConfiguration({})));
  assert.equal(defaults.tutor.model, "gpt-5.6-sol");
  assert.equal(defaults.tutor.fallback_model, "gpt-5.6-terra");
  assert.equal(defaults.tutor.compatibility_model, "gpt-5.4-mini");
  assert.equal(defaults.scope.fallback_model, "gpt-5.6-terra");
  assert.equal(defaults.tutor.reasoning_effort, "high");
  assert.equal(defaults.verifier.model, "gpt-5.6-terra");
  assert.equal(defaults.verifier.reasoning_effort, "high");
  assert.equal(defaults.tutor.service_tier, "default");
  assert.equal(api.openaiServiceTier({}, "eterna_tutor_v163_flagship"), null);
  assert.equal(api.openaiServiceTier({ TUTOR_SERVICE_TIER: "priority" }, "eterna_tutor_v163_flagship"), "priority");
});

test("structured model calls retry a transient HTTP failure", async () => {
  let calls = 0;
  const payloads = [];
  const api = loadApi(async (_input, init) => {
    calls += 1;
    payloads.push(JSON.parse(init.body));
    if (calls === 1) return new Response("temporarily unavailable", { status: 503 });
    return new Response(JSON.stringify({
      output_text: '{"ok":true}',
      usage: { input_tokens: 1, output_tokens: 1 },
      service_tier: "default",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  });

  const result = await api.structured({ OPENAI_API_KEY: "test-key" }, {
    model: "gpt-5.6-sol",
    input: [{ role: "user", content: [{ type: "input_text", text: "test" }] }],
    instructions: "Return the schema.",
    name: "retry_test",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: { ok: { type: "boolean" } },
      required: ["ok"],
    },
    max_output_tokens: 100,
    reasoning_effort: "low",
  });

  assert.equal(calls, 2);
  assert.equal(result.data.ok, true);
  assert.match(payloads[0].prompt_cache_key, /^coco-eterna:/);
  assert.equal(payloads[1].prompt_cache_key, undefined);
  assert.equal(payloads[1].prompt_cache_options, undefined);
});

test("Cloudflare is the primary structured provider when its binding is configured", async () => {
  const calls = [];
  const api = loadApi();
  const env = {
    AI_PROVIDER: "cloudflare",
    AI: { run: async (model, payload) => {
      calls.push({ model, payload });
      return { response: { ok: true }, usage: { prompt_tokens: 4, completion_tokens: 2 } };
    } },
  };
  const result = await api.structured(env, {
    model: "@cf/meta/llama-3.1-8b-instruct-fast",
    input: [{ role: "user", content: [{ type: "input_text", text: "test" }] }],
    instructions: "Return the schema.",
    name: "cloudflare_test",
    schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
    max_output_tokens: 100,
  });
  assert.equal(result.data.ok, true);
  assert.equal(result.service_tier, "cloudflare");
  assert.deepEqual(JSON.parse(JSON.stringify(result.usage)), { input_tokens: 4, output_tokens: 2 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].payload.response_format.type, "json_schema");
});

test("Cloudflare quota exhaustion switches structured output to the low-cost OpenAI fallback", async () => {
  let cloudflareCalls = 0;
  const openaiPayloads = [];
  const api = loadApi(async (_input, init) => {
    openaiPayloads.push(JSON.parse(init.body));
    return new Response(JSON.stringify({
      output_text: '{"ok":true}',
      usage: { input_tokens: 7, output_tokens: 3 },
      service_tier: "default",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const result = await api.structured({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "true",
    OPENAI_FALLBACK_MODEL: "gpt-5.6-luna",
    OPENAI_API_KEY: "test-key",
    AI: { run: async () => { cloudflareCalls += 1; throw new Error("Workers AI neuron quota exceeded"); } },
  }, {
    model: "@cf/qwen/qwen3-30b-a3b-fp8",
    input: [{ role: "user", content: [{ type: "input_text", text: "test" }] }],
    instructions: "Return the schema.",
    name: "quota_fallback_test",
    schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
    max_output_tokens: 100,
  });
  assert.equal(cloudflareCalls, 1, "A known quota error must not be retried against the exhausted provider");
  assert.equal(openaiPayloads.length, 1);
  assert.equal(openaiPayloads[0].model, "gpt-5.6-luna");
  assert.equal(result.data.ok, true);
  assert.deepEqual(JSON.parse(JSON.stringify(result.usage)), { input_tokens: 7, output_tokens: 3 });
});

test("Cloudflare Guard moderates ordinary school text without OpenAI", async () => {
  const calls = [];
  const api = loadApi();
  const result = await api.moderate({
    AI_PROVIDER: "cloudflare",
    AI: { run: async (model, payload) => { calls.push({ model, payload }); return { response: "safe" }; } },
  }, "Cuéntame sobre los dinosaurios", null);
  assert.equal(result.flagged, false);
  assert.equal(calls[0].model, "@cf/meta/llama-guard-3-8b");
});

test("Cloudflare moderation quota exhaustion switches to OpenAI moderation", async () => {
  let cloudflareCalls = 0;
  let openaiCalls = 0;
  const api = loadApi(async () => {
    openaiCalls += 1;
    return new Response(JSON.stringify({ results: [{ flagged: false }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  const result = await api.moderate({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "true",
    OPENAI_API_KEY: "test-key",
    AI: { run: async () => { cloudflareCalls += 1; throw new Error("Workers AI neuron quota exceeded"); } },
  }, "Explícame la germinación", null);
  assert.equal(cloudflareCalls, 1);
  assert.equal(openaiCalls, 1);
  assert.equal(result.flagged, false);
  assert.equal(result.provider, "openai");
});

test("dependency health stays available through fallback and reports degraded Cloudflare", async () => {
  const api = loadApi(async (input) => {
    if (String(input).endsWith("/moderations")) {
      return new Response(JSON.stringify({ results: [{ flagged: false }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({
      output_text: '{"ok":true}',
      usage: { input_tokens: 5, output_tokens: 2 },
      service_tier: "default",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const response = await api.dependencyProbe(new Request("https://eterna.test/health/dependencies", {
    headers: { Authorization: "Bearer probe-secret" },
  }), {
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "true",
    OPENAI_FALLBACK_MODEL: "gpt-5.6-luna",
    OPENAI_API_KEY: "test-key",
    DEPLOY_PROBE_TOKEN: "probe-secret",
    TUTOR_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async () => { throw new Error("Workers AI neuron quota exceeded"); } },
  });
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.ok, true);
  assert.equal(payload.degraded, true);
  assert.equal(payload.responses.ok, false);
  assert.equal(payload.moderation.provider, "openai");
  assert.equal(payload.structured_tutor.provider, "openai");
});

test("Cloudflare routes every photographed task through the vision model", async () => {
  const calls = [];
  const api = loadApi();
  await api.structured({
    AI_PROVIDER: "cloudflare",
    VISION_MODEL: "@cf/meta/llama-3.2-11b-vision-instruct",
    AI: { run: async (model, payload) => { calls.push({ model, payload }); return { response: { ok: true } }; } },
  }, {
    model: "@cf/qwen/qwen3-30b-a3b-fp8",
    input: [{ role: "user", content: [
      { type: "input_text", text: "Analiza la ficha" },
      { type: "input_image", image_url: "data:image/png;base64,AA==" },
    ] }],
    instructions: "Return the schema.",
    name: "vision_route_test",
    schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
    max_output_tokens: 100,
  });
  assert.equal(calls[0].model, "@cf/meta/llama-3.2-11b-vision-instruct");
  assert.equal(Array.from(calls[0].payload.image).join(","), "0");
});

test("dinosaur explanations have a verified local recovery when every tutor model is unavailable", () => {
  const api = loadApi();
  const recovery = api.stableFactTutorRecovery({
    text: "Cuéntame sobre los dinosaurios",
    mode: "explain",
    modeState: {},
    subject: "Biología",
    concept: "dinosaurios",
  });
  assert.equal(recovery.subject, "Biología");
  assert.equal(recovery.needs_clarification, false);
  assert.match(recovery.reply, /66 millones de años/);
  assert.match(recovery.reply, /aves actuales son dinosaurios avianos/);
  assert.equal(recovery.check_question, "¿Qué grupo de dinosaurios sigue existiendo hoy?");
});

test("moderation retries once before reporting an outage", async () => {
  let calls = 0;
  const api = loadApi(async () => {
    calls += 1;
    if (calls === 1) return new Response("temporarily unavailable", { status: 503 });
    return new Response(JSON.stringify({ results: [{ flagged: false }] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  const result = await api.moderate({ OPENAI_API_KEY: "test-key" }, "Cuéntame sobre los dinosaurios", null);
  assert.equal(calls, 2);
  assert.equal(result.flagged, false);
  assert.equal(result.moderation_error, undefined);
});

test("response-ready work is deferred, timed and stored before background persistence settles", () => {
  const chat = sourceBetween("async function handleChat(", "const CHAT_JOB_TTL_SECONDS");
  const moderationFailure = chat.indexOf("mod.moderation_error");
  const requestUsage = chat.indexOf('deferWork(event,"request-usage"');
  const verifier = chat.indexOf('timings?.mark("verifier")');
  const persistence = chat.indexOf('deferWork(event,"verified-chat-persistence"');
  const response = chat.lastIndexOf("return json(");
  assert.ok(moderationFailure >= 0 && requestUsage > moderationFailure);
  assert.ok(verifier >= 0 && persistence > verifier && response > persistence);
  assert.doesNotMatch(chat.slice(verifier, persistence), /await\s+(?:saveMem|logInteraction|bumpUsage|applyStudentMemory|applyMasteryOutcome)\s*\(/);
  assert.match(chat.slice(persistence, response), /await\s+(?:saveMem|logInteraction|bumpUsage|applyStudentMemory|applyMasteryOutcome)\s*\(/);
  assert.match(source, /"Server-Timing"/);
  assert.match(source, /"X-Eterna-Latency-Ms"/);
  assert.match(chat, /verificationRoute=syncVerification\?"synchronous":"asynchronous_audit"/);
  assert.match(chat, /if\(!syncVerification\)\{/);

  const jobs = sourceBetween("async function handleChatJob(", "async function handleTranscribe(");
  assert.ok(jobs.indexOf("await putChatJob(uid,id,payload)") < jobs.indexOf("await Promise.allSettled(deferred)"));
  assert.match(jobs, /CHAT_RESULT_LONG_POLL_MS/);
  assert.match(jobs, /CHAT_RESULT_POLL_STEP_MS/);
});

test("tutor and verifier use an explicit stable-prefix cache breakpoint", () => {
  const structuredSource = sourceBetween("function hasExplicitPromptCacheBreakpoint(", "function supabasePublicKey(");
  assert.match(structuredSource, /prompt_cache_options=\{mode:"explicit",ttl:"30m"\}/);
  assert.match(structuredSource, /payload\.prompt_cache_key=/);
  assert.match(structuredSource, /withoutExplicitPromptCache/);
  const tutorSource = sourceBetween("async function tutor(", "const VERIFY_VERDICTS");
  const verifierSource = sourceBetween("async function verify(", "function normalizeVerifyDecision(");
  assert.match(tutorSource, /prompt_cache_breakpoint:\{mode:"explicit"\}/);
  assert.match(verifierSource, /prompt_cache_breakpoint:\{mode:"explicit"\}/);
  assert.ok(tutorSource.indexOf("REGLAS PEDAGÓGICAS CRÍTICAS") < tutorSource.indexOf("CONTEXTO DEL TURNO"));
  assert.ok(verifierSource.indexOf("CLASIFICA EL RESULTADO") < verifierSource.indexOf("CONTEXTO A VERIFICAR"));
});
