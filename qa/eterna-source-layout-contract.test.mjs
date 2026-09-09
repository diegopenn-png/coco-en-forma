import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("Eterna has one canonical Worker entrypoint", () => {
  const wrangler = readFileSync("eterna-worker/wrangler.jsonc", "utf8");
  const worker = readFileSync("eterna-worker/src/index.js", "utf8");
  const preview = readFileSync(".github/workflows/eterna-authenticated-preview.yml", "utf8");

  assert.match(wrangler, /"main"\s*:\s*"src\/index\.js"/);
  assert.match(wrangler, /"ai"\s*:\s*\{\s*"binding"\s*:\s*"AI"/);
  assert.match(wrangler, /"AI_PROVIDER"\s*:\s*"cloudflare"/);
  assert.match(wrangler, /"TUTOR_MODEL"\s*:\s*"@cf\/qwen\/qwen3-30b-a3b-fp8"/);
  assert.match(wrangler, /"ENABLE_OPENAI_FALLBACK"\s*:\s*"true"/);
  assert.match(wrangler, /"OPENAI_FALLBACK_MODEL"\s*:\s*"gpt-5\.6-luna"/);
  assert.match(wrangler, /"VERIFIER_MODEL"\s*:\s*"@cf\/meta\/llama-3\.1-8b-instruct-fast"/);
  assert.match(wrangler, /"TUTOR_REASONING_EFFORT"\s*:\s*"high"/);
  assert.match(wrangler, /"VERIFIER_REASONING_EFFORT"\s*:\s*"high"/);
  assert.match(worker, /160\.98\.0-human-teacher/);
  assert.match(worker, /explicit_identity_and_mission_v1:true/);
  assert.match(worker, /empathetic_school_peer_support_v1:true/);
  assert.match(worker, /academic_weather_question_v1:true/);
  assert.match(worker, /combined_simplification_request_v1:true/);
  assert.match(worker, /pedagogical_simplification_guard_v1:true/);
  assert.match(worker, /non_trivial_microcheck_v1:true/);
  assert.match(worker, /deterministic_fraction_simplification_v1:true/);
  assert.match(worker, /priority_fraction_simplification_v1:true/);
  assert.match(worker, /reasoning:\{effort\}/);
  assert.match(worker, /flagship_tutor_model_v1:true/);
  assert.match(worker, /openai_automatic_fallback_v2:openaiFallbackEnabled\(env\)/);
  assert.match(worker, /normalized_provider_usage_v1:true/);
  assert.match(worker, /fallback_aware_dependency_probe_v1:true/);
  assert.match(worker, /!image&&!topicReturnRequest\(text,incomingPedState\)/);
  assert.match(worker, /model_configuration:modelConfiguration\(env\)/);
  assert.match(preview, /--var "AI_PROVIDER:cloudflare"/);
  assert.match(preview, /--var "TUTOR_MODEL:@cf\/qwen\/qwen3-30b-a3b-fp8"/);
  assert.match(preview, /--var "OPENAI_FALLBACK_MODEL:gpt-5\.6-luna"/);
  assert.match(preview, /models\.tutor\?\.model === "@cf\/qwen\/qwen3-30b-a3b-fp8"/);
  assert.match(preview, /models\.verifier\?\.model === "@cf\/meta\/llama-3\.1-8b-instruct-fast"/);
  assert.doesNotMatch(wrangler, /gpt-5\.4-(?:mini|nano)/);
  assert.equal(existsSync("eterna-worker/src/src/index.js"), false);
});

test("the 160.98.0 production gate verifies the resilient human tutor route before release", () => {
  const production = readFileSync(".github/workflows/eterna-worker-production-160960.yml", "utf8");
  assert.match(production, /\.github\/release-eterna-160960/);
  assert.match(production, /EXPECTED_VERSION: 160\.98\.0-human-teacher/);
  assert.match(production, /--var "AI_PROVIDER:cloudflare"/);
  assert.match(production, /--var "TUTOR_MODEL:@cf\/qwen\/qwen3-30b-a3b-fp8"/);
  assert.match(production, /--var "ENABLE_OPENAI_FALLBACK:true"/);
  assert.match(production, /--var "OPENAI_FALLBACK_MODEL:gpt-5\.6-luna"/);
  assert.match(production, /models\.tutor\?\.reasoning_effort === "high"/);
  assert.match(production, /models\.verifier\?\.model === "@cf\/meta\/llama-3\.1-8b-instruct-fast"/);
  assert.match(production, /payload\.features\?\.adaptive_sync_verification_v1 === true/);
  assert.match(production, /payload\.features\?\.asynchronous_verifier_audit_v1 === true/);
  assert.match(production, /payload\.features\?\.deterministic_exam_intake_v1 === true/);
  assert.match(production, /payload\.features\?\.exam_tutor_recovery_v1 === true/);
  assert.match(production, /payload\.features\?\.structured_request_retry_v1 === true/);
  assert.match(production, /payload\.features\?\.structured_compatibility_retry_v1 === true/);
  assert.match(production, /payload\.features\?\.tutor_model_failover_v1 === true/);
  assert.match(production, /payload\.features\?\.stable_fact_tutor_recovery_v1 === true/);
  assert.match(production, /payload\.features\?\.scope_model_failover_v1 === true/);
  assert.match(production, /payload\.features\?\.moderation_request_retry_v1 === true/);
  assert.match(production, /payload\.features\?\.moderation_diagnostics_v1 === true/);
  assert.match(production, /payload\.features\?\.degraded_safe_academic_moderation_v1 === true/);
  assert.match(production, /payload\.features\?\.openai_automatic_fallback_v2 === true/);
  assert.match(production, /payload\.features\?\.explicit_identity_and_mission_v1 === true/);
  assert.match(production, /payload\.features\?\.empathetic_school_peer_support_v1 === true/);
  assert.match(production, /for \(const name of \["moderation", "structured_tutor"\]\)/);
  assert.match(production, /wrangler versions deploy/);
  assert.match(production, /wrangler rollback/);
});


test("Eterna coherence and voice contracts stay wired into the PWA", () => {
  const worker = readFileSync("eterna-worker/src/index.js", "utf8");
  const core = readFileSync("eterna-v159.js", "utf8");
  const experience = readFileSync("eterna-experience-v160.js", "utf8");
  const serviceWorker = readFileSync("sw.js", "utf8");
  const bootstrap = readFileSync("coco-v153-fixes.js", "utf8");

  assert.match(worker, /answer_contract_engine_v1:true/);
  assert.match(worker, /coherence_progression_v1:true/);
  const modeBar = core.slice(core.indexOf("function renderModeBar"), core.indexOf("function setStatus"));
  assert.match(modeBar, /data-et-converse/);
  assert.match(modeBar, /eternaV160ConversationIcon/);
  assert.match(modeBar, /Habla y Eterna te responde con su voz/);
  assert.equal((modeBar.match(/<button[^>]+data-et-converse(?:\s|>)/g) || []).length, 1);
  assert.match(core, /api\("\/v1\/speak"/);
  assert.doesNotMatch(core, /new SpeechSynthesisUtterance/);
  assert.doesNotMatch(core, /speechSynthesis\.speak/);
  assert.match(experience, /ETERNA Spoken Dialogue v160\.94\.9/);
  assert.match(core, /await send\(\)/);
  assert.match(core, /speak\(reply,1,null,voiceDialog\)/);
  assert.match(core, /__ETERNA_VOICE_AUDIO__/);
  assert.match(core, /__ETERNA_SUPPRESS_SYNTHETIC_LISTEN_UNTIL__/);
  assert.match(core, /e\.isTrusted===false/);
  assert.match(core, /for\(var attempt=0;attempt<2;attempt\+\+\)/);
  assert.match(experience, /__ETERNA_VOICE_DIALOG_ACTIVE__/);
  assert.match(experience, /eternaV160Conversation/);
  assert.match(experience, /grid-column:1\/-1/);
  assert.match(serviceWorker, /160\.98\.0-human-teacher-r1/);
  assert.match(serviceWorker, /fresh\.searchParams\.set\("__coco_release",CACHE_VERSION\)/);
  assert.match(bootstrap, /eterna-experience-v160\.js\?v=1609410/);
});


test("Eterna start voice actions use the same modern microphone icon as the composer", () => {
  const core = readFileSync("eterna-v159.js", "utf8");

  assert.match(core, /function startActionLabel\(action\)/);
  assert.match(core, /eternaV160MicSvg eternaV160StartMicSvg/);
  assert.match(core, /M12 14\.75a3\.75 3\.75/);
  assert.match(core, /\["voice","Decir el tema por voz","Yo lo transcribo"\]/);
  assert.doesNotMatch(core, /🎙️ Decir el tema por voz/);
});

test("Eterna preserves recoverable questions while showing the actual failure category", () => {
  const core = readFileSync("eterna-v159.js", "utf8");
  assert.match(core, /function chatErrorPresentation\(code\)/);
  assert.match(core, /STUDENT_PROFILE_REQUIRED:\{message:/);
  assert.match(core, /ETERNA_LEGAL_ACCEPTANCE_REQUIRED:\{message:/);
  assert.match(core, /ETERNA_BACKEND_ERROR:\{message:/);
  assert.match(core, /if\(data&&data\.reply\)\{var recovered=applyChatResponse/);
  assert.doesNotMatch(core, /Ahora no puedo comprobar esta tarea con suficiente seguridad/);
});
