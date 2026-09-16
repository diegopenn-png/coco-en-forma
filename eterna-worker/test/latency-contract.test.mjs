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
    analyzeImageIntake,
    validatedImageRegions,
    mergeRegionalIntakes,
    arithmeticTranscriptionIntake,
    arithmeticEvidenceIntake,
    arithmeticVisionImages,
    reliableVisionForReasoning,
    visionNeedsClarification,
    deterministicArithmeticGuidanceTurn,
    deterministicVisualArithmeticGuidanceTurn,
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
  assert.equal(defaults.provider_fallback.vision_model, "gpt-5.6-sol");
  assert.equal(defaults.vision.fallback_model, "gpt-5.6-sol");
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

test("Cloudflare photographed tasks use Llama 4 document vision before structured reasoning", async () => {
  const cloudflareCalls = [];
  let openaiCalls = 0;
  const api = loadApi(async () => {
    openaiCalls += 1;
    throw new Error("OpenAI should not be needed when Cloudflare visual grounding succeeds");
  });
  const image = "data:image/png;base64,AA==";
  const result = await api.structured({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "true",
    OPENAI_FALLBACK_MODEL: "gpt-5.6-luna",
    OPENAI_VISION_MODEL: "gpt-5.6-sol",
    OPENAI_API_KEY: "test-key",
    TUTOR_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: {
      run: async (model, payload) => {
        cloudflareCalls.push({ model, payload });
        if (model.includes("llama-4-scout")) return { response: "Ficha, fila 1: 6 × hueco = 36." };
        if (model.includes("moondream")) throw new Error("Moondream should only be a fallback when Llama 4 fails");
        return { response: { visible: true, content: "multiplication worksheet" }, usage: { prompt_tokens: 5, completion_tokens: 2 } };
      },
    },
  }, {
    model: "@cf/meta/llama-4-scout-17b-16e-instruct",
    input: [{ role: "user", content: [
      { type: "input_text", text: "Analyze the worksheet." },
      { type: "input_image", image_url: image },
    ] }],
    instructions: "Return the schema.",
    name: "vision_fallback_test",
    schema: { type: "object", additionalProperties: false, properties: { visible: { type: "boolean" }, content: { type: "string" } }, required: ["visible", "content"] },
    max_output_tokens: 160,
  });
  assert.equal(openaiCalls, 0);
  assert.deepEqual(cloudflareCalls.map((call) => call.model), ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/qwen/qwen3-30b-a3b-fp8"]);
  assert.equal(Array.from(cloudflareCalls[0].payload.image).join(","), "0");
  assert.match(cloudflareCalls[0].payload.prompt, /una línea por ejercicio/);
  assert.ok(cloudflareCalls[0].payload.max_tokens >= 700);
  assert.equal("image" in cloudflareCalls[1].payload, false);
  assert.match(cloudflareCalls[1].payload.messages[1].content, /EVIDENCIA_VISUAL_FIEL/);
  assert.match(cloudflareCalls[1].payload.messages[1].content, /6 × hueco = 36/);
  assert.deepEqual(JSON.parse(JSON.stringify(result.usage)), { input_tokens: 5, output_tokens: 2 });
  assert.equal(result.visual_model, "@cf/meta/llama-4-scout-17b-16e-instruct");
  assert.equal(result.visual_evidence, "Ficha, fila 1: 6 × hueco = 36.");
  assert.equal(result.data.visible, true);
});

test("a partially cropped worksheet keeps its reliable rows and drops uncertain ones", () => {
  const api = loadApi();
  const vision = {
    legible: false,
    confidence: 0.64,
    printed_elements: ["6 × … = 36", "borroso"],
    uncertainty: ["La última fila está cortada."],
    blanks: [
      { label: "…", purpose: "answer", nearby_printed_values: ["6", "36"], location: "fila 1", confidence: 0.95 },
      { label: "…", purpose: "unknown", nearby_printed_values: [], location: "borde inferior", confidence: 0.4 },
    ],
    items: [
      { id: "1", statement: "6 × … = 36", printed_values: ["6", "36"], blank_target: null, student_response: null, inferred_goal: "factor", spatial_notes: "fila 1", confidence: 0.95 },
      { id: "2", statement: "fila cortada", printed_values: [], blank_target: null, student_response: null, inferred_goal: "unknown", spatial_notes: "borde inferior", confidence: 0.4 },
    ],
  };
  const grounded = api.reliableVisionForReasoning(vision);
  assert.equal(api.visionNeedsClarification(grounded), false);
  assert.deepEqual(Array.from(grounded.items, (item) => item.id), ["1"]);
  assert.equal(grounded.blanks.length, 1);
  assert.equal(grounded.usable_partial, true);
  assert.equal(grounded.excluded_low_confidence_items, 1);
  assert.equal(grounded.excluded_low_confidence_blanks, 1);
  assert.ok(grounded.printed_elements.includes("6 × … = 36"));
});

test("an image with no reliable row still asks for a clearer crop", () => {
  const api = loadApi();
  const vision = {
    legible: false,
    confidence: 0.45,
    blanks: [{ label: "…", purpose: "unknown", nearby_printed_values: [], location: "unknown", confidence: 0.4 }],
    items: [{ id: "1", statement: "?", printed_values: [], confidence: 0.4 }],
  };
  assert.equal(api.visionNeedsClarification(api.reliableVisionForReasoning(vision)), true);
});

test("a semantically unusable Cloudflare worksheet result is retried with direct OpenAI vision", async () => {
  const cloudflareCalls = [];
  const openaiPayloads = [];
  const lowQuality = {
    scope: "school", subject: "Matemáticas", concept: "multiplicación", needs_clarification: true,
    self_contained: false, reason: "No se distinguen filas fiables",
    vision: { legible: false, confidence: 0.42, material_type: "worksheet", task_instruction: null, printed_elements: [], blanks: [], items: [], uncertainty: ["Texto pequeño"], suggested_focus: null },
  };
  const highQuality = {
    scope: "school", subject: "Matemáticas", concept: "multiplicación", needs_clarification: false,
    self_contained: true, reason: "La primera fila es legible",
    vision: {
      legible: true, confidence: 0.97, material_type: "worksheet", task_instruction: "Completa los huecos",
      printed_elements: ["6 × … = 36"],
      blanks: [{ label: "…", purpose: "answer", nearby_printed_values: ["6", "36"], location: "fila 1", confidence: 0.97 }],
      items: [{ id: "1", statement: "6 × … = 36", printed_values: ["6", "36"], blank_target: null, student_response: null, inferred_goal: "hallar el factor", spatial_notes: "fila 1", confidence: 0.97 }],
      uncertainty: [], suggested_focus: "fila 1",
    },
  };
  const api = loadApi(async (_input, init) => {
    const payload = JSON.parse(init.body);
    openaiPayloads.push(payload);
    const data = String(payload.text?.format?.name || "").startsWith("eterna_arithmetic_region_")
      ? { is_arithmetic_worksheet: false, rows: [] }
      : highQuality;
    return new Response(JSON.stringify({ output_text: JSON.stringify(data), usage: { input_tokens: 20, output_tokens: 10 }, service_tier: "default" }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "true",
    OPENAI_VISION_MODEL: "gpt-5.6-sol",
    OPENAI_API_KEY: "test-key",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model) => { cloudflareCalls.push(model); return model.includes("llama-4-scout") ? { response: "Ficha, fila 1: 6 × hueco = 36." } : { response: lowQuality }; } },
  }, "He adjuntado una foto de mi tarea.", "data:image/png;base64,AA==", { school_year: "5º de Primaria" }, []);
  assert.deepEqual(cloudflareCalls, ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/qwen/qwen3-30b-a3b-fp8", "@cf/moondream/moondream3.1-9B-A2B"]);
  assert.equal(openaiPayloads.length, 2);
  assert.equal(openaiPayloads[0].model, "gpt-5.6-sol");
  assert.equal(openaiPayloads[0].input[0].content[1].image_url, "data:image/png;base64,AA==");
  assert.equal(result.vision.items[0].statement, "6 × … = 36");
  assert.equal(api.visionNeedsClarification(api.reliableVisionForReasoning(result.vision)), false);
});

test("two validated worksheet regions are read directly and merged without inventing cropped content", async () => {
  const lowQuality = {
    scope: "school", subject: "Matemáticas", concept: "multiplicación", needs_clarification: true,
    self_contained: false, reason: "La hoja completa tiene demasiadas filas pequeñas",
    vision: { legible: false, confidence: 0.4, material_type: "worksheet", task_instruction: null, printed_elements: [], blanks: [], items: [], uncertainty: ["Filas pequeñas"], suggested_focus: null },
  };
  const regionA = "data:image/png;base64,AQ==", regionB = "data:image/png;base64,Ag==", seenImages = [];
  const api = loadApi(async (_input, init) => {
    const payload = JSON.parse(init.body), imageUrl = payload.input[0].content[1].image_url;
    seenImages.push(imageUrl);
    const data = imageUrl === regionA
      ? { is_arithmetic_worksheet: true, rows: [{ left: "6", operator: "×", right: null, result: "36", blank_position: "right", confidence: 0.97 }] }
      : { is_arithmetic_worksheet: true, rows: [{ left: "2", operator: "×", right: null, result: "14", blank_position: "right", confidence: 0.96 }] };
    return new Response(JSON.stringify({ output_text: JSON.stringify(data), usage: { input_tokens: 20, output_tokens: 10 }, service_tier: "default" }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare", ENABLE_OPENAI_FALLBACK: "true", OPENAI_VISION_MODEL: "gpt-5.6-sol", OPENAI_API_KEY: "test-key",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct", VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B", VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model) => model.includes("llama-4-scout") ? { response: "Ficha, fila 1: 6 × hueco = 36." } : { response: lowQuality } },
  }, "He adjuntado una foto de mi tarea.", "data:image/png;base64,AA==", { school_year: "5º de Primaria" }, [], [regionA, regionB]);
  assert.deepEqual(seenImages.sort(), ["data:image/png;base64,AA==", regionA, regionB].sort());
  assert.deepEqual(Array.from(result.vision.items, item => item.statement).sort(), ["2 × … = 14", "6 × … = 36"]);
  assert.equal(result.vision.regional_analysis, true);
  assert.equal(result.needs_clarification, false);
});

test("focused Cloudflare region OCR recovers repeated arithmetic without requiring OpenAI", async () => {
  const lowQuality = {
    scope: "school", subject: "Matemáticas", concept: "multiplicación", needs_clarification: true,
    self_contained: false, reason: "La hoja completa tiene demasiadas filas pequeñas",
    vision: { legible: false, confidence: 0.4, material_type: "worksheet", task_instruction: null, printed_elements: [], blanks: [], items: [], uncertainty: ["Filas pequeñas"], suggested_focus: null },
  };
  const regionA = "data:image/png;base64,AQ==", regionB = "data:image/png;base64,Ag==";
  const api = loadApi(async () => { throw new Error("OpenAI must not be required for Cloudflare regional OCR"); });
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "false",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model, payload) => {
      if (model.includes("qwen")) return { response: lowQuality };
      if (payload.image === regionA) return { response: "Fila 1: 6 × hueco = 36\nFila 2: 2 × hueco = 18" };
      if (payload.image === regionB) return { response: "Fila 3: hueco × 8 = 48\nFila cortada: 5 × hueco" };
      return { response: "Ficha de multiplicaciones: 6 × hueco = 36" };
    } },
  }, "He adjuntado una foto de mi tarea.", "data:image/png;base64,AA==", { school_year: "5º de Primaria" }, [], [regionA, regionB]);
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["6 × … = 36", "2 × … = 18", "… × 8 = 48"]);
  assert.equal(result.vision.regional_analysis, true);
  assert.equal(result.needs_clarification, false);
});

