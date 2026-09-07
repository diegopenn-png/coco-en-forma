import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("Eterna has one canonical Worker entrypoint", () => {
  const wrangler = readFileSync("eterna-worker/wrangler.jsonc", "utf8");
  const worker = readFileSync("eterna-worker/src/index.js", "utf8");

  assert.match(wrangler, /"main"\s*:\s*"src\/index\.js"/);
  assert.match(worker, /160\.94\.7-coherence-engine/);
  assert.equal(existsSync("eterna-worker/src/src/index.js"), false);
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
  assert.match(serviceWorker, /160\.94\.11-uniform-mic-football-rayo-r1/);
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
