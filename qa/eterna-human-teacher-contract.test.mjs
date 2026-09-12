import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("the bottom composer exposes an accessible Pensando indicator", () => {
  const core = read("eterna-v159.js");
  const css = read("eterna-v159.css");
  const composer = core.slice(core.indexOf('<div class="eternaV159Composer"'), core.indexOf("</main>"));

  assert.match(core, /160\.98\.0-human-teacher/);
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
  assert.match(index, /eterna-v159\.js\?v=160100/);
  assert.match(index, /sw\.js\?v=160100-r1/);
  assert.match(serviceWorker, /CACHE_VERSION="coco-en-forma-v160\.100\.0-family-profile-reports-r1"/);
});