test("a current Language photograph uses general vision and ignores stale Mathematics history", async () => {
  const lowQuality = {
    scope: "school", subject: "Lengua Castellana y Literatura", concept: "ortografía", needs_clarification: true,
    self_contained: false, reason: "El texto completo es pequeño",
    vision: { legible: false, confidence: 0.45, material_type: "worksheet", task_instruction: null, printed_elements: [], blanks: [], items: [], uncertainty: ["Texto pequeño"], suggested_focus: null },
  };
  const highQuality = {
    scope: "school", subject: "Lengua Castellana y Literatura", concept: "completar palabras con b o v", needs_clarification: false,
    self_contained: true, reason: "La zona actual permite leer el ejercicio",
    vision: { legible: true, confidence: 0.94, material_type: "worksheet", task_instruction: "Completa con b o v", printed_elements: ["Completa con b o v", "_aca"], blanks: [{label:"_",purpose:"word",nearby_printed_values:["aca"],location:"palabra 1",confidence:0.94}], items: [{id:"lengua-1",statement:"_aca",printed_values:["aca"],blank_target:{label:"_",purpose:"word",nearby_printed_values:["aca"],location:"palabra 1",confidence:0.94},student_response:null,inferred_goal:"completar con b o v",spatial_notes:"palabra 1",confidence:0.94}], uncertainty: [], suggested_focus: "_aca" },
  };
  let structuredCalls = 0;
  const seenVisionPrompts = [];
  const api = loadApi(async () => { throw new Error("OpenAI must not be required for current Language vision"); });
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "false",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model, payload) => {
      if (model.includes("llama-4-scout")) {
        seenVisionPrompts.push(payload.prompt);
        return { response: "Ficha de Lengua. Instrucción visible: Completa con b o v. Primera palabra con hueco: _aca. El hueco es una letra, no un número." };
      }
      if (model.includes("qwen")) return { response: ++structuredCalls === 1 ? lowQuality : highQuality };
      throw new Error(`unexpected model route: ${model}`);
    } },
  }, "Esta foto nueva es de Lengua.", "data:image/png;base64,AA==", { school_year: "5º de Primaria" }, [{role:"assistant",text:"Seguíamos con multiplicaciones secretas"}], []);
  assert.equal(result.subject, "Lengua Castellana y Literatura");
  assert.equal(result.vision.items[0].statement, "_aca");
  assert.equal(result.needs_clarification, false);
  assert.ok(seenVisionPrompts.some(prompt => /lectura GENERAL de material escolar/.test(prompt)));
  assert.ok(seenVisionPrompts.every(prompt => !/multiplicaciones secretas/.test(prompt)));
});

