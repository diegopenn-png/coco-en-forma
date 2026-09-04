import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = resolve(HERE, "fixtures");
const DEFAULT_OFFLINE_REPORT = resolve(HERE, "reports/latest-offline.json");
const DEFAULT_LIVE_REPORT = resolve(HERE, "reports/latest-live.json");
const MODES = ["homework", "ask", "review", "explain", "exam", "practice"];
const CONTROL_TEXT = /\b(resumen|cierra|cerramos|termina|fin|siguiente|otra pregunta|otra de|dame otra|pon automáticamente|cuál era|cuál sigue|qué pregunta|qué tema|qué practicábamos|verifica|confirma|no cuentes|no abras|vuelve a|cambia a)\b/i;

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadMatrixFixtures() {
  return {
    personas: readJson(resolve(FIXTURES, "personas.v1.json")).personas,
    conversations: readJson(resolve(FIXTURES, "conversations-48x9.v1.json")).conversations,
    subscriptionGates: readJson(resolve(FIXTURES, "subscription-gates.v1.json")),
  };
}

export function parseArgs(argv = process.argv.slice(2)) {
  const live = argv.includes("--live");
  const offline = argv.includes("--offline");
  if (live === offline) throw new Error("Choose exactly one execution scope: --offline or --live");
  const outputIndex = argv.indexOf("--output");
  return {
    scope: live ? "live" : "offline",
    writeReport: !argv.includes("--no-write"),
    output: outputIndex >= 0 ? resolve(argv[outputIndex + 1] || "") : (live ? DEFAULT_LIVE_REPORT : DEFAULT_OFFLINE_REPORT),
  };
}

