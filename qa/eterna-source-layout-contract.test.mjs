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

  assert.match(worker, /answer_contract_engine_v1:true/);
  assert.match(worker, /coherence_progression_v1:true/);
  assert.match(core, /data-et-converse/);
  assert.match(core, /api\("\/v1\/speak"/);
  assert.doesNotMatch(core, /new SpeechSynthesisUtterance/);
  assert.doesNotMatch(core, /speechSynthesis\.speak/);
  assert.match(experience, /ETERNA Conversation Voice v160\.94\.7/);
  assert.match(experience, /\[data-et-listen\]/);
  assert.match(serviceWorker, /160\.94\.7-coherence-voice-r1/);
});