test("a stalled Cloudflare region cannot block a clear sibling crop", async () => {
  const lowQuality = {
    scope: "school", subject: "Matemáticas", concept: "multiplicación", needs_clarification: true,
    self_contained: false, reason: "La hoja completa tiene demasiadas filas pequeñas",
    vision: { legible: false, confidence: 0.4, material_type: "worksheet", task_instruction: null, printed_elements: [], blanks: [], items: [], uncertainty: ["Filas pequeñas"], suggested_focus: null },
  };
  const regionA = "data:image/png;base64,AQ==", regionB = "data:image/png;base64,Ag==";
  const api = loadApi();
  const started = Date.now();
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "false",
    CLOUDFLARE_REGION_OCR_TIMEOUT_MS: "25",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model, payload) => {
      if (model.includes("qwen")) return { response: lowQuality };
      if (model.includes("moondream") && payload.image === regionA) return await new Promise(() => {});
      if (model.includes("moondream") && payload.image === regionB) return { response: "6 × hueco = 36\n2 × hueco = 18\nhueco × 8 = 48" };
      return { response: "Ficha de multiplicaciones: 6 × hueco = 36" };
    } },
  }, "He adjuntado una foto de mi tarea.", "data:image/png;base64,AA==", { school_year: "5º de Primaria" }, [], [regionA, regionB]);
  assert.ok(Date.now() - started < 250, "the request must stop waiting for a stalled region");
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["6 × … = 36", "2 × … = 18", "… × 8 = 48"]);
  assert.equal(result.needs_clarification, false);
});

