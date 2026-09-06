import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../../", import.meta.url);
const client = readFileSync(new URL("eterna-v159.js", root), "utf8");
const experience = readFileSync(new URL("eterna-experience-v160.js", root), "utf8");
const hotfix = readFileSync(new URL("eterna-hotfix-v160902.js", root), "utf8");
const index = readFileSync(new URL("index.html", root), "utf8");
const serviceWorker = readFileSync(new URL("sw.js", root), "utf8");
const bootstrap = readFileSync(new URL("coco-v153-fixes.js", root), "utf8");
const shareCatalog = readFileSync(new URL("share/catalog-v133.json", root), "utf8");

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
  assert.match(index, /coco-v153-fixes\.js\?v=15301/);
  assert.match(index, /eterna-v159\.js\?v=160941/);
  assert.match(bootstrap, /eterna-experience-v160\.js\?v=160944/);
  assert.match(index, /coco-v144-core\.js\?v=15001/);
  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.94\.5-game-difficulty-r1"/);
  assert.match(serviceWorker, /"\.\/eterna-state-contract-v3\.js"/);
  assert.match(serviceWorker, /ETERNA_EXPERIENCE_PATH="\.\/eterna-experience-v160\.js"/);
  assert.match(serviceWorker, /if\(eternaExperience\)\{e\.respondWith\(cachedPatch\(ETERNA_EXPERIENCE_PATH\)/);
  assert.match(serviceWorker, /ETERNA_HOTFIX_PATH="\.\/eterna-hotfix-v160902\.js"/);
  assert.match(serviceWorker, /basePromise=cachedPatch\(ETERNA_CORE_PATH\)/);
});

test("public game cards expose keyboard controls and Eterna announces login", () => {
  assert.match(bootstrap, /card\.setAttribute\("role","button"\)/);
  assert.match(bootstrap, /card\.setAttribute\("tabindex","0"\)/);
  assert.match(bootstrap, /aria-label","Inicia sesión para abrir /);
  assert.match(bootstrap, /event\.key!=="Enter"&&event\.key!==" "/);
  assert.match(bootstrap, /cocoMiniJuego\[role='button'\]:focus-visible/);
  assert.match(client, /Inicia sesión o crea una cuenta para abrir Eterna\./);
});

test("family learning reports explain signals, pluralise counts and hide retired English records", () => {
  for (const source of [client, experience]) {
    assert.match(source, /Una señal es una evidencia orientativa obtenida de una respuesta/);
    assert.match(source, /respuestas e intentos analizados/);
    assert.match(source, /señal observada","señales observadas/);
    assert.match(source, /"intento","intentos"/);
    assert.match(source, /ingles\(\[\^a-z\]\|\$\)/);
    assert.doesNotMatch(source, /label:"intentos o señales"/);
  }
  assert.match(bootstrap, /¿Qué significa “señal observada”\?/);
  assert.match(client, /suscripción activa/);
});

test("retired English public route and share assets are absent", () => {
  assert.equal(existsSync(new URL("juego/ingles/index.html", root)), false);
  assert.equal(existsSync(new URL("share/ingles.svg", root)), false);
  assert.equal(existsSync(new URL("share/ingles.png", root)), false);
  assert.doesNotMatch(shareCatalog, /ingles|inglés|english/i);
});
