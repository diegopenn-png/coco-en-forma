import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const client = readFileSync(new URL("eterna-v159.js", root), "utf8");
const experience = readFileSync(new URL("eterna-experience-v160.js", root), "utf8");
const hotfix = readFileSync(new URL("eterna-hotfix-v160902.js", root), "utf8");
const index = readFileSync(new URL("index.html", root), "utf8");
const serviceWorker = readFileSync(new URL("sw.js", root), "utf8");
const bootstrap = readFileSync(new URL("coco-v153-fixes.js", root), "utf8");

test("the canonical client sends and receives pedagogical_state", () => {
  assert.match(client, /pedagogical_state\s*:\s*state\.pedagogicalState/);
  assert.match(client, /state\.pedagogicalState\s*=\s*data\.pedagogical_state/);
});

test("an explicit topic change wins over a pending answer phase", () => {
  assert.match(client, /explicitSwitch=.*vale\|ok[\s\S]{0,180}ahora[\s\S]{0,180}cambio de tema/);
  assert.match(client, /turn\.intent==="new_topic"\?"new_topic":activity\.phase==="WAIT"\?"answer"/);
});

test("abstract learning state is rehydrated without storing child chat", () => {
  assert.match(client, /sessionStorage\.setItem\(LEARNING_SESSION_KEY/);
  assert.match(client, /sessionStorage\.getItem\(LEARNING_SESSION_KEY/);
  assert.doesNotMatch(client, /sessionStorage\.setItem\([^\n]+history/);
  assert.match(client, /function resetAccountLearningState\(\).*state\.history=\[\]/);
});

test("legacy layers delegate to the canonical state contract", () => {
  assert.match(experience, /if\(!b\.pedagogical_state\s*&&\s*lastPedagogicalState/);
  assert.match(hotfix, /client_state_contract\s*>=\s*2/);
});

test("Practice exposes counters and difficulty, not only focus", () => {
  assert.match(client, /Práctica\s+\d|Ejercicio.*Aciertos|Aciertos.*Errores.*Nivel/);
});

test("web entrypoint and Service Worker invalidate the corrected assets together", () => {
  assert.match(index, /eterna-state-contract-v3\.js\?v=160920/);
  assert.match(index, /eterna-v159\.js\?v=160920/);
  assert.match(bootstrap, /eterna-experience-v160\.js\?v=160920/);
  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.92\.0-six-modes-state-contract-v3"/);
  assert.match(serviceWorker, /"\.\/eterna-state-contract-v3\.js"/);
  assert.match(serviceWorker, /"\.\/eterna-experience-v160\.js"/);
  assert.match(serviceWorker, /ETERNA_HOTFIX_PATH="\.\/eterna-hotfix-v160902\.js"/);
});