test("a stalled primary Cloudflare vision call yields to grounded regional arithmetic", async () => {
  const regionA = "data:image/png;base64,AQ==", regionB = "data:image/png;base64,Ag==";
  const api = loadApi();
  const started = Date.now();
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "false",
    CLOUDFLARE_PRIMARY_VISION_TIMEOUT_MS: "25",
    CLOUDFLARE_REGION_OCR_TIMEOUT_MS: "25",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model, payload) => {
      if (model.includes("llama-4-scout")) return await new Promise(() => {});
      if (payload.image === regionA) return { response: "6 × hueco = 36\n2 × hueco = 18" };
      if (payload.image === regionB) return { response: "Fila 3: hueco × 8 = 48" };
      throw new Error("unexpected model route");
    } },
  }, "He adjuntado una foto de mi tarea.", "data:image/png;base64,AA==", { school_year: "5º de Primaria" }, [], [regionA, regionB]);
  assert.ok(Date.now() - started < 250, "regional OCR must start after the primary deadline");
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["6 × … = 36", "2 × … = 18", "… × 8 = 48"]);
  assert.equal(result.vision.arithmetic_transcription, true);
  assert.equal(result.needs_clarification, false);
});

test("a stale PWA without client regions falls back to the complete original image", async () => {
  const image = "data:image/png;base64,AA==", seenImages = [];
  const api = loadApi();
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "false",
    CLOUDFLARE_PRIMARY_VISION_TIMEOUT_MS: "25",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model, payload) => {
      if (model.includes("llama-4-scout")) return await new Promise(() => {});
      seenImages.push(payload.image);
      return { response: "7 x _ = 35" };
    } },
  }, "He adjuntado una foto de mi tarea.", image, { school_year: "5º de Primaria" }, [], []);
  assert.deepEqual(seenImages, [image]);
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["7 × … = 35"]);
  assert.equal(result.vision.arithmetic_transcription, true);
  assert.equal(result.needs_clarification, false);
});