function newModeState(conversationId, mode) {
  return { question_id: `${conversationId}:${mode}:q1`, question_seq: 1, accepted_answers: 0 };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function switchActions(step) {
  return (step.before || []).filter((action) => action.startsWith("switch_mode:"));
}

function isContractAnswer(mode, index, step) {
  if (!["exam", "practice"].includes(mode) || index === 0) return false;
  if (["replay", "late_answer", "feedback_understood", "need_hint"].includes(step.action)) return false;
  return !CONTROL_TEXT.test(step.input);
}

function containsRawInput(serializedState, conversation) {
  return conversation.steps.some((step) => step.input.length >= 4 && serializedState.includes(step.input));
}

export function createOfflineAdapter(conversation) {
  let state = {
    session_id: `offline:${conversation.id}`,
    active_mode: conversation.mode,
    modes: { [conversation.mode]: newModeState(conversation.id, conversation.mode) },
    question_aliases: {},
    processed_transport_ids: {},
  };

  return {
    scope: "offline_contract",
    async execute(step, index) {
      let refreshChecked = false;
      let refreshPassed = true;
      if ((step.before || []).includes("reload")) {
        const before = JSON.stringify(state);
        state = clone(state);
        refreshChecked = true;
        refreshPassed = before === JSON.stringify(state) && !containsRawInput(JSON.stringify(state), conversation);
      }

      const switches = [];
      for (const action of switchActions(step)) {
        const target = action.slice("switch_mode:".length);
        const snapshot = clone(state.modes);
        if (!MODES.includes(target)) throw new Error(`${step.request_id}: unsupported mode ${target}`);
        state.modes[target] ||= newModeState(conversation.id, target);
        state.active_mode = target;
        const preserved = Object.entries(snapshot).every(([mode, value]) => JSON.stringify(state.modes[mode]) === JSON.stringify(value));
        switches.push({ target, passed: preserved });
      }

      const modeState = state.modes[state.active_mode] ||= newModeState(conversation.id, state.active_mode);
      const questionBefore = modeState.question_id;
      const counterBefore = modeState.accepted_answers;
      const transportId = step.action === "replay" ? step.replay_of : step.request_id;
      const answerTo = step.answer_to ? state.question_aliases[step.answer_to] : null;

      let status = "accepted";
      if (state.processed_transport_ids[transportId]) status = "replayed";
      else if (step.action === "late_answer" && answerTo !== modeState.question_id) status = "stale";
      else {
        const scored = isContractAnswer(state.active_mode, index, step);
        if (scored) modeState.accepted_answers += 1;
        modeState.question_seq += 1;
        modeState.question_id = `${conversation.id}:${state.active_mode}:q${modeState.question_seq}`;
        state.processed_transport_ids[transportId] = {
          status: "accepted",
          question_id: modeState.question_id,
          accepted_answers: modeState.accepted_answers,
        };
      }

      if (step.capture_question_id_as) state.question_aliases[step.capture_question_id_as] = questionBefore;
      const counterAfter = modeState.accepted_answers;
      const expectedDelta = status === "accepted" && isContractAnswer(state.active_mode, index, step) ? 1 : 0;
      const serialized = JSON.stringify(state);

      return {
        request_id: step.request_id,
        evidence_kind: "contract_transition_only",
        status,
        active_mode: state.active_mode,
        question_before: questionBefore,
        question_after: modeState.question_id,
        counter_delta: counterAfter - counterBefore,
        counter_integrity: counterAfter - counterBefore === expectedDelta,
        idempotency_check: step.action === "replay" ? status === "replayed" && counterAfter === counterBefore : null,
        stale_check: step.action === "late_answer" ? status === "stale" && counterAfter === counterBefore : null,
        refresh_check: refreshChecked ? refreshPassed : null,
        switch_checks: switches,
        privacy_check: !containsRawInput(serialized, conversation) && !serialized.includes("image_data_url") && !serialized.includes("audio_fixture"),
      };
    },
    snapshot() {
      return clone(state);
    },
  };
}

function requiredLiveEnvironment(env) {
  const endpoint = String(env.ETERNA_TEST_ENDPOINT || "").trim();
  const token = String(env.ETERNA_TEST_TOKEN || "").trim();
  if (!endpoint || !token) throw new Error("Live mode requires authorized ETERNA_TEST_ENDPOINT and ETERNA_TEST_TOKEN environment variables");
  const url = new URL(endpoint);
  if (url.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(url.hostname)) throw new Error("ETERNA_TEST_ENDPOINT must use HTTPS or localhost");
  return { endpoint: url.toString(), token };
}

export function createLiveAdapter(conversation, env = process.env, fetchImpl = globalThis.fetch) {
  const { endpoint, token } = requiredLiveEnvironment(env);
  if (typeof fetchImpl !== "function") throw new Error("Live mode requires a fetch implementation");
  let activeMode = conversation.mode;
  let pedagogicalState = null;
  let modeState = null;
  const aliases = {};

  return {
    scope: "live_api_contract",
    async execute(step) {
      for (const action of switchActions(step)) activeMode = action.slice("switch_mode:".length);
      const questionBefore = pedagogicalState?.pending_question_id || null;
      const transportId = step.action === "replay" ? step.replay_of : step.request_id;
      let imageDataUrl = null;
      if (step.asset) {
        const mediaDir = String(env.ETERNA_TEST_MEDIA_DIR || "").trim();
        if (!mediaDir) throw new Error("Live photo steps require ETERNA_TEST_MEDIA_DIR with authorized synthetic fixtures");
        const mediaPath = resolve(mediaDir, basename(step.asset));
        if (!existsSync(mediaPath)) throw new Error(`Missing authorized synthetic media fixture: ${basename(step.asset)}`);
        imageDataUrl = `data:image/png;base64,${readFileSync(mediaPath).toString("base64")}`;
      }
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          text: step.input,
          mode: activeMode,
          mode_state: modeState,
          pedagogical_state: pedagogicalState,
          input_source: conversation.input_type,
          image_data_url: imageDataUrl,
          request_id: transportId,
          answer_to_question_id: step.answer_to ? aliases[step.answer_to] || null : questionBefore,
          client_state_contract: 3,
          qa_evidence_scope: "live_api_contract",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (step.capture_question_id_as) aliases[step.capture_question_id_as] = questionBefore;
      if (data?.pedagogical_state && typeof data.pedagogical_state === "object") pedagogicalState = data.pedagogical_state;
      if (data?.mode_state && typeof data.mode_state === "object") modeState = data.mode_state;
      return {
        request_id: step.request_id,
        evidence_kind: "live_http_contract",
        http_status: response.status,
        ok: response.ok,
        verification_status: typeof data?.verification_status === "string" ? data.verification_status : null,
        assessment: typeof data?.student_answer_assessment === "string" ? data.student_answer_assessment : null,
        question_before: questionBefore,
        question_after: pedagogicalState?.pending_question_id || null,
        media_transport: step.asset ? "synthetic_image_fixture" : (step.audio_fixture ? "fixture_transcript_post_transcription" : "text"),
        response_text_retained: false,
      };
    },
    snapshot() {
      return { active_mode: activeMode, pedagogical_state: pedagogicalState, mode_state: modeState };
    },
  };
}

function passCount(results, key) {
  const checked = results.filter((result) => result[key] !== null && result[key] !== undefined);
  return { checked: checked.length, passed: checked.filter((result) => result[key] === true).length };
}

export async function runMatrix({ scope = "offline", fixtures = loadMatrixFixtures(), env = process.env, fetchImpl = globalThis.fetch } = {}) {
  if (!['offline', 'live'].includes(scope)) throw new Error(`Unsupported scope: ${scope}`);
  const perMode = Object.fromEntries(MODES.map((mode) => [mode, { conversations: 0, steps: 0, accepted: 0, replayed: 0, stale: 0 }]));
  const conversationResults = [];
  const allStepResults = [];

  for (const conversation of fixtures.conversations) {
    const adapter = scope === "offline" ? createOfflineAdapter(conversation) : createLiveAdapter(conversation, env, fetchImpl);
    const stepResults = [];
    for (let index = 0; index < conversation.steps.length; index += 1) {
      const result = await adapter.execute(conversation.steps[index], index);
      stepResults.push(result);
      allStepResults.push(result);
    }
    const modeSummary = perMode[conversation.mode];
    modeSummary.conversations += 1;
    modeSummary.steps += stepResults.length;
    for (const result of stepResults) {
      if (result.status === "accepted") modeSummary.accepted += 1;
      if (result.status === "replayed") modeSummary.replayed += 1;
      if (result.status === "stale") modeSummary.stale += 1;
    }
    conversationResults.push({
      id: conversation.id,
      mode: conversation.mode,
      steps: stepResults.length,
      statuses: stepResults.reduce((out, result) => {
        const status = result.status || (result.ok ? "http_ok" : "http_error");
        out[status] = (out[status] || 0) + 1;
        return out;
      }, {}),
      response_text_retained: false,
    });
  }

  const switchChecks = allStepResults.flatMap((result) => result.switch_checks || []);
  const report = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    evidence_scope: scope === "offline" ? "offline_contract" : "live_api_contract",
    model_behavior_evaluated: false,
    model_response_contract_observed: scope === "live",
    disclaimer: scope === "offline"
      ? "This report validates fixture execution and deterministic state-contract invariants only. It does not replay or score model answers, pedagogy, OCR, speech, browser rendering, or production behavior."
      : "This report observes HTTP and structured response contracts only; it does not semantically score assistant text and never stores tokens or assistant response text. Voice fixtures exercise the post-transcription chat contract, not microphone capture or transcription quality.",
    totals: {
      conversations: fixtures.conversations.length,
      steps: allStepResults.length,
      personas: fixtures.personas.length,
      subscription_access_paths: fixtures.subscriptionGates.paths.length,
    },
    per_mode: perMode,
    checks: {
      counter_integrity: passCount(allStepResults, "counter_integrity"),
      idempotency: passCount(allStepResults, "idempotency_check"),
      stale_answers: passCount(allStepResults, "stale_check"),
      refresh: passCount(allStepResults, "refresh_check"),
      mode_switch_isolation: { checked: switchChecks.length, passed: switchChecks.filter((check) => check.passed).length },
      privacy: passCount(allStepResults, "privacy_check"),
    },
    privacy: {
      raw_inputs_written: false,
      assistant_response_text_written: false,
      image_or_audio_payloads_written: false,
      secrets_written: false,
    },
    conversations: conversationResults,
  };
  return report;
}

export function writeReport(report, outputPath) {
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
}

async function main() {
  const args = parseArgs();
  const report = await runMatrix({ scope: args.scope });
  if (args.writeReport) writeReport(report, args.output);
  const summary = {
    evidence_scope: report.evidence_scope,
    conversations: report.totals.conversations,
    steps: report.totals.steps,
    checks: report.checks,
    report: args.writeReport ? args.output : null,
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`Matrix runner failed: ${String(error?.message || error)}\n`);
    process.exitCode = 1;
  });
}
