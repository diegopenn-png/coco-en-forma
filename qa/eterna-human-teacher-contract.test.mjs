import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("the bottom composer exposes an accessible Pensando indicator", () => {
  const core = read("eterna-v159.js");
  const css = read("eterna-v159.css");
  const composer = core.slice(core.indexOf('<div class="eternaV159Composer"'), core.indexOf("</main>"));

  assert.match(core, /160\.98\.2-greeting-timing/);
  assert.match(composer, /data-et-thinking role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(composer, /<span>Pensando…<\/span>/);
  assert.ok(composer.indexOf("data-et-thinking") < composer.indexOf("eternaV159InputRow"));
  assert.match(css, /\.eternaV160Thinking\{display:none;/);
  assert.match(css, /\.eternaV160Thinking\.is-visible\{display:flex\}/);
  assert.match(css, /@keyframes eternaThinking/);
});

test("Pensando follows every request lifecycle and cannot remain stuck", () => {
  const core = read("eterna-v159.js");
  const experience = read("eterna-experience-v160.js");
  const voiceAutocut = read("eterna-voice-autocut-v160907.js");
  const setThinking = core.slice(core.indexOf("function setThinking"), core.indexOf("function setResultStatus"));
  const send = core.slice(core.indexOf("async function send(options)"), core.indexOf("async function feedback"));
  const invalidate = core.slice(core.indexOf("function invalidateInFlight"), core.indexOf("function closeActivity"));
  const showThinking = experience.slice(experience.indexOf("function showThinking"), experience.indexOf("function fileNameForMime"));

  assert.match(setThinking, /thinking\.hidden=!isActive/);
  assert.match(setThinking, /classList\.toggle\("is-visible",isActive\)/);
  assert.match(setThinking, /chat\.setAttribute\("aria-busy",isActive\?"true":"false"\)/);
  assert.match(send, /state\.busy=true;[^\n]*setThinking\(true\)/);
  assert.match(send, /finally\{[^\n]*setThinking\(false\)/);
  assert.match(invalidate, /setThinking\(false\)/);
  assert.match(showThinking, /clearThinkingStages\(\);[\s\S]*setLive\("",""\)/);
  assert.doesNotMatch(showThinking, /setLive\("thinking"/);
  assert.doesNotMatch(voiceAutocut, /eternaV160LiveState|Enviando tu pregunta|showProgress/);
  assert.match(read("eterna-hotfix-v160902.js"), /eterna-voice-autocut-v160907\.js\?v=160981/);
});

test("the PWA invalidates the human-teacher assets as one release", () => {
  const index = read("index.html");
  const serviceWorker = read("sw.js");

  assert.match(index, /eterna-v159\.css\?v=160980/);
  assert.match(index, /eterna-v159\.js\?v=160102/);
  assert.match(index, /sw\.js\?v=160102-r3/);
  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.100\.2-greeting-timing-r3"/);
});

test("relational turns stay human, transient and separate from the suspended lesson", () => {
  const client = read("eterna-v159.js");
  const worker = read("eterna-worker/src/index.js");
  const resolver = client.slice(client.indexOf("function resolveContextualTurn"), client.indexOf("function inferTutorAct"));
  const relationalTutor = worker.slice(worker.indexOf("async function relationalTutor"), worker.indexOf("async function currentWeatherLookup"));

  assert.match(client, /relational_thread:null/);
  assert.match(resolver, /relationalActive=Boolean/);
  assert.match(resolver, /intent="relational_followup"/);
  assert.match(client, /turn\.intent==="relational_followup"\?"continue"/);
  assert.match(worker, /relational_continuity_v1:true/);
  assert.match(worker, /transient_relational_thread_v1:true/);
  assert.match(worker, /no_raw_chat_persistence:true/);
  assert.match(relationalTutor, /No repitas el mismo aviso/i);
  assert.match(relationalTutor, /No fuerces el regreso a los deberes/i);
  assert.match(relationalTutor, /como máximo UNA pregunta natural/i);
  assert.match(relationalTutor, /no fomentes dependencia/i);
});

test("greetings use local time once per conversational window", () => {
  const client = read("eterna-v159.js");
  const worker = read("eterna-worker/src/index.js");
  const greetingGuard = worker.slice(worker.indexOf("const GREETING_PERIODS"), worker.indexOf("function eternaIdentityReply"));
  const chatWrapper = worker.slice(worker.indexOf("async function handleChat("), worker.indexOf("async function handleChatCore"));

  assert.match(client, /GREETING_KEY_PREFIX="coco_eterna_greeting_v1:"/);
  assert.match(client, /function clientClock\(\)/);
  assert.match(client, /client_clock:clientClock\(\)/);
  assert.match(client, /client_greeting_state:clientGreetingState\(\)/);
  assert.match(client, /saveGreetingState\(data\.greeting_state\)/);
  assert.match(client, /startTitle=openingGreeting\(studentName\)\+p\.title/);
  assert.match(greetingGuard, /first\|\|newDay\|\|periodChanged/);
  assert.match(greetingGuard, /if\(!allowed&&prefix\)reply=stripLeadingGreeting/);
  assert.match(greetingGuard, /"¡Buenos días!"/);
  assert.match(greetingGuard, /"¡Buenas tardes!"/);
  assert.match(greetingGuard, /"¡Buenas noches!"/);
  assert.match(chatWrapper, /applyGreetingContinuity/);
  assert.match(worker, /greeting_timing_v1:true/);
  assert.match(worker, /repeated_greeting_guard_v1:true/);
  assert.match(worker, /no_raw_chat_persistence:true/);
});