test("the complete image remains available when horizontal client crops cut equations", async () => {
  const image = "data:image/png;base64,AA==", left = "data:image/png;base64,AQ==", right = "data:image/png;base64,Ag==", seenImages = [];
  const api = loadApi();
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "false",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model, payload) => {
      if (model.includes("llama-4-scout")) return { response: "Visible school task" };
      if (model.includes("qwen")) return { response: { scope: "school", needs_clarification: true, vision: { legible: false, confidence: 0.3, material_type: "worksheet", printed_elements: [], blanks: [], items: [], uncertainty: ["fragmented"], suggested_focus: null } } };
      seenImages.push(payload.image);
      return payload.image === image
        ? { response: "5 × hueco = 35\n4 × hueco = 16\n9 × hueco = 54\n3 × 6 = hueco" }
        : { response: "fragmento cortado sin una ecuación completa" };
    } },
  }, "He adjuntado una foto de mi tarea.", image, { school_year: "5º de Primaria" }, [], [left, right]);
  assert.deepEqual(seenImages.sort(), [image, image, left, right].sort());
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["5 × … = 35", "4 × … = 16", "9 × … = 54", "3 × 6 = …"]);
  assert.equal(result.needs_clarification, false);
});

test("arithmetic transcription keeps only complete high-confidence rows with one explicit blank", () => {
  const api = loadApi();
  const result = api.arithmeticTranscriptionIntake({ is_arithmetic_worksheet: true, rows: [
    { left: "6", operator: "×", right: null, result: "36", blank_position: "right", confidence: 0.97 },
    { left: "2", operator: "×", right: null, result: "18", blank_position: "right", confidence: 0.71 },
    { left: "not-a-number", operator: "×", right: null, result: "9", blank_position: "right", confidence: 0.99 },
    { left: "3", operator: "?", right: "6", result: null, blank_position: "result", confidence: 0.99 },
  ] });
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["6 × … = 36"]);
  assert.equal(result.vision.confidence, 0.97);
  assert.equal(result.needs_clarification, false);
});

test("repeated arithmetic equations are recovered from accepted visual evidence without solving blanks", () => {
  const api = loadApi();
  const result = api.arithmeticEvidenceIntake("Ficha de multiplicaciones\nFila 1: 6 × hueco = 36\nFila 2: 2 x ... = 18\nFila 3: ... × 8 = 48\nFila cortada: 5 × ...");
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["6 × … = 36", "2 × … = 18", "… × 8 = 48"]);
  assert.equal(result.vision.confidence, 0.82);
  assert.equal(api.arithmeticEvidenceIntake("Solo se distingue 6 × hueco = 36"), null, "one isolated OCR row is not enough to establish the repeated worksheet pattern");
});

test("grounded visual arithmetic produces a concrete first hint without solving the blank", () => {
  const api = loadApi();
  const intake = api.arithmeticEvidenceIntake("6 × hueco = 36\n2 × hueco = 18\nhueco × 8 = 48");
  const result = api.deterministicVisualArithmeticGuidanceTurn({
    mode: "homework",
    turnRel: "new_topic",
    incomingModeState: { question_number: 1, correct_count: 0, partial_count: 0, incorrect_count: 0, difficulty: 2, focus: null },
    incomingPedState: { current_mode: "homework", turn_index: 0 },
    subject: "Matemáticas",
    concept: "operaciones con un número desconocido",
    vision: intake.vision,
  });
  assert.match(result.reply, /6 × … = 36/);
  assert.match(result.reply, /2 × … = 18/);
  assert.match(result.reply, /operación inversa/);
  assert.equal(result.check_question, "¿Qué número completa 6 × □ = 36?");
  assert.doesNotMatch(result.reply, /(?:hueco|respuesta)\s+es\s+6/i);
});

