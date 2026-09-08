import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("Eterna has one canonical Worker entrypoint", () => {
  const wrangler = readFileSync("eterna-worker/wrangler.jsonc", "utf8");
  const worker = readFileSync("eterna-worker/src/index.js", "utf8");
  const preview = readFileSync(".github/workflows/eterna-authenticated-preview.yml", "utf8");

  assert.match(wrangler, /"main"\s*:\s*"src\/index\.js"/);
  assert.match(wrangler, /"TUTOR_MODEL"\s*:\s*"gpt-5\.6-sol"/);
  assert.match(wrangler, /"VERIFIER_MODEL"\s*:\s*"gpt-5\.6-terra"/);
  assert.match(wrangler, /"TUTOR_REASONING_EFFORT"\s*:\s*"high"/);
  assert.match(wrangler, /"VERIFIER_REASONING_EFFORT"\s*:\s*"high"/);
  assert.match(worker, /160\.96\.0-full-intelligence-child-safety/);
  assert.match(worker, /reasoning:\{effort\}/);
  assert.match(worker, /flagship_tutor_model_v1:true/);
  assert.match(worker, /!image&&!topicReturnRequest\(text,incomingPedState\)/);
  assert.match(worker, /model_configuration:modelConfiguration\(env\)/);
  assert.match(preview, /--var "TUTOR_MODEL:gpt-5\.6-sol"/);
  assert.match(preview, /models\.tutor\?\.model === "gpt-5\.6-sol"/);
  assert.match(preview, /models\.verifier\?\.model === "gpt-5\.6-terra"/);
  assert.doesNotMatch(wrangler, /gpt-5\.4-(?:mini|nano)/);
  assert.equal(existsSync("eterna-worker/src/src/index.js"), false);
});

test("the 160.96 production gate verifies the exact model route before release", () => {
  const production = readFileSync(".github/workflows/eterna-worker-production-160960.yml", "utf8");
  assert.match(production, /\.github\/release-eterna-160960/);
  assert.match(production, /EXPECTED_VERSION: 160\.96\.0-full-intelligence-child-safety/);
  assert.match(production, /--var "TUTOR_MODEL:gpt-5\.6-sol"/);
  assert.match(production, /models\.tutor\?\.reasoning_effort === "high"/);
  assert.match(production, /models\.verifier\?\.model === "gpt-5\.6-terra"/);
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
  assert.match(serviceWorker, /160\.96\.0-launch-excellence-r1/);
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