test("one focused visual equation produces a concrete hint without weakening generic evidence", () => {
  const api = loadApi();
  const intake = api.arithmeticEvidenceIntake("7 x _ = 35", { minimumRows: 1 });
  const result = api.deterministicVisualArithmeticGuidanceTurn({
    mode: "homework",
    turnRel: "new_topic",
    incomingModeState: { question_number: 1 },
    incomingPedState: { current_mode: "homework", turn_index: 0 },
    vision: intake.vision,
  });
  assert.match(result.reply, /una operación con un hueco: 7 × … = 35/);
  assert.equal(result.check_question, "¿Qué número completa 7 × □ = 35?");
  assert.doesNotMatch(result.reply, /(?:hueco|respuesta)\s+es\s+5/i);
  assert.equal(api.arithmeticEvidenceIntake("Solo se distingue 7 x _ = 35"), null);
});

test("grounded arithmetic accepts common Cloudflare notation variants without weakening row gates", () => {
  const api = loadApi();
  const variants = [
    "| 6 | × | [blank] | = | 36 |\n| 2 | x | [ ] | = | 18 |\n| [missing number] | × | 8 | = | 48 |",
    "1. 6 multiplied by ___ equals 36\n2. 2 times three dots equals 18\n3. missing number multiplied by 8 equals 48",
    "- \\(6 \\times \\ldots = 36\\)\n- \\(2 \\cdot ? = 18\\)\n- \\(\\dots \\times 8 = 48\\)",
    "Fila 1: 6 veces □ es igual a 36; fila 2: 2 multiplicado por □ es igual a 18; fila 3: □ multiplicado por 8 es igual a 48",
  ];
  for (const evidence of variants) {
    const result = api.arithmeticEvidenceIntake(evidence);
    assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["6 × … = 36", "2 × … = 18", "… × 8 = 48"], evidence);
    assert.equal(result.vision.confidence, 0.82);
  }
  assert.equal(api.arithmeticEvidenceIntake("6 × [blank] = 36\nFila cortada: 2 × [blank]"), null);
  assert.equal(api.arithmeticEvidenceIntake("6 × [blank] = 36\n2 × [blank] = unknown"), null, "every accepted row must contain exactly one blank");
});

test("grounded Cloudflare arithmetic evidence bypasses a lossy structuring result", async () => {
  let openaiCalls = 0;
  const lowQuality = {
    scope: "school", subject: "Matemáticas", concept: "multiplicación", needs_clarification: true, self_contained: false, reason: "Estructuración conservadora",
    vision: { legible: false, confidence: 0.4, material_type: "worksheet", task_instruction: null, printed_elements: [], blanks: [], items: [], uncertainty: ["Filas pequeñas"], suggested_focus: null },
  };
  const api = loadApi(async () => { openaiCalls += 1; throw new Error("Grounded evidence should avoid OpenAI fallback"); });
  const result = await api.analyzeImageIntake({
    AI_PROVIDER: "cloudflare", ENABLE_OPENAI_FALLBACK: "true", OPENAI_VISION_MODEL: "gpt-5.6-sol", OPENAI_API_KEY: "test-key",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct", VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B", VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model) => model.includes("llama-4-scout") ? { response: "Fila 1: 6 × hueco = 36.\nFila 2: 2 × hueco = 18.\nFila 3: hueco × 8 = 48." } : { response: lowQuality } },
  }, "He adjuntado una foto de mi tarea.", "data:image/png;base64,AA==", { school_year: "5º de Primaria" }, []);
  assert.equal(openaiCalls, 0);
  assert.deepEqual(Array.from(result.vision.items, item => item.statement), ["6 × … = 36", "2 × … = 18", "… × 8 = 48"]);
  assert.equal(api.visionNeedsClarification(api.reliableVisionForReasoning(result.vision)), false);
});

test("worksheet regions are bounded, deduplicated and accepted only beside a valid full image", () => {
  const api = loadApi(), first = "data:image/png;base64,AQ==", second = "data:image/png;base64,Ag==";
  assert.deepEqual(Array.from(api.validatedImageRegions([first, first, second], true)), [first]);
  assert.deepEqual(Array.from(api.validatedImageRegions([first, second], false)), []);
  assert.deepEqual(Array.from(api.validatedImageRegions([first, "not-an-image"], true)), []);
});

test("Cloudflare visual grounding quota switches to the dedicated OpenAI vision model", async () => {
  let cloudflareCalls = 0;
  const openaiPayloads = [];
  const api = loadApi(async (_input, init) => {
    openaiPayloads.push(JSON.parse(init.body));
    return new Response(JSON.stringify({
      output_text: '{"visible":true,"content":"multiplication worksheet"}',
      usage: { input_tokens: 11, output_tokens: 5 },
      service_tier: "default",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const image = "data:image/png;base64,AA==";
  const result = await api.structured({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "true",
    OPENAI_FALLBACK_MODEL: "gpt-5.6-luna",
    OPENAI_VISION_MODEL: "gpt-5.6-sol",
    OPENAI_API_KEY: "test-key",
    AI: { run: async () => { cloudflareCalls += 1; throw new Error("Workers AI neuron quota exceeded"); } },
  }, {
    model: "@cf/llava-hf/llava-1.5-7b-hf",
    input: [{ role: "user", content: [
      { type: "input_text", text: "Analyze the worksheet." },
      { type: "input_image", image_url: image },
    ] }],
    instructions: "Return the schema.",
    name: "vision_fallback_test",
    schema: { type: "object", additionalProperties: false, properties: { visible: { type: "boolean" }, content: { type: "string" } }, required: ["visible", "content"] },
    max_output_tokens: 160,
  });
  assert.equal(cloudflareCalls, 2, "A known visual quota error must try the distinct Cloudflare visual fallback once before OpenAI");
  assert.equal(openaiPayloads.length, 1);
  assert.equal(openaiPayloads[0].model, "gpt-5.6-sol");
  assert.equal(openaiPayloads[0].input[0].content[1].image_url, image);
  assert.equal(result.data.visible, true);
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

test("Cloudflare image moderation accepts the image-to-text description response shape", async () => {
  const calls = [];
  const api = loadApi();
  const result = await api.moderate({
    AI_PROVIDER: "cloudflare",
    VISION_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_SAFETY_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    AI: { run: async (model, payload) => { calls.push({ model, payload }); return { answer: "The image is safe." }; } },
  }, "Ficha escolar de multiplicaciones", "data:image/png;base64,AA==");
  assert.equal(result.flagged, false);
  assert.equal(result.provider, "cloudflare");
  assert.equal(result.model, "@cf/moondream/moondream3.1-9B-A2B");
  assert.equal(calls[0].model, "@cf/moondream/moondream3.1-9B-A2B");
  assert.equal(calls[0].payload.task, "query");
  assert.equal(calls[0].payload.image, "data:image/png;base64,AA==");
  assert.equal(calls[0].payload.reasoning, false);
  assert.equal(calls[0].payload.max_tokens, 32);
});

test("a stalled image safety model stops at the moderation deadline", async () => {
  const api = loadApi();
  const started = Date.now();
  const result = await api.moderate({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "false",
    MODERATION_INFERENCE_TIMEOUT_MS: "25",
    VISION_SAFETY_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    AI: { run: async () => await new Promise(() => {}) },
  }, "Ficha escolar de multiplicaciones", "data:image/png;base64,AA==");
  assert.ok(Date.now() - started < 250, "image moderation must not wait indefinitely");
  assert.equal(result.moderation_error, true);
  assert.match(result.diagnostic_code, /TIMEOUT/);
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
  const api = loadApi(async (input, init) => {
    if (String(input).endsWith("/moderations")) {
      return new Response(JSON.stringify({ results: [{ flagged: false }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }
    const request = JSON.parse(init.body);
    const visual = request.input?.some((message) => message.content?.some?.((part) => part.type === "input_image"));
    return new Response(JSON.stringify({
      output_text: visual ? '{"visible":true,"content":"multiplication worksheet"}' : '{"ok":true}',
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
    OPENAI_VISION_MODEL: "gpt-5.6-sol",
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
  assert.equal(payload.image_moderation.provider, "openai");
  assert.equal(payload.structured_tutor.provider, "openai");
  assert.equal(payload.structured_vision.provider, "openai");

  const directResponse = await api.dependencyProbe(new Request("https://eterna.test/health/dependencies", {
    headers: { Authorization: "Bearer probe-secret" },
  }), {
    AI_PROVIDER: "cloudflare",
    DEPLOY_PROBE_TOKEN: "probe-secret",
    TUTOR_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_SAFETY_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    AI: {
      run: async (model, request) => model.includes("llama-guard")
        ? { response: "safe" }
        : model.includes("llava")
          ? { description: "safe" }
        : model.includes("moondream")
          ? request.max_tokens === 32
            ? { answer: "safe" }
            : { answer: "A multiplication worksheet shows 3 x blank = 12." }
        : model.includes("llama-4-scout")
          ? { response: "A multiplication worksheet shows row 1: 3 x blank = 12." }
        : model.includes("qwen")
          ? /EVIDENCIA_VISUAL_FIEL/.test(request.messages?.[1]?.content || "")
            ? { response: { visible: true, content: "multiplication worksheet" } }
            : { response: { ok: true } }
            : { response: "OK" },
    },
  });
  const directPayload = await directResponse.json();
  assert.equal(directResponse.status, 200);
  assert.equal(directPayload.ok, true, "A parsed JSON object proves the structured dependency is available without trusting sample semantics");
  assert.equal(directPayload.degraded, false);
  assert.equal(directPayload.structured_tutor.provider, "cloudflare");
  assert.equal(directPayload.image_moderation.provider, "cloudflare");
  assert.equal(directPayload.image_moderation.model, "@cf/moondream/moondream3.1-9B-A2B");
  assert.equal(directPayload.structured_vision.provider, "cloudflare");
  assert.equal(directPayload.structured_vision.visual_model, "@cf/meta/llama-4-scout-17b-16e-instruct");
});

test("Cloudflare rejects generic Llama 4 evidence and falls back to detailed Moondream OCR", async () => {
  const calls = [];
  const api = loadApi();
  await api.structured({
    AI_PROVIDER: "cloudflare",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: {
      run: async (model, payload) => { calls.push({ model, payload }); if(model.includes("llama-4-scout"))return { response: "Visible school task" };return model.includes("moondream") ? { answer: "Ficha, fila 1: 6 × hueco = 36." } : { response: { ok: true } }; },
    },
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
  assert.deepEqual(calls.map((call) => call.model), ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/moondream/moondream3.1-9B-A2B", "@cf/qwen/qwen3-30b-a3b-fp8"]);
  assert.equal(calls[2].payload.task, "query");
  assert.equal(calls[2].payload.image, "data:image/png;base64,AA==");
  assert.equal("image" in calls[3].payload, false);
});

test("generic evidence from every Cloudflare vision model escalates to the dedicated OpenAI vision fallback", async () => {
  const cloudflareCalls = [];
  const openaiPayloads = [];
  const api = loadApi(async (_input, init) => {
    const payload = JSON.parse(init.body);
    openaiPayloads.push(payload);
    return new Response(JSON.stringify({
      output_text: '{"ok":true}',
      usage: { input_tokens: 9, output_tokens: 3 },
      service_tier: "default",
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  const image = "data:image/png;base64,AA==";
  const result = await api.structured({
    AI_PROVIDER: "cloudflare",
    ENABLE_OPENAI_FALLBACK: "true",
    OPENAI_VISION_MODEL: "gpt-5.6-sol",
    OPENAI_API_KEY: "test-key",
    VISION_MODEL: "@cf/meta/llama-4-scout-17b-16e-instruct",
    VISION_FALLBACK_MODEL: "@cf/moondream/moondream3.1-9B-A2B",
    VISION_STRUCTURING_MODEL: "@cf/qwen/qwen3-30b-a3b-fp8",
    AI: { run: async (model) => { cloudflareCalls.push(model); return model.includes("moondream") ? { answer: "A multiplication worksheet with many rows and empty spaces is visible." } : { response: "Visible school task" }; } },
  }, {
    model: "@cf/meta/llama-4-scout-17b-16e-instruct",
    input: [{ role: "user", content: [
      { type: "input_text", text: "Analiza la ficha" },
      { type: "input_image", image_url: image },
    ] }],
    instructions: "Return the schema.",
    name: "vision_quality_gate_test",
    schema: { type: "object", properties: { ok: { type: "boolean" } }, required: ["ok"] },
    max_output_tokens: 100,
  });
  assert.deepEqual(cloudflareCalls, ["@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/meta/llama-4-scout-17b-16e-instruct", "@cf/moondream/moondream3.1-9B-A2B"]);
  assert.equal(openaiPayloads.length, 1);
  assert.equal(openaiPayloads[0].model, "gpt-5.6-sol");
  assert.equal(openaiPayloads[0].input[0].content[1].image_url, image);
  assert.equal(result.data.ok, true);
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
